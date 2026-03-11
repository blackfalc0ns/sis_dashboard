import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { getOrCreateSession, upsertEntry } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import type { AttachmentMeta as RollCallAttachmentMeta } from "@/features/attendance/roll-call/types";
import type { ExcuseRequest } from "../types";
import { normalizeSelectedPeriodIds } from "../../utils/periodIdNormalization";
import { formatLocalDate } from "../../utils/dateFormatting";

interface ApplyExcuseParams {
  request: ExcuseRequest;
  decidedBy?: string;
}

const POLICY_PRIORITY: Array<AttendancePolicy["scopeType"]> = ["SECTION", "GRADE", "STAGE", "SCHOOL"];

function enumerateDates(dateFrom: string, dateTo: string): string[] {
  const result: string[] = [];
  const current = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);

  while (current <= end) {
    result.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function resolveEffectivePolicy(
  policies: AttendancePolicy[],
  date: string,
  scopeType: ExcuseRequest["scopeType"],
  scopeIds: ExcuseRequest["scopeIds"]
): AttendancePolicy | null {
  const active = policies.filter((policy) => {
    if (!policy.isActive) return false;
    if (date < policy.effectiveStartDate || date > policy.effectiveEndDate) return false;
    return true;
  });

  for (const priority of POLICY_PRIORITY) {
    const match = active.find((policy) => {
      if (policy.scopeType !== priority) return false;
      if (priority === "SCHOOL") return true;
      if (priority === "STAGE") return policy.scopeIds?.stageId === scopeIds?.stageId;
      if (priority === "GRADE") return policy.scopeIds?.gradeId === scopeIds?.gradeId;
      return policy.scopeIds?.sectionId === scopeIds?.sectionId;
    });

    if (match) return match;
  }

  return null;
}

async function fetchTimetablePeriodsForScope(
  termId: string,
  scopeType: ExcuseRequest["scopeType"],
  scopeIds: ExcuseRequest["scopeIds"]
): Promise<TimetablePeriod[]> {
  const termConfig = await fetchTimetableConfig(termId, "TERM");
  
  let gradeConfig = null;
  if (scopeIds?.gradeId) {
    gradeConfig = await fetchTimetableConfig(termId, "GRADE", scopeIds.gradeId);
  }
  
  let sectionConfig = null;
  if (scopeIds?.sectionId) {
    sectionConfig = await fetchTimetableConfig(termId, "SECTION", scopeIds.sectionId);
  }

  const resolved = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);
  return resolved.periods;
}

function choosePeriodIds(
  request: ExcuseRequest,
  policy: AttendancePolicy,
  periods: TimetablePeriod[]
): string[] {
  // Normalize policy's selected period IDs
  const normalizedPolicyPeriods = normalizeSelectedPeriodIds(
    policy.selectedPeriodIds || [],
    periods
  );

  if (request.type === "ABSENCE") {
    // For absence, use all selected periods from policy
    return normalizedPolicyPeriods.length > 0 ? normalizedPolicyPeriods : [periods[0]?.id].filter(Boolean);
  }

  // For LATE/EARLY_LEAVE, prefer selectedPeriodIds (new format)
  if (request.selectedPeriodIds && request.selectedPeriodIds.length > 0) {
    // Normalize request's period IDs
    return normalizeSelectedPeriodIds(request.selectedPeriodIds, periods);
  }

  // Fallback: check if request has legacy periodIndexes
  if (request.periodIndexes && request.periodIndexes.length > 0) {
    // Map legacy indexes to period IDs
    return request.periodIndexes
      .map((index) => periods.find((p) => p.index === index)?.id)
      .filter((id): id is string => id !== undefined);
  }

  // Use policy periods as last resort
  if (normalizedPolicyPeriods.length === 0) {
    return [periods[0]?.id].filter(Boolean);
  }

  if (request.type === "LATE") {
    // First period
    return [normalizedPolicyPeriods[0]];
  }

  // EARLY_LEAVE - last period
  return [normalizedPolicyPeriods[normalizedPolicyPeriods.length - 1]];
}

function mapAttachments(attachments: ExcuseRequest["attachments"]): RollCallAttachmentMeta[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    uploadedAt: new Date().toISOString(),
  }));
}

export async function applyExcuseToAttendance({ request }: ApplyExcuseParams): Promise<string[]> {
  const policies = await fetchPolicies(request.yearId, request.termId);
  const dates = enumerateDates(request.dateFrom, request.dateTo);
  const linkedSessionIds = new Set<string>();

  // Fetch timetable periods for the request's scope
  const periods = await fetchTimetablePeriodsForScope(
    request.termId,
    request.scopeType,
    request.scopeIds
  );

  for (const date of dates) {
    const effectivePolicy = resolveEffectivePolicy(policies, date, request.scopeType, request.scopeIds);
    console.log(effectivePolicy)
    if (!effectivePolicy || !effectivePolicy.allowExcuses) {
      throw new Error("Excuses are not allowed by policy for one or more dates in this request.");
    }

    if (effectivePolicy.requireAttachmentForExcuse && request.attachments.length === 0) {
      throw new Error("Attachment is required by policy for approval.");
    }

    // Choose target period IDs based on request type and policy
    const targetPeriodIds = choosePeriodIds(request, effectivePolicy, periods);

    for (const periodId of targetPeriodIds) {
      const periodData = periods.find((p) => p.id === periodId);
      
      if (!periodData) {
        console.warn(`Period ${periodId} not found in timetable, skipping`);
        continue;
      }

      const sessionData = await getOrCreateSession({
        yearId: request.yearId,
        termId: request.termId,
        date,
        scopeType: request.scopeType,
        scopeIds: request.scopeIds,
        mode: "PERIOD",
        periodId: periodData.id,
        periodIndex: periodData.index,
        periodNameAr: periodData.nameAr,
        periodNameEn: periodData.nameEn,
      });

      linkedSessionIds.add(sessionData.session.id);

      await upsertEntry(request.yearId, request.termId, sessionData.session.id, request.studentId, {
        status: "EXCUSED",
        excuseReason: request.reasonEn || request.reasonAr,
        excuseAttachments: mapAttachments(request.attachments),
      });
    }
  }

  return Array.from(linkedSessionIds);
}
