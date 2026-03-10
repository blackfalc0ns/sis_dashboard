// Attendance Absences Service
// Derives absence records from Roll Call sessions + entries

import type { AbsenceRecord, AbsencesFilters, AbsencesKPIs } from "../types";
import type { AttachmentMeta } from "@/features/attendance/roll-call/types";
import {
  fetchSessions,
  fetchEntriesForSessions,
  fetchRoster,
  fetchEffectivePolicy,
  upsertEntry,
} from "@/features/attendance/roll-call/services/attendanceRollCallService";
import { computeDailyStatuses } from "../utils/deriveDailyStatus";
import { mockStudents } from "@/data/mockStudents";

/**
 * Fetch absence records based on filters
 */
export async function fetchAbsenceRecords(
  params: {
    yearId: string;
    termId: string;
  } & Partial<AbsencesFilters>
): Promise<AbsenceRecord[]> {
  const {
    yearId,
    termId,
    dateFrom,
    dateTo,
    scopeType = "SCHOOL",
    scopeIds,
    statuses = [],
    granularities = ["PERIOD", "DAILY_DERIVED"],
    onlyUnexcused = false,
    search = "",
  } = params;

  // 1. Load sessions for date range (only SUBMITTED sessions)
  const allSessions = await fetchSessions(yearId, termId, dateFrom, dateTo);
  const sessions = allSessions.filter((s) => s.status === "SUBMITTED");

  if (sessions.length === 0) {
    return [];
  }

  // 2. Load entries for all sessions
  const sessionIds = sessions.map((s) => s.id);
  const entries = await fetchEntriesForSessions(yearId, termId, sessionIds);

  // 3. Load roster
  const roster = await fetchRoster(scopeType, scopeIds || {});

  // 4. Build period-level records
  const periodRecords: AbsenceRecord[] = [];

  for (const session of sessions) {
    for (const entry of entries.filter((e) => e.sessionId === session.id)) {
      // Skip PRESENT entries (not incidents)
      if (entry.status === "PRESENT") continue;

      const student = roster.find((r) => r.id === entry.studentId) || mockStudents.find((s) => s.id === entry.studentId);
      if (!student) continue;

      const studentNumber = ('studentNumber' in student ? student.studentNumber : ('student_id' in student ? student.student_id : student.id)) || "";
      const studentNameAr = ('nameAr' in student ? student.nameAr : ('full_name_ar' in student ? student.full_name_ar : "")) || "";
      const studentNameEn = ('nameEn' in student ? student.nameEn : ('full_name_en' in student ? student.full_name_en : "")) || "";

      const record: AbsenceRecord = {
        id: `${entry.id}-period`,
        yearId,
        termId,
        date: session.date,
        studentId: entry.studentId,
        studentNumber,
        studentNameAr,
        studentNameEn,
        scopeType: session.scopeType,
        scopeIds: session.scopeIds,
        granularity: "PERIOD",
        periodIndex: session.periodIndex,
        periodNameAr: session.periodNameAr,
        periodNameEn: session.periodNameEn,
        status: entry.status as "ABSENT" | "LATE" | "EARLY_LEAVE" | "EXCUSED",
        minutesLate: entry.minutesLate,
        minutesEarlyLeave: entry.minutesEarlyLeave,
        excuse: entry.excuseReason
          ? {
              reasonAr: entry.excuseReason,
              reasonEn: entry.excuseReason,
              attachments: entry.excuseAttachments,
              createdAt: entry.updatedAt,
            }
          : undefined,
        sourceSessionId: session.id,
        updatedAt: entry.updatedAt,
      };

      periodRecords.push(record);
    }
  }

  // 5. Compute daily-derived records
  const dailyRecords: AbsenceRecord[] = [];

  if (granularities.includes("DAILY_DERIVED")) {
    // Group sessions by date
    const sessionsByDate = new Map<string, typeof sessions>();
    for (const session of sessions) {
      if (!sessionsByDate.has(session.date)) {
        sessionsByDate.set(session.date, []);
      }
      sessionsByDate.get(session.date)!.push(session);
    }

    for (const [date, dateSessions] of sessionsByDate) {
      // Get policy for this date
      const policy = await fetchEffectivePolicy(yearId, termId, scopeType, scopeIds || {}, date);

      if (!policy) continue;

      // Get entries for this date
      const dateSessionIds = dateSessions.map((s) => s.id);
      const dateEntries = entries.filter((e) => dateSessionIds.includes(e.sessionId));

      // Compute daily statuses
      const studentIds = roster.map((r) => r.id);
      const dailyStatuses = computeDailyStatuses(date, studentIds, dateEntries, policy);

      for (const [studentId, dailyStatus] of dailyStatuses) {
        // Only include ABSENT or EXCUSED (not PRESENT)
        if (dailyStatus.status === "PRESENT") continue;

        const student = roster.find((r) => r.id === studentId) || mockStudents.find((s) => s.id === studentId);
        if (!student) continue;

        const studentNumber = ('studentNumber' in student ? student.studentNumber : ('student_id' in student ? student.student_id : student.id)) || "";
        const studentNameAr = ('nameAr' in student ? student.nameAr : ('full_name_ar' in student ? student.full_name_ar : "")) || "";
        const studentNameEn = ('nameEn' in student ? student.nameEn : ('full_name_en' in student ? student.full_name_en : "")) || "";

        const record: AbsenceRecord = {
          id: `${studentId}-${date}-daily`,
          yearId,
          termId,
          date,
          studentId,
          studentNumber,
          studentNameAr,
          studentNameEn,
          scopeType,
          scopeIds,
          granularity: "DAILY_DERIVED",
          status: dailyStatus.status === "EXCUSED" ? "EXCUSED" : "ABSENT",
          updatedAt: new Date().toISOString(),
        };

        dailyRecords.push(record);
      }
    }
  }

  // 6. Combine and filter
  let allRecords = [...periodRecords];
  if (granularities.includes("DAILY_DERIVED")) {
    allRecords = [...allRecords, ...dailyRecords];
  }

  // Apply filters
  if (statuses.length > 0) {
    allRecords = allRecords.filter((r) => statuses.includes(r.status));
  }

  if (onlyUnexcused) {
    allRecords = allRecords.filter((r) => r.status !== "EXCUSED" && !r.excuse);
  }

  if (search) {
    const query = search.toLowerCase();
    allRecords = allRecords.filter(
      (r) =>
        r.studentNameAr.toLowerCase().includes(query) ||
        r.studentNameEn.toLowerCase().includes(query) ||
        r.studentNumber.toLowerCase().includes(query)
    );
  }

  // Sort: date desc, then student name
  allRecords.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.studentNameEn.localeCompare(b.studentNameEn);
  });

  return allRecords;
}

/**
 * Compute KPIs from records
 */
export function computeAbsencesKPIs(records: AbsenceRecord[]): AbsencesKPIs {
  return {
    totalIncidents: records.length,
    absentCount: records.filter((r) => r.status === "ABSENT").length,
    excusedCount: records.filter((r) => r.status === "EXCUSED" || r.excuse).length,
    lateCount: records.filter((r) => r.status === "LATE").length,
    earlyLeaveCount: records.filter((r) => r.status === "EARLY_LEAVE").length,
    dailyAbsentCount: records.filter((r) => r.granularity === "DAILY_DERIVED" && r.status === "ABSENT").length,
  };
}

/**
 * Update excuse for a record
 */
export async function updateExcuse(
  record: AbsenceRecord,
  reason: string,
  attachments: AttachmentMeta[]
): Promise<void> {
  if (!record.sourceSessionId) {
    throw new Error("Cannot update excuse for derived daily record");
  }

  await upsertEntry(record.yearId, record.termId, record.sourceSessionId, record.studentId, {
    status: "EXCUSED",
    excuseReason: reason,
    excuseAttachments: attachments,
  });
}

/**
 * Update early leave minutes for a record
 */
export async function updateEarlyLeaveMinutes(
  record: AbsenceRecord,
  minutes: number
): Promise<void> {
  if (!record.sourceSessionId) {
    throw new Error("Cannot update early leave for derived daily record");
  }

  if (minutes < 0) {
    throw new Error("Minutes must be non-negative");
  }

  await upsertEntry(record.yearId, record.termId, record.sourceSessionId, record.studentId, {
    status: "EARLY_LEAVE",
    minutesEarlyLeave: minutes,
  });
}

/**
 * Validate excuse against policy
 */
export function validateExcuse(
  reason: string,
  attachments: AttachmentMeta[],
  requireReason: boolean,
  requireAttachment: boolean
): { reasonError?: string; attachmentError?: string } {
  const errors: { reasonError?: string; attachmentError?: string } = {};

  if (requireReason && !reason.trim()) {
    errors.reasonError = "Reason is required";
  }

  if (requireAttachment && attachments.length === 0) {
    errors.attachmentError = "Attachment is required";
  }

  return errors;
}
