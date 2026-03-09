import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { getOrCreateSession, upsertEntry } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import type { AttachmentMeta as RollCallAttachmentMeta } from "@/features/attendance/roll-call/types";
import type { ExcuseRequest } from "../types";

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
    result.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function parsePeriodIds(selectedPeriodIds: string[] | undefined): number[] {
  if (!selectedPeriodIds || selectedPeriodIds.length === 0) return [];
  return selectedPeriodIds
    .map((id) => {
      const match = id.match(/(\d+)$/);
      return match ? Number(match[1]) : NaN;
    })
    .filter((value) => Number.isFinite(value));
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

function choosePeriods(request: ExcuseRequest, policy: AttendancePolicy): number[] {
  const policyPeriods = parsePeriodIds(policy.selectedPeriodIds);

  if (request.type === "ABSENCE") {
    return policyPeriods.length > 0 ? policyPeriods : [1];
  }

  if (request.periodIndexes && request.periodIndexes.length > 0) {
    return request.periodIndexes;
  }

  if (policyPeriods.length === 0) {
    return [1];
  }

  if (request.type === "LATE") {
    return [policyPeriods[0]];
  }

  return [policyPeriods[policyPeriods.length - 1]];
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

  for (const date of dates) {
    const effectivePolicy = resolveEffectivePolicy(policies, date, request.scopeType, request.scopeIds);

    if (!effectivePolicy || !effectivePolicy.allowExcuses) {
      throw new Error("Excuses are not allowed by policy for one or more dates in this request.");
    }

    if (effectivePolicy.requireAttachmentForExcuse && request.attachments.length === 0) {
      throw new Error("Attachment is required by policy for approval.");
    }

    const periods = choosePeriods(request, effectivePolicy);

    for (const periodIndex of periods) {
      const sessionData = await getOrCreateSession({
        yearId: request.yearId,
        termId: request.termId,
        date,
        scopeType: request.scopeType,
        scopeIds: request.scopeIds,
        mode: "PERIOD",
        periodIndex,
        periodNameAr: `الحصة ${periodIndex}`,
        periodNameEn: `Period ${periodIndex}`,
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
