// Mock service for Attendance Policies (TERM-SCOPED)
// Replace with real API calls when backend is ready

import type { AttendancePolicy, AttendanceScopeType } from "../types";
import { migratePeriodIds } from "@/features/academics/timetable/types/timetableConfig";
import { fetchTimetableConfigs } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";

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
      maxDaysToSubmitExcuse: 3,
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 1000;
const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

const getTermKey = (yearId: string, termId: string) => `${yearId}-${termId}`;

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
  scopeIds: { stageId?: string; gradeId?: string; sectionId?: string } | undefined,
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
    
    return normalizeName(p.nameAr, true) === normalizedAr;
  });

  const duplicateEn = policies.some((p) => {
    if (p.id === excludeId) return false;
    if (p.scopeType !== scopeType) return false;
    
    // Check scope match
    if (scopeType === "STAGE" && p.scopeIds?.stageId !== scopeIds?.stageId) return false;
    if (scopeType === "GRADE" && (p.scopeIds?.stageId !== scopeIds?.stageId || p.scopeIds?.gradeId !== scopeIds?.gradeId)) return false;
    if (scopeType === "SECTION" && (p.scopeIds?.stageId !== scopeIds?.stageId || p.scopeIds?.gradeId !== scopeIds?.gradeId || p.scopeIds?.sectionId !== scopeIds?.sectionId)) return false;
    
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
  await delay(300);
  const key = getTermKey(yearId, termId);
  const policies = [...(policiesByTerm[key] || [])];

  // Auto-migrate period IDs if needed
  try {
    const configs = await fetchTimetableConfigs(termId);
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
  await delay(300);

  const now = new Date().toISOString();
  const newPolicy: AttendancePolicy = {
    id: generateId("policy"),
    ...payload,
    createdAt: now,
    updatedAt: now,
  };

  const key = getTermKey(payload.yearId, payload.termId);
  if (!policiesByTerm[key]) {
    policiesByTerm[key] = [];
  }
  policiesByTerm[key].push(newPolicy);

  return newPolicy;
};

/**
 * Update an existing policy
 */
export const updatePolicy = async (
  id: string,
  payload: Partial<Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">>
): Promise<AttendancePolicy> => {
  await delay(300);

  // Find policy across all terms
  for (const key in policiesByTerm) {
    const policies = policiesByTerm[key];
    const index = policies.findIndex((p) => p.id === id);

    if (index !== -1) {
      policies[index] = {
        ...policies[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return policies[index];
    }
  }

  throw new Error("Policy not found");
};

/**
 * Delete a policy
 */
export const deletePolicy = async (id: string): Promise<void> => {
  await delay(300);

  // Find and remove policy across all terms
  for (const key in policiesByTerm) {
    const policies = policiesByTerm[key];
    const index = policies.findIndex((p) => p.id === id);

    if (index !== -1) {
      policies.splice(index, 1);
      return;
    }
  }

  throw new Error("Policy not found");
};

/**
 * Effective excuse policy type
 */
export type EffectiveExcusePolicy = {
  allowExcuses: boolean;
  requireAttachmentForExcuse: boolean;
};

/**
 * Resolve effective excuse policy for a specific scope and date
 * Returns the most specific policy that matches the criteria
 */
export async function resolveEffectiveExcusePolicy(
  yearId: string,
  termId: string,
  scopeType: AttendanceScopeType,
  scopeIds: { stageId?: string; gradeId?: string; sectionId?: string } | undefined,
  dateISO: string // YYYY-MM-DD
): Promise<EffectiveExcusePolicy> {
  // 1) Fetch all policies for the term
  const policies = await fetchPolicies(yearId, termId);

  // 2) Filter policies that are active and within date range
  const activePolicies = policies.filter((policy) => {
    // Must be active
    if (!policy.isActive) return false;

    // Check date range if specified
    if (policy.effectiveStartDate && dateISO < policy.effectiveStartDate) return false;
    if (policy.effectiveEndDate && dateISO > policy.effectiveEndDate) return false;

    return true;
  });

  // 3) Find policies that match the scope, prioritizing most specific
  const matchingPolicies: AttendancePolicy[] = [];

  // Helper function to check if policy scope matches target scope
  const doesScopeMatch = (policy: AttendancePolicy): boolean => {
    switch (policy.scopeType) {
      case "SCHOOL":
        return true; // School policy applies to all scopes

      case "STAGE":
        return scopeType !== "SCHOOL" && 
               policy.scopeIds?.stageId === scopeIds?.stageId;

      case "GRADE":
        return (scopeType === "GRADE" || scopeType === "SECTION") &&
               policy.scopeIds?.stageId === scopeIds?.stageId &&
               policy.scopeIds?.gradeId === scopeIds?.gradeId;

      case "SECTION":
        return scopeType === "SECTION" &&
               policy.scopeIds?.stageId === scopeIds?.stageId &&
               policy.scopeIds?.gradeId === scopeIds?.gradeId &&
               policy.scopeIds?.sectionId === scopeIds?.sectionId;

      default:
        return false;
    }
  };

  // Collect all matching policies
  for (const policy of activePolicies) {
    if (doesScopeMatch(policy)) {
      matchingPolicies.push(policy);
    }
  }

  // 4) Choose the most specific policy (SECTION > GRADE > STAGE > SCHOOL)
  const scopePriority = { SECTION: 4, GRADE: 3, STAGE: 2, SCHOOL: 1 };
  
  let selectedPolicy: AttendancePolicy | null = null;
  let highestPriority = 0;

  for (const policy of matchingPolicies) {
    const priority = scopePriority[policy.scopeType];
    if (priority > highestPriority) {
      highestPriority = priority;
      selectedPolicy = policy;
    }
  }

  // 5) Return effective policy or fallback defaults
  if (selectedPolicy) {
    return {
      allowExcuses: selectedPolicy.allowExcuses,
      requireAttachmentForExcuse: selectedPolicy.requireAttachmentForExcuse,
    };
  }

  // Fallback if no policy found
  return {
    allowExcuses: true,
    requireAttachmentForExcuse: false,
  };
}
