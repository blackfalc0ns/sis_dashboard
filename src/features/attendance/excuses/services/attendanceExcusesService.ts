import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { applyExcuseToAttendance } from "../utils/applyExcuseToAttendance";
import type {
  ExcuseRequest,
  ExcuseRequestFilters,
  ExcuseValidationErrors,
  ExcuseScopeType,
  ExcuseStatus,
} from "../types";

const excusesByTerm: Record<string, ExcuseRequest[]> = {};

const POLICY_PRIORITY: Array<AttendancePolicy["scopeType"]> = ["SECTION", "GRADE", "STAGE", "SCHOOL"];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getKey = (yearId: string, termId: string) => `${yearId}-${termId}`;

function resolveEffectivePolicy(
  policies: AttendancePolicy[],
  date: string,
  scopeType: ExcuseScopeType,
  scopeIds?: { stageId?: string; gradeId?: string; sectionId?: string }
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

function overlapsRange(
  request: ExcuseRequest,
  dateFrom?: string,
  dateTo?: string
): boolean {
  if (!dateFrom && !dateTo) return true;
  const from = dateFrom || request.dateFrom;
  const to = dateTo || request.dateTo;

  return request.dateFrom <= to && request.dateTo >= from;
}

function resolveScopeFromRequest(
  request: ExcuseRequest,
  gradesById: Map<string, { stageId: string }>,
  sectionsById: Map<string, { gradeId: string }>
) {
  const sectionId = request.scopeIds?.sectionId;
  const gradeIdFromSection = sectionId ? sectionsById.get(sectionId)?.gradeId : undefined;
  const gradeId = request.scopeIds?.gradeId || gradeIdFromSection;
  const stageId = request.scopeIds?.stageId || (gradeId ? gradesById.get(gradeId)?.stageId : undefined);

  return { stageId, gradeId, sectionId };
}

function scopeMatches(
  request: ExcuseRequest,
  scopeType: ExcuseRequestFilters["scopeType"],
  scopeIds: ExcuseRequestFilters["scopeIds"],
  gradesById: Map<string, { stageId: string }>,
  sectionsById: Map<string, { gradeId: string }>
) {
  if (scopeType === "SCHOOL") return true;

  const resolved = resolveScopeFromRequest(request, gradesById, sectionsById);

  if (scopeType === "STAGE") return resolved.stageId === scopeIds?.stageId;
  if (scopeType === "GRADE") return resolved.gradeId === scopeIds?.gradeId;
  return resolved.sectionId === scopeIds?.sectionId;
}

export async function fetchExcuseRequests(
  params: { yearId: string; termId: string } & Partial<ExcuseRequestFilters>
): Promise<ExcuseRequest[]> {
  await delay(80);

  const {
    yearId,
    termId,
    dateFrom,
    dateTo,
    scopeType = "SCHOOL",
    scopeIds,
    status = "ALL",
    type = "ALL",
    search = "",
    hasAttachment = "ALL",
  } = params;

  const key = getKey(yearId, termId);
  const store = excusesByTerm[key] || [];
  const structure = await fetchStructureTree(yearId, termId);
  const gradesById = new Map(structure.grades.map((grade) => [grade.id, { stageId: grade.stageId }]));
  const sectionsById = new Map(structure.sections.map((section) => [section.id, { gradeId: section.gradeId }]));

  const filtered = store.filter((request) => {
    if (!overlapsRange(request, dateFrom, dateTo)) return false;
    if (!scopeMatches(request, scopeType, scopeIds, gradesById, sectionsById)) return false;
    if (status !== "ALL" && request.status !== status) return false;
    if (type !== "ALL" && request.type !== type) return false;

    if (hasAttachment === "YES" && request.attachments.length === 0) return false;
    if (hasAttachment === "NO" && request.attachments.length > 0) return false;

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      const haystack = [request.studentNameAr, request.studentNameEn, request.studentNumber || ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createExcuseRequest(
  payload: Omit<ExcuseRequest, "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds">
): Promise<ExcuseRequest> {
  await delay(120);

  const key = getKey(payload.yearId, payload.termId);
  if (!excusesByTerm[key]) excusesByTerm[key] = [];

  const now = new Date().toISOString();
  const newRequest: ExcuseRequest = {
    ...payload,
    id: `excuse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  excusesByTerm[key].push(newRequest);
  return newRequest;
}

export async function updateExcuseRequest(
  id: string,
  payload: Partial<Omit<ExcuseRequest, "id" | "yearId" | "termId" | "createdAt" | "status" | "decidedAt" | "decidedBy">>,
  options?: { allowStatusOverride?: boolean }
): Promise<ExcuseRequest> {
  await delay(100);

  for (const key of Object.keys(excusesByTerm)) {
    const index = excusesByTerm[key].findIndex((request) => request.id === id);
    if (index === -1) continue;

    const current = excusesByTerm[key][index];
    if (current.status !== "PENDING" && !options?.allowStatusOverride) {
      throw new Error("Only pending requests can be edited.");
    }

    const updated: ExcuseRequest = {
      ...current,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    excusesByTerm[key][index] = updated;
    return updated;
  }

  throw new Error("Excuse request not found");
}

export async function deleteExcuseRequest(
  id: string,
  options?: { allowStatusOverride?: boolean }
): Promise<void> {
  await delay(100);

  for (const key of Object.keys(excusesByTerm)) {
    const index = excusesByTerm[key].findIndex((request) => request.id === id);
    if (index === -1) continue;

    const current = excusesByTerm[key][index];
    if (current.status !== "PENDING" && !options?.allowStatusOverride) {
      throw new Error("Only pending requests can be deleted.");
    }

    excusesByTerm[key].splice(index, 1);
    return;
  }

  throw new Error("Excuse request not found");
}

async function updateDecision(
  id: string,
  status: Extract<ExcuseStatus, "APPROVED" | "REJECTED">,
  decisionNote?: string,
  decidedBy?: string
): Promise<ExcuseRequest> {
  for (const key of Object.keys(excusesByTerm)) {
    const index = excusesByTerm[key].findIndex((request) => request.id === id);
    if (index === -1) continue;

    const request = excusesByTerm[key][index];
    if (request.status !== "PENDING") {
      throw new Error("Only pending requests can be decided.");
    }

    let linkedSessionIds = request.linkedSessionIds;

    if (status === "APPROVED") {
      linkedSessionIds = await applyExcuseToAttendance({ request, decidedBy });
    }

    const updated: ExcuseRequest = {
      ...request,
      status,
      decisionNote,
      decidedBy,
      decidedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedSessionIds,
    };

    excusesByTerm[key][index] = updated;
    return updated;
  }

  throw new Error("Excuse request not found");
}

export async function approveExcuseRequest(id: string, decisionNote?: string, decidedBy?: string) {
  await delay(120);
  return updateDecision(id, "APPROVED", decisionNote, decidedBy);
}

export async function rejectExcuseRequest(id: string, decisionNote?: string, decidedBy?: string) {
  await delay(120);
  return updateDecision(id, "REJECTED", decisionNote, decidedBy);
}

export async function validateExcuseRequest(
  payload: Partial<ExcuseRequest>,
  effectivePolicy: AttendancePolicy | null,
  termRange: { startDate: string; endDate: string }
): Promise<ExcuseValidationErrors> {
  const errors: ExcuseValidationErrors = {};

  if (!payload.studentId) {
    errors.studentId = "Student is required";
  }

  if (!payload.type) {
    errors.type = "Type is required";
  }

  if (!payload.dateFrom) {
    errors.dateFrom = "Start date is required";
  }

  if (!payload.dateTo) {
    errors.dateTo = "End date is required";
  }

  if (payload.dateFrom && payload.dateTo && payload.dateFrom > payload.dateTo) {
    errors.dateTo = "End date must be after start date";
  }

  if (payload.dateFrom && (payload.dateFrom < termRange.startDate || payload.dateFrom > termRange.endDate)) {
    errors.dateFrom = "Date must be within term range";
  }

  if (payload.dateTo && (payload.dateTo < termRange.startDate || payload.dateTo > termRange.endDate)) {
    errors.dateTo = "Date must be within term range";
  }

  const reasonAr = payload.reasonAr?.trim() || "";
  const reasonEn = payload.reasonEn?.trim() || "";
  if (!reasonAr && !reasonEn) {
    errors.reason = "At least one reason language is required";
  }

  // Validate period selection for LATE and EARLY_LEAVE
  if (payload.type === "LATE" || payload.type === "EARLY_LEAVE") {
    const hasPeriods = (payload.selectedPeriodIds && payload.selectedPeriodIds.length > 0) ||
                       (payload.periodIndexes && payload.periodIndexes.length > 0);
    if (!hasPeriods) {
      errors.selectedPeriodIds = "Period selection is required for late/early leave requests";
    }
  }

  if (effectivePolicy && !effectivePolicy.allowExcuses) {
    errors.policy = "Excuses are disabled by policy";
  }

  if (effectivePolicy?.requireAttachmentForExcuse && (payload.attachments?.length || 0) === 0) {
    errors.attachments = "Attachment is required by policy";
  }

  return errors;
}

export async function resolveRequestPolicy(
  yearId: string,
  termId: string,
  scopeType: ExcuseScopeType,
  scopeIds: { stageId?: string; gradeId?: string; sectionId?: string } | undefined,
  date: string
): Promise<AttendancePolicy | null> {
  const policies = await fetchPolicies(yearId, termId);
  return resolveEffectivePolicy(policies, date, scopeType, scopeIds);
}
