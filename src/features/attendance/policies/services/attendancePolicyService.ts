// Mock service for Attendance Policies (TERM-SCOPED)
// Replace with real API calls when backend is ready

import type { AttendancePolicy, AttendanceScopeType } from "../types";

// In-memory mock data keyed by `${yearId}-${termId}`
const policiesByTerm: Record<string, AttendancePolicy[]> = {
  "year-1-term-1-1": [
    {
      id: "policy-1",
      yearId: "year-1",
      termId: "term-1-1",
      nameAr: "سياسة الحضور الافتراضية",
      nameEn: "Default Attendance Policy",
      scopeType: "SCHOOL",
      mode: "DAILY",
      lateThresholdMinutes: 15,
      earlyLeaveThresholdMinutes: 15,
      autoAbsentAfterMinutes: 30,
      allowExcuses: true,
      requireAttachmentForExcuse: false,
      effectiveStartDate: "2024-09-01",
      effectiveEndDate: "2024-12-31",
      isActive: true,
      createdAt: "2024-08-15T00:00:00Z",
      updatedAt: "2024-08-15T00:00:00Z",
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
 */
export const fetchPolicies = async (
  yearId: string,
  termId: string
): Promise<AttendancePolicy[]> => {
  await delay(300);
  const key = getTermKey(yearId, termId);
  return [...(policiesByTerm[key] || [])];
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
