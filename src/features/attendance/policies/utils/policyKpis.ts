// Utility functions for computing attendance policy KPIs

import type { AttendancePolicy } from "../types";
import type { Section } from "@/features/academics/academic-structure-tree/services/structureService";

const EXPIRY_WINDOW_DAYS = 14;

export interface PolicyKpis {
  activePoliciesCount: number;
  coveredSectionsCount: number;
  uncoveredSectionsCount: number;
  totalSectionsCount: number;
  coveragePercent: number;
  hasDaily: boolean;
  hasPeriod: boolean;
  dailyCount: number;
  periodCount: number;
  conflictsCount: number;
  expiringSoonCount: number;
  hasSchoolDefault: boolean;
  isRollCallReady: boolean;
}

/**
 * Check if a date range overlaps with another
 */
function dateRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Check if a policy is effective on a given date
 */
function isPolicyEffective(policy: AttendancePolicy, referenceDate: string): boolean {
  return (
    policy.isActive &&
    policy.effectiveStartDate <= referenceDate &&
    policy.effectiveEndDate >= referenceDate
  );
}

/**
 * Find the effective policy for a section based on precedence rules
 */
function findEffectivePolicyForSection(
  section: Section,
  policies: AttendancePolicy[],
  referenceDate: string
): AttendancePolicy | null {
  // Filter to active and effective policies
  const effectivePolicies = policies.filter((p) =>
    isPolicyEffective(p, referenceDate)
  );

  // Precedence order: SECTION > GRADE > STAGE > SCHOOL
  
  // 1. Check SECTION level
  const sectionPolicies = effectivePolicies.filter(
    (p) => p.scopeType === "SECTION" && p.scopeIds?.sectionId === section.id
  );
  if (sectionPolicies.length > 0) {
    // Return most recent (latest effectiveStartDate)
    return sectionPolicies.sort(
      (a, b) => b.effectiveStartDate.localeCompare(a.effectiveStartDate)
    )[0];
  }

  // 2. Check GRADE level
  const gradePolicies = effectivePolicies.filter(
    (p) => p.scopeType === "GRADE" && p.scopeIds?.gradeId === section.gradeId
  );
  if (gradePolicies.length > 0) {
    return gradePolicies.sort(
      (a, b) => b.effectiveStartDate.localeCompare(a.effectiveStartDate)
    )[0];
  }

  // 3. Check STAGE level (need to find stage from grade)
  // For simplicity, we'll check if any STAGE policy matches
  // In a real implementation, you'd need to pass grades to determine the stage
  const stagePolicies = effectivePolicies.filter(
    (p) => p.scopeType === "STAGE"
  );
  if (stagePolicies.length > 0) {
    return stagePolicies.sort(
      (a, b) => b.effectiveStartDate.localeCompare(a.effectiveStartDate)
    )[0];
  }

  // 4. Check SCHOOL level
  const schoolPolicies = effectivePolicies.filter(
    (p) => p.scopeType === "SCHOOL"
  );
  if (schoolPolicies.length > 0) {
    return schoolPolicies.sort(
      (a, b) => b.effectiveStartDate.localeCompare(a.effectiveStartDate)
    )[0];
  }

  return null;
}

/**
 * Generate a bucket key for grouping policies by scope
 */
function getScopeBucketKey(policy: AttendancePolicy): string {
  switch (policy.scopeType) {
    case "SECTION":
      return `SECTION:${policy.scopeIds?.sectionId}`;
    case "GRADE":
      return `GRADE:${policy.scopeIds?.gradeId}`;
    case "STAGE":
      return `STAGE:${policy.scopeIds?.stageId}`;
    case "SCHOOL":
      return "SCHOOL";
    default:
      return "UNKNOWN";
  }
}

/**
 * Count conflicts (overlapping date ranges within same scope)
 */
function countConflicts(policies: AttendancePolicy[], referenceDate: string): number {
  const effectivePolicies = policies.filter((p) =>
    isPolicyEffective(p, referenceDate)
  );

  // Group by scope bucket
  const buckets = new Map<string, AttendancePolicy[]>();
  effectivePolicies.forEach((policy) => {
    const key = getScopeBucketKey(policy);
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(policy);
  });

  // Count buckets with overlaps
  let conflictBuckets = 0;
  buckets.forEach((bucketPolicies) => {
    if (bucketPolicies.length < 2) return;

    // Check for overlaps within bucket
    let hasOverlap = false;
    for (let i = 0; i < bucketPolicies.length - 1; i++) {
      for (let j = i + 1; j < bucketPolicies.length; j++) {
        if (
          dateRangesOverlap(
            bucketPolicies[i].effectiveStartDate,
            bucketPolicies[i].effectiveEndDate,
            bucketPolicies[j].effectiveStartDate,
            bucketPolicies[j].effectiveEndDate
          )
        ) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) break;
    }

    if (hasOverlap) {
      conflictBuckets++;
    }
  });

  return conflictBuckets;
}

/**
 * Count policies expiring soon
 */
function countExpiringSoon(
  policies: AttendancePolicy[],
  referenceDate: string
): number {
  const effectivePolicies = policies.filter((p) =>
    isPolicyEffective(p, referenceDate)
  );

  const expiryThreshold = new Date(referenceDate);
  expiryThreshold.setDate(expiryThreshold.getDate() + EXPIRY_WINDOW_DAYS);
  const expiryThresholdStr = expiryThreshold.toISOString().split("T")[0];

  return effectivePolicies.filter(
    (p) => p.effectiveEndDate <= expiryThresholdStr
  ).length;
}

/**
 * Compute all policy KPIs for a given term
 */
export function computePolicyKpis(
  policies: AttendancePolicy[],
  sections: Section[],
  referenceDate?: string
): PolicyKpis {
  const today = referenceDate || new Date().toISOString().split("T")[0];

  // A) Active policies count
  const activePolicies = policies.filter((p) => p.isActive);
  const activePoliciesCount = activePolicies.length;

  // B) Coverage by Section
  const totalSectionsCount = sections.length;
  let coveredSectionsCount = 0;

  if (totalSectionsCount > 0) {
    sections.forEach((section) => {
      const effectivePolicy = findEffectivePolicyForSection(
        section,
        policies,
        today
      );
      if (effectivePolicy) {
        coveredSectionsCount++;
      }
    });
  }

  const uncoveredSectionsCount = totalSectionsCount - coveredSectionsCount;
  const coveragePercent =
    totalSectionsCount > 0
      ? Math.round((coveredSectionsCount / totalSectionsCount) * 100)
      : 0;

  // C) Coverage by Mode
  const effectivePolicies = policies.filter((p) =>
    isPolicyEffective(p, today)
  );

  const dailyPolicies = effectivePolicies.filter((p) => p.mode === "DAILY");
  const periodPolicies = effectivePolicies.filter((p) => p.mode === "PERIOD");

  const hasDaily = dailyPolicies.length > 0;
  const hasPeriod = periodPolicies.length > 0;
  const dailyCount = dailyPolicies.length;
  const periodCount = periodPolicies.length;

  // D) Conflicts/Overlaps
  const conflictsCount = countConflicts(policies, today);

  // E) Expiring soon
  const expiringSoonCount = countExpiringSoon(policies, today);

  // F) Default policy present
  const hasSchoolDefault = effectivePolicies.some(
    (p) => p.scopeType === "SCHOOL"
  );

  // G) Roll Call Ready
  const isRollCallReady =
    coveragePercent === 100 &&
    conflictsCount === 0 &&
    hasDaily &&
    hasPeriod;

  return {
    activePoliciesCount,
    coveredSectionsCount,
    uncoveredSectionsCount,
    totalSectionsCount,
    coveragePercent,
    hasDaily,
    hasPeriod,
    dailyCount,
    periodCount,
    conflictsCount,
    expiringSoonCount,
    hasSchoolDefault,
    isRollCallReady,
  };
}

export { EXPIRY_WINDOW_DAYS };
