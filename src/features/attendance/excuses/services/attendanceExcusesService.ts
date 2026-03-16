import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchAcademicYears, fetchTermsByYear } from "@/features/academics/academic-structure-tree/services/structureService";
import { mockStudentEnrollments, mockStudents } from "@/data/mockStudents";
import { applyExcuseToAttendance } from "../utils/applyExcuseToAttendance";
import {
  assertExcusePolicyAllowed,
  getExcusePolicyIssue,
  resolveEffectiveExcuseAttendancePolicy,
} from "../utils/excusePolicyValidation";
import type {
  ExcuseRequest,
  ExcuseRequestFilters,
  ExcuseValidationErrors,
  ExcuseScopeType,
  ExcuseStatus,
} from "../types";
import {
  matchesResolvedAttendanceScope,
  resolveAttendanceHierarchyScope,
  type AttendanceScopeIds,
} from "@/features/attendance/shared/attendanceScope";

const excusesByTerm: Record<string, ExcuseRequest[]> = {};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getKey = (yearId: string, termId: string) => `${yearId}-${termId}`;

async function ensureSeededExcuseRequests(yearId: string, termId: string) {
  const key = getKey(yearId, termId);
  if ((excusesByTerm[key]?.length || 0) > 0) {
    return;
  }

  const [academicYears, terms, structure] = await Promise.all([
    fetchAcademicYears(),
    fetchTermsByYear(yearId),
    fetchStructureTree(yearId, termId),
  ]);

  const academicYear = academicYears.find((item) => item.id === yearId);
  const term = terms.find((item) => item.id === termId);
  if (!academicYear || !term) {
    return;
  }

  const classroomsById = new Map(structure.classrooms.map((item) => [item.id, item]));
  const sectionsById = new Map(structure.sections.map((item) => [item.id, item]));

  const placements = mockStudentEnrollments
    .filter(
      (enrollment) =>
        enrollment.academicYear === academicYear.name &&
        enrollment.status === "active" &&
        enrollment.sectionId
    )
    .slice(0, 12);

  if (placements.length === 0) {
    excusesByTerm[key] = [];
    return;
  }

  excusesByTerm[key] = placements.map((enrollment, index) => {
    const student = mockStudents.find((item) => item.id === enrollment.studentId);
    const baseDate = new Date(term.startDate);
    baseDate.setDate(baseDate.getDate() + index * 5);
    const date = baseDate.toISOString().slice(0, 10);

    const statusCycle: ExcuseStatus[] = ["APPROVED", "PENDING", "REJECTED"];
    const typeCycle = ["ABSENCE", "LATE", "EARLY_LEAVE"] as const;
    const status = statusCycle[index % statusCycle.length];
    const type = typeCycle[index % typeCycle.length];
    const classroom = enrollment.classroomId ? classroomsById.get(enrollment.classroomId) : undefined;
    const section = enrollment.sectionId ? sectionsById.get(enrollment.sectionId) : undefined;

    return {
      id: `seed-excuse-${yearId}-${termId}-${index + 1}`,
      yearId,
      termId,
      studentId: enrollment.studentId,
      studentNameAr: student?.full_name_ar || student?.full_name_en || enrollment.studentId,
      studentNameEn: student?.full_name_en || student?.full_name_ar || enrollment.studentId,
      studentNumber: student?.student_id || enrollment.studentId,
      scopeType: classroom ? "CLASSROOM" : "SECTION",
      scopeIds: {
        gradeId: enrollment.gradeId,
        sectionId: enrollment.sectionId,
        classroomId: enrollment.classroomId,
      },
      type,
      dateFrom: date,
      dateTo: date,
      selectedPeriodIds: type === "ABSENCE" ? undefined : ["period-1"],
      periodIndexes: type === "ABSENCE" ? undefined : [1],
      minutesLate: type === "LATE" ? 10 + (index % 9) : undefined,
      minutesEarlyLeave: type === "EARLY_LEAVE" ? 8 + (index % 7) : undefined,
      reasonAr:
        status === "REJECTED"
          ? "سبب غير مكتمل"
          : type === "ABSENCE"
            ? "موعد طبي"
            : type === "LATE"
              ? "ازدحام مروري"
              : "موعد عائلي",
      reasonEn:
        status === "REJECTED"
          ? "Incomplete reason"
          : type === "ABSENCE"
            ? "Medical appointment"
            : type === "LATE"
              ? "Traffic delay"
              : "Family appointment",
      attachments:
        index % 2 === 0
          ? [
              {
                id: `seed-attachment-${index + 1}`,
                name: "supporting-document.pdf",
                size: 182000,
                type: "application/pdf",
                url: undefined,
              },
            ]
          : [],
      status,
      decisionNote: status === "REJECTED" ? "Needs supporting evidence" : undefined,
      decidedAt: status === "PENDING" ? undefined : `${date}T12:00:00.000Z`,
      decidedBy: status === "PENDING" ? undefined : "Attendance Office",
      createdAt: `${date}T08:30:00.000Z`,
      updatedAt: `${date}T12:00:00.000Z`,
      linkedSessionIds: status === "APPROVED" ? [`seed-session-${key}-${classroom?.id || section?.id}-${date}`] : undefined,
    };
  });
}

function overlapsRange(request: ExcuseRequest, dateFrom?: string, dateTo?: string): boolean {
  if (!dateFrom && !dateTo) return true;
  const from = dateFrom || request.dateFrom;
  const to = dateTo || request.dateTo;

  return request.dateFrom <= to && request.dateTo >= from;
}

function resolveScopeFromRequest(
  request: ExcuseRequest,
  gradesById: Map<string, { stageId: string }>,
  sectionsById: Map<string, { gradeId: string }>,
  classroomsById: Map<string, { sectionId: string }>
) {
  return resolveAttendanceHierarchyScope({
    scopeType: request.scopeType,
    scopeIds: request.scopeIds,
    gradesById,
    sectionsById,
    classroomsById,
  });
}

function scopeMatches(
  request: ExcuseRequest,
  scopeType: ExcuseRequestFilters["scopeType"],
  scopeIds: AttendanceScopeIds | undefined,
  gradesById: Map<string, { stageId: string }>,
  sectionsById: Map<string, { gradeId: string }>,
  classroomsById: Map<string, { sectionId: string }>
) {
  const resolved = resolveScopeFromRequest(request, gradesById, sectionsById, classroomsById);
  return matchesResolvedAttendanceScope(scopeType, scopeIds, resolved);
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
  await ensureSeededExcuseRequests(yearId, termId);
  const store = excusesByTerm[key] || [];
  const structure = await fetchStructureTree(yearId, termId);
  const gradesById = new Map(structure.grades.map((grade) => [grade.id, { stageId: grade.stageId }]));
  const sectionsById = new Map(structure.sections.map((section) => [section.id, { gradeId: section.gradeId }]));
  const classroomsById = new Map(structure.classrooms.map((classroom) => [classroom.id, { sectionId: classroom.sectionId }]));

  const filtered = store.filter((request) => {
    if (!overlapsRange(request, dateFrom, dateTo)) return false;
    if (!scopeMatches(request, scopeType, scopeIds, gradesById, sectionsById, classroomsById)) return false;
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
  payload: Omit<
    ExcuseRequest,
    "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds"
  >
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
      const policies = await fetchPolicies(request.yearId, request.termId);
      assertExcusePolicyAllowed(request, policies);
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
  if (effectivePolicy?.requireExcuseReason && !reasonAr && !reasonEn) {
    errors.reason = "At least one reason language is required";
  }

  if (payload.type === "LATE" || payload.type === "EARLY_LEAVE") {
    const hasPeriods = (payload.selectedPeriodIds && payload.selectedPeriodIds.length > 0) ||
      (payload.periodIndexes && payload.periodIndexes.length > 0);
    if (!hasPeriods) {
      errors.selectedPeriodIds = "Period selection is required for late/early leave requests";
    }
  }

  if (payload.type === "LATE") {
    if (payload.minutesLate === undefined || payload.minutesLate === null) {
      errors.minutesLate = "Minutes late is required";
    } else if (payload.minutesLate <= 0) {
      errors.minutesLate = "Minutes late must be greater than 0";
    }
  }

  if (payload.type === "EARLY_LEAVE") {
    if (payload.minutesEarlyLeave === undefined || payload.minutesEarlyLeave === null) {
      errors.minutesEarlyLeave = "Minutes early leave is required";
    } else if (payload.minutesEarlyLeave <= 0) {
      errors.minutesEarlyLeave = "Minutes early leave must be greater than 0";
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

export async function validateExcusePolicyRange(
  payload: Pick<ExcuseRequest, "yearId" | "termId" | "dateFrom" | "dateTo" | "scopeType" | "scopeIds" | "attachments" | "reasonAr" | "reasonEn">
) {
  const policies = await fetchPolicies(payload.yearId, payload.termId);
  return getExcusePolicyIssue(payload, policies);
}

export async function resolveRequestPolicy(
  yearId: string,
  termId: string,
  scopeType: ExcuseScopeType,
  scopeIds: AttendanceScopeIds | undefined,
  date: string
): Promise<AttendancePolicy | null> {
  const policies = await fetchPolicies(yearId, termId);
  return resolveEffectiveExcuseAttendancePolicy(policies, date, scopeType, scopeIds);
}
