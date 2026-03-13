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
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { computeDailyStatuses } from "../utils/deriveDailyStatus";
import { mockStudents } from "@/data/mockStudents";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";

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
    status = "ALL",
    granularities = ["PERIOD"], // Default to PERIOD only
    onlyUnexcused = false,
    search = "",
  } = params;

  const structure = await fetchStructureTree(yearId, termId);
  const gradesById = new Map(structure.grades.map((grade) => [grade.id, grade]));
  const sectionsById = new Map(structure.sections.map((section) => [section.id, section]));
  const classroomsById = new Map(structure.classrooms.map((classroom) => [classroom.id, classroom]));

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
        gradeNameAr: session.scopeIds?.gradeId ? gradesById.get(session.scopeIds.gradeId)?.nameAr : undefined,
        gradeNameEn: session.scopeIds?.gradeId ? gradesById.get(session.scopeIds.gradeId)?.nameEn : undefined,
        sectionNameAr: session.scopeIds?.sectionId ? sectionsById.get(session.scopeIds.sectionId)?.nameAr : undefined,
        sectionNameEn: session.scopeIds?.sectionId ? sectionsById.get(session.scopeIds.sectionId)?.nameEn : undefined,
        classroomNameAr: session.scopeIds?.classroomId ? classroomsById.get(session.scopeIds.classroomId)?.nameAr : undefined,
        classroomNameEn: session.scopeIds?.classroomId ? classroomsById.get(session.scopeIds.classroomId)?.nameEn : undefined,
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

  // 5. Compute daily-derived records (only if explicitly requested)
  const dailyRecords: AbsenceRecord[] = [];

  if (granularities.includes("DAILY_DERIVED")) {
    // Fetch timetable periods for the scope
    const termConfig = await fetchTimetableConfig(termId, "TERM");
    const gradeConfig = scopeIds?.gradeId
      ? await fetchTimetableConfig(termId, "GRADE", scopeIds.gradeId)
      : null;
    const sectionConfig = scopeIds?.sectionId
      ? await fetchTimetableConfig(termId, "SECTION", scopeIds.sectionId)
      : null;
    const { periods: timetablePeriods } = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);

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
      const dailyStatuses = computeDailyStatuses(
        date,
        studentIds,
        dateSessions,
        dateEntries,
        policy,
        timetablePeriods
      );

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
          gradeNameAr: scopeIds?.gradeId ? gradesById.get(scopeIds.gradeId)?.nameAr : undefined,
          gradeNameEn: scopeIds?.gradeId ? gradesById.get(scopeIds.gradeId)?.nameEn : undefined,
          sectionNameAr: scopeIds?.sectionId ? sectionsById.get(scopeIds.sectionId)?.nameAr : undefined,
          sectionNameEn: scopeIds?.sectionId ? sectionsById.get(scopeIds.sectionId)?.nameEn : undefined,
          classroomNameAr: scopeIds?.classroomId ? classroomsById.get(scopeIds.classroomId)?.nameAr : undefined,
          classroomNameEn: scopeIds?.classroomId ? classroomsById.get(scopeIds.classroomId)?.nameEn : undefined,
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

  // Apply status filter (single status instead of array)
  if (status !== "ALL") {
    allRecords = allRecords.filter((r) => r.status === status);
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
    // Remove dailyAbsentCount since we focus on PERIOD only
    dailyAbsentCount: 0,
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
