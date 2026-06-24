import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { AttendancePolicy, AttendanceScopeType } from "../types";
import { migratePeriodIds } from "@/features/academics/timetable/types/timetableConfig";
import { fetchTimetableConfigs } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import {
  type AttendanceScopeIds,
} from "@/features/attendance/shared/attendanceScope";

// In-memory mock data keyed by `${yearId}-${termId}`
const policiesByTerm: Record<string, AttendancePolicy[]> = {
  "year-1-term-1-1": [
    {
      id: "policy-1",
      yearId: "year-1",
      termId: "term-1-1",
      nameAr: "سياسة الحضور الافتراضية",
      nameEn: "Default Attendance Policy",
      descriptionAr: "السياسة الافتراضية للحضور على مستوى المدرسة - تتبع بالحصص",
      descriptionEn: "Default school-wide attendance policy - period-based tracking",
      scopeType: "SCHOOL",
      mode: "PERIOD",
      selectedPeriodIds: ["p1", "p2"], // Using stable IDs
      lateThresholdMinutes: 15,
      earlyLeaveThresholdMinutes: 15,
      absentIfMissedPeriodsCount: 2,
      allowExcuses: true,
      requireExcuseReason: false,
      requireAttachmentForExcuse: false,
      notifyTeachers: true,
      notifyStudents: false,
      notifyGuardians: true,
      notifyOnAbsent: true,
      notifyOnLate: true,
      notifyOnEarlyLeave: false,
      effectiveStartDate: "2024-09-01",
      effectiveEndDate: "2024-12-31",
      isActive: true,
      createdAt: "2024-08-15T00:00:00Z",
      updatedAt: "2024-08-15T00:00:00Z",
    },
    {
      id: "policy-2",
      yearId: "year-1",
      termId: "term-1-1",
      nameAr: "سياسة الحضور بالحصة - الصف الأول",
      nameEn: "Period Attendance - Grade 1",
      descriptionAr: "تتبع الحضور لكل حصة دراسية",
      descriptionEn: "Track attendance per class period",
      scopeType: "GRADE",
      scopeIds: {
        stageId: "stage-1",
        gradeId: "grade-1",
      },
      mode: "PERIOD",
      selectedPeriodIds: ["p1", "p2", "p3", "p4"], // Using stable IDs
      lateThresholdMinutes: 10,
      earlyLeaveThresholdMinutes: 10,
      absentIfMissedPeriodsCount: 3,
      allowExcuses: true,
      requireExcuseReason: true,
      requireAttachmentForExcuse: true,
      notifyTeachers: true,
      notifyStudents: true,
      notifyGuardians: true,
      notifyOnAbsent: true,
      notifyOnLate: false,
      notifyOnEarlyLeave: false,
      effectiveStartDate: "2024-09-01",
      effectiveEndDate: "2024-12-31",
      isActive: true,
      createdAt: "2024-08-16T00:00:00Z",
      updatedAt: "2024-08-16T00:00:00Z",
    },
    {
      id: "policy-3",
      yearId: "year-1",
      termId: "term-1-1",
      nameAr: "سياسة الحضور - الصف الثاني",
      nameEn: "Attendance Policy - Grade 2",
      descriptionAr: "الحضور اليومي محسوب من حضور الحصص",
      descriptionEn: "Daily attendance derived from period attendance",
      scopeType: "GRADE",
      scopeIds: {
        stageId: "stage-1",
        gradeId: "grade-2",
      },
      mode: "PERIOD",
      selectedPeriodIds: ["p1", "p2", "p3", "p4", "p5"], // Using stable IDs
      lateThresholdMinutes: 15,
      earlyLeaveThresholdMinutes: 15,
      absentIfMissedPeriodsCount: 4,
      allowExcuses: true,
      requireExcuseReason: false,
      requireAttachmentForExcuse: false,
      notifyTeachers: true,
      notifyStudents: false,
      notifyGuardians: true,
      notifyOnAbsent: true,
      notifyOnLate: true,
      notifyOnEarlyLeave: true,
      effectiveStartDate: "2024-09-01",
      effectiveEndDate: "2024-12-31",
      isActive: true,
      createdAt: "2024-08-17T00:00:00Z",
      updatedAt: "2024-08-17T00:00:00Z",
    },
  ],
};

const getTermKey = (yearId: string, termId: string) => `${yearId}-${termId}`;

type BackendRecord = Record<string, unknown>;

const BASE = "/attendance/policies";

function asRecord(value: unknown): BackendRecord {
  return value && typeof value === "object" ? (value as BackendRecord) : {};
}

function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const object = asRecord(response);
  for (const key of ["items", "data", "policies"]) {
    if (Array.isArray(object[key])) return object[key] as unknown[];
  }
  return [];
}

function unwrapPolicy(response: unknown): BackendRecord {
  const object = asRecord(response);
  for (const key of ["policy", "data"]) {
    const nested = object[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as BackendRecord;
  }
  return object;
}

function getString(object: BackendRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return fallback;
}

function getOptionalString(object: BackendRecord, keys: string[]) {
  const value = getString(object, keys);
  return value || undefined;
}

function getNumber(object: BackendRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function getOptionalNumber(object: BackendRecord, keys: string[]) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function getBoolean(object: BackendRecord, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function resolveScopeKey(scopeType: AttendanceScopeType, scopeIds?: AttendanceScopeIds) {
  if (scopeType === "CLASSROOM") return scopeIds?.classroomId ? `classroom:${scopeIds.classroomId}` : undefined;
  if (scopeType === "SECTION") return scopeIds?.sectionId ? `section:${scopeIds.sectionId}` : undefined;
  if (scopeType === "GRADE") return scopeIds?.gradeId ? `grade:${scopeIds.gradeId}` : undefined;
  if (scopeType === "STAGE") return scopeIds?.stageId ? `stage:${scopeIds.stageId}` : undefined;
  return "school";
}

function stripScopeKeyPrefix(scopeKey: string) {
  const separatorIndex = scopeKey.indexOf(":");
  return separatorIndex === -1 ? scopeKey : scopeKey.slice(separatorIndex + 1);
}

function resolveScopeIds(scopeType: AttendanceScopeType, object: BackendRecord): AttendanceScopeIds | undefined {
  const nested = object.scopeIds && typeof object.scopeIds === "object" ? (object.scopeIds as AttendanceScopeIds) : {};
  const scopeKey = getOptionalString(object, ["scopeKey", "scopeId"]);
  const scopeId = scopeKey && scopeKey !== "school" ? stripScopeKeyPrefix(scopeKey) : undefined;
  return {
    ...nested,
    stageId: getOptionalString(object, ["stageId"]) || nested.stageId || (scopeType === "STAGE" ? scopeId : undefined),
    gradeId: getOptionalString(object, ["gradeId"]) || nested.gradeId || (scopeType === "GRADE" ? scopeId : undefined),
    sectionId: getOptionalString(object, ["sectionId"]) || nested.sectionId || (scopeType === "SECTION" ? scopeId : undefined),
    classroomId:
      getOptionalString(object, ["classroomId"]) || nested.classroomId || (scopeType === "CLASSROOM" ? scopeId : undefined),
  };
}

function buildScopeParams(scopeType: AttendanceScopeType, scopeIds?: AttendanceScopeIds) {
  const params: Record<string, string> = {};
  if (scopeIds?.stageId) params.stageId = scopeIds.stageId;
  if (scopeIds?.gradeId) params.gradeId = scopeIds.gradeId;
  if (scopeIds?.sectionId) params.sectionId = scopeIds.sectionId;
  if (scopeIds?.classroomId) params.classroomId = scopeIds.classroomId;
  return params;
}

function compactPayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function mapPolicy(item: unknown, fallback?: { yearId?: string; termId?: string }): AttendancePolicy {
  const object = unwrapPolicy(item);
  const scopeType = String(object.scopeType || "SCHOOL").toUpperCase() as AttendanceScopeType;
  return {
    id: getString(object, ["id"]),
    yearId: getString(object, ["yearId", "academicYearId"], fallback?.yearId || ""),
    termId: getString(object, ["termId"], fallback?.termId || ""),
    nameAr: getString(object, ["nameAr"]),
    nameEn: getString(object, ["nameEn"]),
    descriptionAr: getOptionalString(object, ["descriptionAr"]),
    descriptionEn: getOptionalString(object, ["descriptionEn"]),
    notesAr: getOptionalString(object, ["notesAr", "notes"]),
    notesEn: getOptionalString(object, ["notesEn", "notes"]),
    scopeType,
    scopeIds: resolveScopeIds(scopeType, object),
    mode: String(object.mode || "DAILY").toUpperCase() as AttendancePolicy["mode"],
    dailyComputationStrategy: getOptionalString(object, ["dailyComputationStrategy"]) as AttendancePolicy["dailyComputationStrategy"],
    selectedPeriodIds: Array.isArray(object.selectedPeriodIds) ? (object.selectedPeriodIds as string[]) : [],
    lateThresholdMinutes: getNumber(object, ["lateThresholdMinutes"], 0),
    earlyLeaveThresholdMinutes: getNumber(object, ["earlyLeaveThresholdMinutes"], 0),
    autoAbsentAfterMinutes: getOptionalNumber(object, ["autoAbsentAfterMinutes"]),
    absentIfMissedPeriodsCount: getOptionalNumber(object, ["absentIfMissedPeriodsCount"]),
    allowExcuses: getBoolean(object, ["allowExcuses", "allowParentExcuseRequests"], true),
    requireExcuseReason: getBoolean(object, ["requireExcuseReason"], false),
    requireAttachmentForExcuse: getBoolean(object, ["requireAttachmentForExcuse", "requireExcuseAttachment"], false),
    notifyTeachers: getBoolean(object, ["notifyTeachers"], false),
    notifyStudents: getBoolean(object, ["notifyStudents"], false),
    notifyGuardians: getBoolean(object, ["notifyGuardians", "notifyGuardiansOnAbsence"], false),
    notifyOnAbsent: getBoolean(object, ["notifyOnAbsent"], false),
    notifyOnLate: getBoolean(object, ["notifyOnLate"], false),
    notifyOnEarlyLeave: getBoolean(object, ["notifyOnEarlyLeave"], false),
    effectiveStartDate: getString(object, ["effectiveStartDate", "effectiveFrom"]),
    effectiveEndDate: getString(object, ["effectiveEndDate", "effectiveTo"]),
    isActive: getBoolean(object, ["isActive"], true),
    createdAt: getString(object, ["createdAt"]),
    updatedAt: getString(object, ["updatedAt"]),
  };
}

function buildPolicyPayload(payload: Partial<Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">>, compact: boolean) {
  const body = {
    academicYearId: payload.yearId,
    termId: payload.termId,
    nameAr: payload.nameAr,
    nameEn: payload.nameEn,
    descriptionAr: payload.descriptionAr,
    descriptionEn: payload.descriptionEn,
    notesAr: payload.notesAr,
    notesEn: payload.notesEn,
    scopeType: payload.scopeType,
    scopeKey: payload.scopeType ? resolveScopeKey(payload.scopeType, payload.scopeIds) : undefined,
    scopeIds: payload.scopeIds,
    ...buildScopeParams(payload.scopeType || "SCHOOL", payload.scopeIds),
    mode: payload.mode,
    dailyComputationStrategy: payload.dailyComputationStrategy,
    selectedPeriodIds: payload.selectedPeriodIds,
    lateThresholdMinutes: payload.lateThresholdMinutes,
    earlyLeaveThresholdMinutes: payload.earlyLeaveThresholdMinutes,
    autoAbsentAfterMinutes: payload.autoAbsentAfterMinutes,
    absentIfMissedPeriodsCount: payload.absentIfMissedPeriodsCount,
    allowExcuses: payload.allowExcuses,
    requireExcuseReason: payload.requireExcuseReason,
    requireAttachmentForExcuse: payload.requireAttachmentForExcuse,
    notifyTeachers: payload.notifyTeachers,
    notifyStudents: payload.notifyStudents,
    notifyGuardians: payload.notifyGuardians,
    notifyOnAbsent: payload.notifyOnAbsent,
    notifyOnLate: payload.notifyOnLate,
    notifyOnEarlyLeave: payload.notifyOnEarlyLeave,
    effectiveStartDate: payload.effectiveStartDate,
    effectiveEndDate: payload.effectiveEndDate,
    isActive: payload.isActive,
  };
  return compact ? compactPayload(body) : body;
}

/**
 * Normalize a name for comparison (trim, collapse spaces, lowercase for EN)
 */
export const normalizeName = (name: string, isArabic: boolean = false): string => {
  let normalized = name.trim().replace(/\s+/g, " ");
  if (!isArabic) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
};

/**
 * Check if a policy name is unique within a term and scope
 */
export const isPolicyNameUnique = (
  yearId: string,
  termId: string,
  scopeType: AttendanceScopeType,
  scopeIds: AttendanceScopeIds | undefined,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const key = getTermKey(yearId, termId);
  const policies = policiesByTerm[key] || [];
  
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn, false);

  // Check for duplicates in the same scope
  const duplicateAr = policies.some((p) => {
    if (p.id === excludeId) return false;
    if (p.scopeType !== scopeType) return false;
    
    // Check scope match
    if (scopeType === "STAGE" && p.scopeIds?.stageId !== scopeIds?.stageId) return false;
    if (scopeType === "GRADE" && (p.scopeIds?.stageId !== scopeIds?.stageId || p.scopeIds?.gradeId !== scopeIds?.gradeId)) return false;
    if (scopeType === "SECTION" && (p.scopeIds?.stageId !== scopeIds?.stageId || p.scopeIds?.gradeId !== scopeIds?.gradeId || p.scopeIds?.sectionId !== scopeIds?.sectionId)) return false;
    if (scopeType === "CLASSROOM" && (
      p.scopeIds?.stageId !== scopeIds?.stageId ||
      p.scopeIds?.gradeId !== scopeIds?.gradeId ||
      p.scopeIds?.sectionId !== scopeIds?.sectionId ||
      p.scopeIds?.classroomId !== scopeIds?.classroomId
    )) return false;
    
    return normalizeName(p.nameAr, true) === normalizedAr;
  });

  const duplicateEn = policies.some((p) => {
    if (p.id === excludeId) return false;
    if (p.scopeType !== scopeType) return false;
    
    // Check scope match
    if (scopeType === "STAGE" && p.scopeIds?.stageId !== scopeIds?.stageId) return false;
    if (scopeType === "GRADE" && (p.scopeIds?.stageId !== scopeIds?.stageId || p.scopeIds?.gradeId !== scopeIds?.gradeId)) return false;
    if (scopeType === "SECTION" && (p.scopeIds?.stageId !== scopeIds?.stageId || p.scopeIds?.gradeId !== scopeIds?.gradeId || p.scopeIds?.sectionId !== scopeIds?.sectionId)) return false;
    if (scopeType === "CLASSROOM" && (
      p.scopeIds?.stageId !== scopeIds?.stageId ||
      p.scopeIds?.gradeId !== scopeIds?.gradeId ||
      p.scopeIds?.sectionId !== scopeIds?.sectionId ||
      p.scopeIds?.classroomId !== scopeIds?.classroomId
    )) return false;
    
    return normalizeName(p.nameEn, false) === normalizedEn;
  });

  return {
    uniqueAr: !duplicateAr,
    uniqueEn: !duplicateEn,
  };
};

/**
 * Fetch all policies for a term
 * Auto-migrates old period IDs to stable IDs
 */
export const fetchPolicies = async (
  yearId: string,
  termId: string
): Promise<AttendancePolicy[]> => {
  const response = await apiGet<unknown>(BASE, {
    params: {
      academicYearId: yearId,
      termId,
    },
  });
  const policies = unwrapArray(response).map((item) => mapPolicy(item, { yearId, termId }));

  // Auto-migrate period IDs if needed
  try {
    const configs = await fetchTimetableConfigs({
      academicYearId: yearId,
      termId,
    });
    const termConfig = configs.find((c) => c.scopeType === "TERM") || null;

    if (termConfig) {
      const { periods } = resolveTimetableConfig(termConfig);

      // Migrate each policy's selectedPeriodIds
      return policies.map((policy) => {
        if (!policy.selectedPeriodIds || policy.selectedPeriodIds.length === 0) {
          return policy;
        }

        // Check if any period ID needs migration
        const needsMigration = policy.selectedPeriodIds.some((id) =>
          id.match(/^period-\d+$/)
        );

        if (!needsMigration) {
          return policy; // Already using stable IDs
        }

        // Migrate period IDs
        const migratedIds = migratePeriodIds(policy.selectedPeriodIds, periods);

        return {
          ...policy,
          selectedPeriodIds: migratedIds,
        };
      });
    }
  } catch (error) {
    console.error("Failed to migrate period IDs:", error);
  }

  return policies;
};

/**
 * Create a new policy
 */
export const createPolicy = async (
  payload: Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">
): Promise<AttendancePolicy> => {
  const response = await apiPost<unknown>(BASE, buildPolicyPayload(payload, false));
  return mapPolicy(response, { yearId: payload.yearId, termId: payload.termId });
};

/**
 * Update an existing policy
 */
export const updatePolicy = async (
  id: string,
  payload: Partial<Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">>
): Promise<AttendancePolicy> => {
  const response = await apiPatch<unknown>(`${BASE}/${id}`, buildPolicyPayload(payload, true));
  return mapPolicy(response, { yearId: payload.yearId, termId: payload.termId });
};

/**
 * Delete a policy
 */
export const deletePolicy = async (id: string): Promise<void> => {
  await apiDelete(`${BASE}/${id}`);
};

/**
 * Effective excuse policy type
 */
export type EffectiveExcusePolicy = {
  allowExcuses: boolean;
  requireExcuseReason: boolean;
  requireAttachmentForExcuse: boolean;
  lateThresholdMinutes: number;
  earlyLeaveThresholdMinutes: number;
};

/**
 * Resolve effective excuse policy for a specific scope and date
 * Returns the most specific policy that matches the criteria
 */
export async function resolveEffectiveExcusePolicy(
  yearId: string,
  termId: string,
  scopeType: AttendanceScopeType,
  scopeIds: AttendanceScopeIds | undefined,
  dateISO: string // YYYY-MM-DD
): Promise<EffectiveExcusePolicy> {
  const response = await apiGet<unknown>(`${BASE}/effective`, {
    params: {
      academicYearId: yearId,
      termId,
      scopeType,
      ...buildScopeParams(scopeType, scopeIds),
      date: dateISO,
    },
  });
  const selectedPolicy = mapPolicy(unwrapPolicy(response), { yearId, termId });

  if (selectedPolicy) {
    return {
      allowExcuses: selectedPolicy.allowExcuses,
      requireExcuseReason: selectedPolicy.requireExcuseReason,
      requireAttachmentForExcuse: selectedPolicy.requireAttachmentForExcuse,
      lateThresholdMinutes: selectedPolicy.lateThresholdMinutes,
      earlyLeaveThresholdMinutes: selectedPolicy.earlyLeaveThresholdMinutes,
    };
  }

  // Fallback if no policy found
  return {
    allowExcuses: true,
    requireExcuseReason: false,
    requireAttachmentForExcuse: false,
    lateThresholdMinutes: 15,
    earlyLeaveThresholdMinutes: 15,
  };
}
