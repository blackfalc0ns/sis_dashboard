// Derive daily attendance status from period attendance

import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceEntry } from "@/features/attendance/roll-call/types";
import type { DailyStatus } from "../types";

/**
 * Derive daily status for a student on a specific date
 * based on period attendance and policy rules
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

  const selectedPeriodIndices = policy.selectedPeriodIds.map((id) => {
    const match = id.match(/period-(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  }).filter((idx) => idx >= 0);

  const threshold = policy.absentIfMissedPeriodsCount || selectedPeriodIndices.length;

  // Count missed periods among selected periods
  let missedCount = 0;
  let allMissedAreExcused = true;

  for (const periodIdx of selectedPeriodIndices) {
    const entry = periodEntries.find((e) => {
      // Match by period index from session
      // Assuming periodEntries have been filtered to this date already
      return e.studentId === studentId;
    });

    if (!entry || entry.status === "ABSENT") {
      missedCount++;
      allMissedAreExcused = false;
    } else if (entry.status === "EXCUSED") {
      missedCount++;
      // Keep allMissedAreExcused true
    }
  }

  // Determine daily status
  let status: "PRESENT" | "ABSENT" | "EXCUSED" = "PRESENT";

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
