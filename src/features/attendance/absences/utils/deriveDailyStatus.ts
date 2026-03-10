// Derive daily attendance status from period attendance

import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceEntry } from "@/features/attendance/roll-call/types";
import type { DailyStatus } from "../types";

/**
 * Extract period index from period ID (handles both old and new formats)
 * @param periodId - Period ID (e.g., "p1", "period-1", or custom stable ID)
 * @param fallbackIndex - Fallback index if extraction fails
 */
function extractPeriodIndex(periodId: string, fallbackIndex: number): number {
  // Try old format "period-N"
  const oldMatch = periodId.match(/^period-(\d+)$/);
  if (oldMatch) {
    return parseInt(oldMatch[1], 10);
  }

  // Try new format "pN"
  const newMatch = periodId.match(/^p(\d+)$/);
  if (newMatch) {
    return parseInt(newMatch[1], 10);
  }

  // Fallback to provided index
  return fallbackIndex;
}

/**
 * Derive daily status for a student on a specific date
 * based on period attendance and policy rules
 * 
 * IMPORTANT: Only call this for SUBMITTED sessions. DRAFT sessions should not be counted.
 */
export function deriveDailyStatus(
  studentId: string,
  date: string,
  periodEntries: AttendanceEntry[],
  policy: AttendancePolicy | null
): DailyStatus {
  if (!policy || !policy.selectedPeriodIds || policy.selectedPeriodIds.length === 0) {
    // No policy or no selected periods - default to PRESENT
    return {
      date,
      studentId,
      status: "PRESENT",
      missedPeriodsCount: 0,
      totalSelectedPeriods: 0,
      threshold: 0,
    };
  }

  // Extract period indices from policy's selected period IDs
  const selectedPeriodIndices = policy.selectedPeriodIds.map((id, idx) => 
    extractPeriodIndex(id, idx + 1)
  );

  const threshold = policy.absentIfMissedPeriodsCount || selectedPeriodIndices.length;

  // Count missed periods among selected periods
  let missedCount = 0;
  let allMissedAreExcused = true;
  let hasUnmarked = false;

  for (const periodIdx of selectedPeriodIndices) {
    const entry = periodEntries.find((e) => e.studentId === studentId);

    if (!entry) {
      // No entry found - this is UNMARKED, not ABSENT
      // Don't count as missed if the session is DRAFT
      hasUnmarked = true;
      continue;
    }

    if (entry.status === "ABSENT") {
      missedCount++;
      allMissedAreExcused = false;
    } else if (entry.status === "EXCUSED") {
      missedCount++;
      // Keep allMissedAreExcused true
    } else if (entry.status === "UNMARKED") {
      // Explicitly marked as UNMARKED
      hasUnmarked = true;
    }
  }

  // Determine daily status
  let status: "PRESENT" | "ABSENT" | "EXCUSED" = "PRESENT";

  // Only mark as absent if we have enough marked absences
  // Don't count UNMARKED entries as absent
  if (missedCount >= threshold) {
    status = allMissedAreExcused ? "EXCUSED" : "ABSENT";
  }

  return {
    date,
    studentId,
    status,
    missedPeriodsCount: missedCount,
    totalSelectedPeriods: selectedPeriodIndices.length,
    threshold,
  };
}

/**
 * Compute daily statuses for all students on a date
 */
export function computeDailyStatuses(
  date: string,
  studentIds: string[],
  periodEntriesForDate: AttendanceEntry[],
  policy: AttendancePolicy | null
): Map<string, DailyStatus> {
  const dailyStatuses = new Map<string, DailyStatus>();

  for (const studentId of studentIds) {
    const studentEntries = periodEntriesForDate.filter((e) => e.studentId === studentId);
    const dailyStatus = deriveDailyStatus(studentId, date, studentEntries, policy);
    dailyStatuses.set(studentId, dailyStatus);
  }

  return dailyStatuses;
}
