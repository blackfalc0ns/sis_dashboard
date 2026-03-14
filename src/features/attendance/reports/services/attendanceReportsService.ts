import { mockStudents } from "@/data/mockStudents";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchAbsenceRecords } from "@/features/attendance/absences/services/attendanceAbsencesService";
import type { AbsenceRecord } from "@/features/attendance/absences/types";
import { fetchExcuseRequests } from "@/features/attendance/excuses/services/attendanceExcusesService";
import type { ExcuseRequest, ExcuseType } from "@/features/attendance/excuses/types";
import { fetchIncidents } from "@/features/attendance/late-early/services/attendanceLateEarlyService";
import type { Incident } from "@/features/attendance/late-early/types";
import {
  fetchEntriesForSessions,
  fetchRoster,
  fetchSessions,
} from "@/features/attendance/roll-call/services/attendanceRollCallService";
import type {
  AttendanceEntry,
  AttendanceSession,
  AttendanceStatus,
  RosterStudent,
} from "@/features/attendance/roll-call/types";
import {
  matchesResolvedAttendanceScope,
  resolveAttendanceHierarchyScope,
  type AttendanceScopeIds,
} from "@/features/attendance/shared/attendanceScope";
import type {
  AttendanceReportsData,
  AttendanceReportsFilters,
  ReportsAbsenceAnalysis,
  ReportsAttendanceRow,
  ReportsExcusesAnalysis,
  ReportsKpiCard,
  ReportsLateEarlyAnalysis,
  ReportsPerformanceLevel,
  ReportsPerformanceRow,
  ReportsRiskFlag,
  ReportsRiskStudentRow,
  ReportsScopeBreakdownRow,
  ReportsStudentOption,
  ReportsTrendBucket,
  ReportsTrendPoint,
} from "../types";

const ATTENDANCE_THRESHOLD = 85;

// Attendance policies do not currently define student-risk thresholds,
// so reports use centralized operational heuristics here.
const RISK_RULES = {
  lowAttendanceRate: 85,
  repeatedAbsenceCount: 3,
  repeatedLateCount: 3,
  rejectedExcuseCount: 2,
  missingAttendanceMarks: 2,
} as const;

type StructureMaps = {
  stagesById: Map<string, Stage>;
  gradesById: Map<string, Grade>;
  sectionsById: Map<string, Section>;
  classroomsById: Map<string, Classroom>;
};

type ReportsStudentLike = {
  id: string;
  studentNumber: string;
  studentNameAr: string;
  studentNameEn: string;
};

function buildStructureMaps(stages: Stage[], grades: Grade[], sections: Section[], classrooms: Classroom[]): StructureMaps {
  return {
    stagesById: new Map(stages.map((item) => [item.id, item])),
    gradesById: new Map(grades.map((item) => [item.id, item])),
    sectionsById: new Map(sections.map((item) => [item.id, item])),
    classroomsById: new Map(classrooms.map((item) => [item.id, item])),
  };
}

function buildStudentMap(roster: RosterStudent[]): Map<string, ReportsStudentLike> {
  const map = new Map<string, ReportsStudentLike>();

  for (const student of mockStudents) {
    map.set(student.id, {
      id: student.id,
      studentNumber: student.student_id || student.id,
      studentNameAr: student.full_name_ar,
      studentNameEn: student.full_name_en,
    });
  }

  for (const student of roster) {
    map.set(student.id, {
      id: student.id,
      studentNumber: student.studentNumber || student.id,
      studentNameAr: student.nameAr,
      studentNameEn: student.nameEn,
    });
  }

  return map;
}

function buildSessionScope(session: AttendanceSession, maps: StructureMaps): AttendanceScopeIds {
  return resolveAttendanceHierarchyScope({
    scopeType: session.scopeType,
    scopeIds: session.scopeIds,
    gradesById: new Map(Array.from(maps.gradesById.entries()).map(([id, grade]) => [id, { stageId: grade.stageId }])),
    sectionsById: new Map(Array.from(maps.sectionsById.entries()).map(([id, section]) => [id, { gradeId: section.gradeId }])),
    classroomsById: new Map(Array.from(maps.classroomsById.entries()).map(([id, classroom]) => [id, { sectionId: classroom.sectionId }])),
  });
}

function includesStatusInIncidentFilter(status: AttendanceStatus, incidentType: AttendanceReportsFilters["incidentType"]) {
  if (incidentType === "ALL") return true;
  if (incidentType === "ABSENCE") return status === "ABSENT";
  if (incidentType === "EXCUSED") return status === "EXCUSED";
  return status === incidentType;
}

function isAttendedStatus(status: AttendanceStatus) {
  return status === "PRESENT" || status === "LATE" || status === "EARLY_LEAVE" || status === "EXCUSED";
}

function computeAttendanceRate(rows: Array<{ status: AttendanceStatus }>) {
  if (rows.length === 0) return 0;
  const attended = rows.filter((row) => isAttendedStatus(row.status)).length;
  return Number(((attended / rows.length) * 100).toFixed(1));
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateDiffInDays(dateFrom?: string, dateTo?: string) {
  if (!dateFrom || !dateTo) return 0;
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function getTrendBucket(dateFrom?: string, dateTo?: string): ReportsTrendBucket {
  return getDateDiffInDays(dateFrom, dateTo) > 45 ? "week" : "day";
}

function getBucketKey(date: string, bucket: ReportsTrendBucket) {
  if (bucket === "day") return date;
  return formatDate(startOfWeek(new Date(date)));
}

function getBucketRange(bucketKey: string, bucket: ReportsTrendBucket) {
  if (bucket === "day") {
    return { dateFrom: bucketKey, dateTo: bucketKey };
  }

  const start = new Date(bucketKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { dateFrom: bucketKey, dateTo: formatDate(end) };
}

function shiftRange(dateFrom?: string, dateTo?: string) {
  if (!dateFrom || !dateTo) return { dateFrom: undefined, dateTo: undefined };
  const days = getDateDiffInDays(dateFrom, dateTo) + 1;
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  start.setDate(start.getDate() - days);
  end.setDate(end.getDate() - days);
  return {
    dateFrom: formatDate(start),
    dateTo: formatDate(end),
  };
}

function buildAttendanceRow(
  session: AttendanceSession,
  entry: AttendanceEntry,
  student: ReportsStudentLike | undefined,
  maps: StructureMaps
): ReportsAttendanceRow | null {
  if (!student) return null;

  const resolvedScope = buildSessionScope(session, maps);
  const grade = resolvedScope.gradeId ? maps.gradesById.get(resolvedScope.gradeId) : undefined;
  const section = resolvedScope.sectionId ? maps.sectionsById.get(resolvedScope.sectionId) : undefined;
  const classroom = resolvedScope.classroomId ? maps.classroomsById.get(resolvedScope.classroomId) : undefined;
  const stage = resolvedScope.stageId ? maps.stagesById.get(resolvedScope.stageId) : undefined;

  return {
    id: entry.id,
    sessionId: session.id,
    date: session.date,
    sessionStatus: session.status,
    mode: session.mode,
    periodIndex: session.periodIndex,
    periodNameAr: session.periodNameAr,
    periodNameEn: session.periodNameEn,
    studentId: student.id,
    studentNumber: student.studentNumber,
    studentNameAr: student.studentNameAr,
    studentNameEn: student.studentNameEn,
    status: entry.status,
    minutesLate: entry.minutesLate,
    minutesEarlyLeave: entry.minutesEarlyLeave,
    stageId: stage?.id,
    gradeId: grade?.id,
    sectionId: section?.id,
    classroomId: classroom?.id,
    stageNameAr: stage?.nameAr,
    stageNameEn: stage?.nameEn,
    gradeNameAr: grade?.nameAr,
    gradeNameEn: grade?.nameEn,
    sectionNameAr: section?.nameAr,
    sectionNameEn: section?.nameEn,
    classroomNameAr: classroom?.nameAr,
    classroomNameEn: classroom?.nameEn,
    updatedAt: entry.updatedAt,
  };
}

async function loadBaseAttendanceData(filters: AttendanceReportsFilters & { yearId: string; termId: string }) {
  const { yearId, termId, dateFrom, dateTo, scopeType, scopeIds, studentId, attendanceStatus, incidentType } = filters;

  const [structure, sessions, schoolRoster] = await Promise.all([
    fetchStructureTree(yearId, termId),
    fetchSessions(yearId, termId, dateFrom, dateTo),
    fetchRoster("SCHOOL", {}),
  ]);

  const submittedSessions = sessions.filter((session) => session.status === "SUBMITTED");
  const maps = buildStructureMaps(structure.stages, structure.grades, structure.sections, structure.classrooms);

  const filteredSessions = submittedSessions.filter((session) => {
    const resolved = buildSessionScope(session, maps);
    return matchesResolvedAttendanceScope(scopeType, scopeIds, resolved);
  });

  const entries = filteredSessions.length > 0
    ? await fetchEntriesForSessions(yearId, termId, filteredSessions.map((session) => session.id))
    : [];

  const studentsById = buildStudentMap(schoolRoster);

  let attendanceRows = entries
    .map((entry) => {
      const session = filteredSessions.find((item) => item.id === entry.sessionId);
      if (!session) return null;
      return buildAttendanceRow(session, entry, studentsById.get(entry.studentId), maps);
    })
    .filter((row): row is ReportsAttendanceRow => !!row);

  if (studentId) {
    attendanceRows = attendanceRows.filter((row) => row.studentId === studentId);
  }

  if (attendanceStatus !== "ALL") {
    attendanceRows = attendanceRows.filter((row) => row.status === attendanceStatus);
  }

  attendanceRows = attendanceRows.filter((row) => includesStatusInIncidentFilter(row.status, incidentType));

  return {
    structure,
    maps,
    filteredSessions,
    attendanceRows,
  };
}

async function buildMissingAttendanceCounts(
  sessions: AttendanceSession[],
  attendanceRows: ReportsAttendanceRow[],
  studentId?: string
) {
  const rosterCache = new Map<string, Awaited<ReturnType<typeof fetchRoster>>>();
  const counts = new Map<string, number>();

  for (const session of sessions) {
    const key = `${session.scopeType}-${JSON.stringify(session.scopeIds || {})}`;
    let roster = rosterCache.get(key);
    if (!roster) {
      roster = await fetchRoster(session.scopeType, session.scopeIds || {});
      rosterCache.set(key, roster);
    }

    const existingStudentIds = new Set(
      attendanceRows.filter((row) => row.sessionId === session.id).map((row) => row.studentId)
    );

    for (const student of roster) {
      if (studentId && student.id !== studentId) continue;
      if (existingStudentIds.has(student.id)) continue;
      counts.set(student.id, (counts.get(student.id) || 0) + 1);
    }
  }

  return counts;
}

function buildTrend(pointsSource: ReportsAttendanceRow[], bucket: ReportsTrendBucket): ReportsTrendPoint[] {
  const grouped = new Map<string, ReportsAttendanceRow[]>();

  for (const row of pointsSource) {
    const key = getBucketKey(row.date, bucket);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => {
      const range = getBucketRange(key, bucket);
      return {
        key,
        label: bucket === "day" ? key : `${range.dateFrom} - ${range.dateTo}`,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
        attendanceRate: computeAttendanceRate(rows),
        markedCount: rows.length,
        presentCount: rows.filter((row) => row.status === "PRESENT").length,
        absentCount: rows.filter((row) => row.status === "ABSENT").length,
        excusedCount: rows.filter((row) => row.status === "EXCUSED").length,
        lateCount: rows.filter((row) => row.status === "LATE").length,
        earlyLeaveCount: rows.filter((row) => row.status === "EARLY_LEAVE").length,
      };
    });
}

function aggregateScopeBreakdown(
  rows: ReportsAttendanceRow[],
  level: ReportsPerformanceLevel,
  localeRows: AbsenceRecord[] | Incident[] = []
): ReportsScopeBreakdownRow[] {
  const grouped = new Map<string, { labelAr: string; labelEn: string; count: number; attendanceRows: ReportsAttendanceRow[] }>();

  const getId = (row: ReportsAttendanceRow) => {
    if (level === "grade") return row.gradeId;
    if (level === "section") return row.sectionId;
    if (level === "classroom") return row.classroomId;
    return row.stageId;
  };

  const getLabels = (row: ReportsAttendanceRow) => {
    if (level === "grade") return { labelAr: row.gradeNameAr || "-", labelEn: row.gradeNameEn || "-" };
    if (level === "section") return { labelAr: row.sectionNameAr || "-", labelEn: row.sectionNameEn || "-" };
    if (level === "classroom") return { labelAr: row.classroomNameAr || "-", labelEn: row.classroomNameEn || "-" };
    return { labelAr: row.stageNameAr || "-", labelEn: row.stageNameEn || "-" };
  };

  for (const row of rows) {
    const id = getId(row);
    if (!id) continue;
    if (!grouped.has(id)) {
      const labels = getLabels(row);
      grouped.set(id, { ...labels, count: 0, attendanceRows: [] });
    }
    const group = grouped.get(id)!;
    group.attendanceRows.push(row);
  }

  for (const item of localeRows) {
    let id: string | undefined;

    if ("scopeIds" in item) {
      id =
        level === "grade"
          ? item.scopeIds?.gradeId
          : level === "section"
            ? item.scopeIds?.sectionId
            : level === "classroom"
              ? item.scopeIds?.classroomId
              : item.scopeIds?.stageId;
    } else {
      const incident = item as Incident;
      id =
        level === "grade"
          ? incident.gradeId
          : level === "section"
            ? incident.sectionId
            : level === "classroom"
              ? incident.classroomId
              : incident.stageId;
    }

    if (!id) continue;
    const group = grouped.get(id);
    if (group) {
      group.count += 1;
    }
  }

  return Array.from(grouped.entries())
    .map(([id, value]) => ({
      id,
      labelAr: value.labelAr,
      labelEn: value.labelEn,
      incidents: value.count,
      attendanceRate: value.attendanceRows.length > 0 ? computeAttendanceRate(value.attendanceRows) : undefined,
    }))
    .sort((a, b) => b.incidents - a.incidents);
}

function buildAbsenceAnalysis(
  absenceRecords: AbsenceRecord[],
  attendanceRows: ReportsAttendanceRow[],
  bucket: ReportsTrendBucket
): ReportsAbsenceAnalysis {
  const absenceOnly = absenceRecords.filter((record) => record.status === "ABSENT" || record.status === "EXCUSED");
  const groupedByStudent = new Map<string, ReportsAbsenceAnalysis["topStudents"][number]>();

  for (const record of absenceOnly) {
    const current = groupedByStudent.get(record.studentId) || {
      studentId: record.studentId,
      studentNameAr: record.studentNameAr,
      studentNameEn: record.studentNameEn,
      studentNumber: record.studentNumber,
      absenceCount: 0,
      excusedCount: 0,
      unexcusedCount: 0,
    };

    current.absenceCount += 1;
    if (record.status === "EXCUSED" || record.excuse) {
      current.excusedCount += 1;
    } else {
      current.unexcusedCount += 1;
    }

    groupedByStudent.set(record.studentId, current);
  }

  const weekdayMap = new Map<string, number>();
  for (const record of absenceOnly) {
    const weekday = new Date(record.date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    weekdayMap.set(weekday, (weekdayMap.get(weekday) || 0) + 1);
  }

  const absenceTrendRows = absenceOnly.map((record) => ({
    id: record.id,
    sessionId: record.sourceSessionId || record.id,
    date: record.date,
    sessionStatus: "SUBMITTED" as const,
    mode: "PERIOD" as const,
    studentId: record.studentId,
    studentNumber: record.studentNumber,
    studentNameAr: record.studentNameAr,
    studentNameEn: record.studentNameEn,
    status: (record.status === "EXCUSED" ? "EXCUSED" : "ABSENT") as AttendanceStatus,
    stageId: record.scopeIds?.stageId,
    gradeId: record.scopeIds?.gradeId,
    sectionId: record.scopeIds?.sectionId,
    classroomId: record.scopeIds?.classroomId,
    gradeNameAr: record.gradeNameAr,
    gradeNameEn: record.gradeNameEn,
    sectionNameAr: record.sectionNameAr,
    sectionNameEn: record.sectionNameEn,
    classroomNameAr: record.classroomNameAr,
    classroomNameEn: record.classroomNameEn,
    updatedAt: record.updatedAt,
  }));

  return {
    totalAbsences: absenceOnly.length,
    excusedCount: absenceOnly.filter((record) => record.status === "EXCUSED" || record.excuse).length,
    unexcusedCount: absenceOnly.filter((record) => record.status === "ABSENT" && !record.excuse).length,
    byDate: buildTrend(absenceTrendRows, bucket),
    byGrade: aggregateScopeBreakdown(attendanceRows, "grade", absenceOnly),
    bySection: aggregateScopeBreakdown(attendanceRows, "section", absenceOnly),
    byClassroom: aggregateScopeBreakdown(attendanceRows, "classroom", absenceOnly),
    topStudents: Array.from(groupedByStudent.values()).sort((a, b) => b.absenceCount - a.absenceCount).slice(0, 10),
    weekdayPattern: Array.from(weekdayMap.entries()).map(([weekday, count]) => ({ weekday, count })).sort((a, b) => b.count - a.count),
  };
}

function buildLateEarlyAnalysis(
  incidents: Incident[],
  attendanceRows: ReportsAttendanceRow[],
  bucket: ReportsTrendBucket
): ReportsLateEarlyAnalysis {
  const late = incidents.filter((incident) => incident.type === "LATE");
  const early = incidents.filter((incident) => incident.type === "EARLY_LEAVE");

  const aggregateStudents = (source: Incident[]) => {
    const grouped = new Map<string, ReportsLateEarlyAnalysis["topLateStudents"][number]>();

    for (const incident of source) {
      const current = grouped.get(incident.studentId) || {
        studentId: incident.studentId,
        studentNameAr: incident.studentNameAr,
        studentNameEn: incident.studentNameEn,
        studentNumber: incident.studentNumber,
        incidentCount: 0,
        averageMinutes: 0,
        violationCount: 0,
      };

      current.incidentCount += 1;
      current.averageMinutes += incident.minutes;
      current.violationCount += incident.isViolation ? 1 : 0;
      grouped.set(incident.studentId, current);
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        averageMinutes: row.incidentCount > 0 ? Number((row.averageMinutes / row.incidentCount).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.incidentCount - a.incidentCount)
      .slice(0, 10);
  };

  const trendRows = incidents.map((incident) => ({
    id: incident.id,
    sessionId: incident.sessionId,
    date: incident.date,
    sessionStatus: incident.sessionStatus || "SUBMITTED",
    mode: "PERIOD" as const,
    periodIndex: incident.periodIndex,
    periodNameAr: incident.periodNameAr,
    periodNameEn: incident.periodNameEn,
    studentId: incident.studentId,
    studentNumber: incident.studentNumber || "",
    studentNameAr: incident.studentNameAr,
    studentNameEn: incident.studentNameEn,
    status: (incident.type === "LATE" ? "LATE" : "EARLY_LEAVE") as AttendanceStatus,
    minutesLate: incident.type === "LATE" ? incident.minutes : undefined,
    minutesEarlyLeave: incident.type === "EARLY_LEAVE" ? incident.minutes : undefined,
    stageId: incident.stageId,
    gradeId: incident.gradeId,
    sectionId: incident.sectionId,
    classroomId: incident.classroomId,
    gradeNameAr: incident.gradeNameAr,
    gradeNameEn: incident.gradeNameEn,
    sectionNameAr: incident.sectionNameAr,
    sectionNameEn: incident.sectionNameEn,
    classroomNameAr: incident.classroomNameAr,
    classroomNameEn: incident.classroomNameEn,
    updatedAt: incident.updatedAt,
  }));

  return {
    totalLate: late.length,
    totalEarlyLeave: early.length,
    violationCount: incidents.filter((incident) => incident.isViolation).length,
    averageLateMinutes: late.length ? Number((late.reduce((sum, item) => sum + item.minutes, 0) / late.length).toFixed(1)) : 0,
    averageEarlyLeaveMinutes: early.length ? Number((early.reduce((sum, item) => sum + item.minutes, 0) / early.length).toFixed(1)) : 0,
    trend: buildTrend(trendRows, bucket),
    byGrade: aggregateScopeBreakdown(attendanceRows, "grade", incidents),
    bySection: aggregateScopeBreakdown(attendanceRows, "section", incidents),
    byClassroom: aggregateScopeBreakdown(attendanceRows, "classroom", incidents),
    topLateStudents: aggregateStudents(late),
    topEarlyLeaveStudents: aggregateStudents(early),
  };
}

function buildExcusesAnalysis(excuseRequests: ExcuseRequest[], maps: StructureMaps): ReportsExcusesAnalysis {
  const byType = new Map<ExcuseType, number>();
  const byStudent = new Map<string, ReportsExcusesAnalysis["topStudents"][number]>();
  const byScope = new Map<string, ReportsExcusesAnalysis["topScopes"][number]>();

  for (const request of excuseRequests) {
    byType.set(request.type, (byType.get(request.type) || 0) + 1);

    const student = byStudent.get(request.studentId) || {
      studentId: request.studentId,
      studentNameAr: request.studentNameAr,
      studentNameEn: request.studentNameEn,
      studentNumber: request.studentNumber,
      count: 0,
      approvedCount: 0,
      rejectedCount: 0,
    };
    student.count += 1;
    if (request.status === "APPROVED") student.approvedCount += 1;
    if (request.status === "REJECTED") student.rejectedCount += 1;
    byStudent.set(request.studentId, student);

    const scopeKey = `${request.scopeType}-${JSON.stringify(request.scopeIds || {})}`;
    const stage = request.scopeIds?.stageId ? maps.stagesById.get(request.scopeIds.stageId) : undefined;
    const grade = request.scopeIds?.gradeId ? maps.gradesById.get(request.scopeIds.gradeId) : undefined;
    const section = request.scopeIds?.sectionId ? maps.sectionsById.get(request.scopeIds.sectionId) : undefined;
    const classroom = request.scopeIds?.classroomId ? maps.classroomsById.get(request.scopeIds.classroomId) : undefined;
    const scope = byScope.get(scopeKey) || {
      key: scopeKey,
      labelAr:
        request.scopeType === "CLASSROOM"
          ? classroom?.nameAr || classroom?.name || "الفصل"
          : request.scopeType === "SECTION"
            ? section?.nameAr || section?.name || "الشعبة"
            : request.scopeType === "GRADE"
              ? grade?.nameAr || grade?.name || "الصف"
              : request.scopeType === "STAGE"
                ? stage?.nameAr || stage?.name || "المرحلة"
                : "المدرسة",
      labelEn:
        request.scopeType === "CLASSROOM"
          ? classroom?.nameEn || classroom?.name || "Classroom"
          : request.scopeType === "SECTION"
            ? section?.nameEn || section?.name || "Section"
            : request.scopeType === "GRADE"
              ? grade?.nameEn || grade?.name || "Grade"
              : request.scopeType === "STAGE"
                ? stage?.nameEn || stage?.name || "Stage"
                : "School",
      total: 0,
    };
    scope.total += 1;
    byScope.set(scopeKey, scope);
  }

  const approvedCount = excuseRequests.filter((request) => request.status === "APPROVED").length;

  return {
    totalRequests: excuseRequests.length,
    pendingCount: excuseRequests.filter((request) => request.status === "PENDING").length,
    approvedCount,
    rejectedCount: excuseRequests.filter((request) => request.status === "REJECTED").length,
    approvalRate: excuseRequests.length > 0 ? Number(((approvedCount / excuseRequests.length) * 100).toFixed(1)) : 0,
    withAttachmentsCount: excuseRequests.filter((request) => request.attachments.length > 0).length,
    lateSubmissionsCount: excuseRequests.filter((request) => request.createdAt.slice(0, 10) > request.dateTo).length,
    byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    topStudents: Array.from(byStudent.values()).sort((a, b) => b.count - a.count).slice(0, 10),
    topScopes: Array.from(byScope.values()).sort((a, b) => b.total - a.total).slice(0, 10),
  };
}

function buildRiskFlags(params: {
  attendanceRate: number;
  absenceCount: number;
  lateCount: number;
  rejectedExcuses: number;
  missingMarks: number;
}): ReportsRiskFlag[] {
  const flags: ReportsRiskFlag[] = [];

  if (params.attendanceRate < RISK_RULES.lowAttendanceRate) {
    flags.push({ code: "low_attendance", count: Math.round(params.attendanceRate) });
  }
  if (params.absenceCount >= RISK_RULES.repeatedAbsenceCount) {
    flags.push({ code: "repeated_absence", count: params.absenceCount });
  }
  if (params.lateCount >= RISK_RULES.repeatedLateCount) {
    flags.push({ code: "repeated_late", count: params.lateCount });
  }
  if (params.rejectedExcuses >= RISK_RULES.rejectedExcuseCount) {
    flags.push({ code: "rejected_excuses", count: params.rejectedExcuses });
  }
  if (params.missingMarks >= RISK_RULES.missingAttendanceMarks) {
    flags.push({ code: "missing_attendance", count: params.missingMarks });
  }

  return flags;
}

function buildRiskStudents(
  attendanceRows: ReportsAttendanceRow[],
  absences: AbsenceRecord[],
  incidents: Incident[],
  excuseRequests: ExcuseRequest[],
  missingCounts: Map<string, number>
): ReportsRiskStudentRow[] {
  const grouped = new Map<string, Omit<ReportsRiskStudentRow, "flags">>();

  for (const row of attendanceRows) {
    const current = grouped.get(row.studentId) || {
      studentId: row.studentId,
      studentNameAr: row.studentNameAr,
      studentNameEn: row.studentNameEn,
      studentNumber: row.studentNumber,
      attendanceRate: 0,
      absenceCount: 0,
      lateCount: 0,
      earlyLeaveCount: 0,
      rejectedExcuses: 0,
      missingMarks: 0,
      scopeLabelAr: row.classroomNameAr || row.sectionNameAr || row.gradeNameAr || "-",
      scopeLabelEn: row.classroomNameEn || row.sectionNameEn || row.gradeNameEn || "-",
    };
    grouped.set(row.studentId, current);
  }

  for (const [studentId, current] of grouped.entries()) {
    const studentRows = attendanceRows.filter((row) => row.studentId === studentId);
    current.attendanceRate = computeAttendanceRate(studentRows);
    current.absenceCount = absences.filter((record) => record.studentId === studentId && record.status === "ABSENT").length;
    current.lateCount = incidents.filter((incident) => incident.studentId === studentId && incident.type === "LATE").length;
    current.earlyLeaveCount = incidents.filter((incident) => incident.studentId === studentId && incident.type === "EARLY_LEAVE").length;
    current.rejectedExcuses = excuseRequests.filter((request) => request.studentId === studentId && request.status === "REJECTED").length;
    current.missingMarks = missingCounts.get(studentId) || 0;
  }

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      flags: buildRiskFlags(row),
    }))
    .filter((row) => row.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length || a.attendanceRate - b.attendanceRate);
}

function buildPerformanceRows(
  level: ReportsPerformanceLevel,
  rows: ReportsAttendanceRow[],
  previousRows: ReportsAttendanceRow[]
): ReportsPerformanceRow[] {
  const grouped = new Map<string, ReportsPerformanceRow>();

  const getKey = (row: ReportsAttendanceRow) => {
    if (level === "stage") return row.stageId;
    if (level === "grade") return row.gradeId;
    if (level === "section") return row.sectionId;
    return row.classroomId;
  };

  const getLabels = (row: ReportsAttendanceRow) => {
    if (level === "stage") {
      return { labelAr: row.stageNameAr || "-", labelEn: row.stageNameEn || "-", parentId: undefined };
    }
    if (level === "grade") {
      return { labelAr: row.gradeNameAr || "-", labelEn: row.gradeNameEn || "-", parentId: row.stageId };
    }
    if (level === "section") {
      return { labelAr: row.sectionNameAr || "-", labelEn: row.sectionNameEn || "-", parentId: row.gradeId };
    }
    return { labelAr: row.classroomNameAr || "-", labelEn: row.classroomNameEn || "-", parentId: row.sectionId };
  };

  for (const row of rows) {
    const key = getKey(row);
    if (!key) continue;
    if (!grouped.has(key)) {
      const labels = getLabels(row);
      grouped.set(key, {
        id: key,
        level,
        parentId: labels.parentId,
        labelAr: labels.labelAr,
        labelEn: labels.labelEn,
        attendanceRate: 0,
        markedCount: 0,
        presentCount: 0,
        absentCount: 0,
        excusedCount: 0,
        lateCount: 0,
        earlyLeaveCount: 0,
        studentCount: 0,
      });
    }

    const group = grouped.get(key)!;
    group.markedCount += 1;
    if (row.status === "PRESENT") group.presentCount += 1;
    if (row.status === "ABSENT") group.absentCount += 1;
    if (row.status === "EXCUSED") group.excusedCount += 1;
    if (row.status === "LATE") group.lateCount += 1;
    if (row.status === "EARLY_LEAVE") group.earlyLeaveCount += 1;
  }

  for (const group of grouped.values()) {
    const sourceRows = rows.filter((row) => getKey(row) === group.id);
    group.attendanceRate = computeAttendanceRate(sourceRows);
    group.studentCount = new Set(sourceRows.map((row) => row.studentId)).size;
  }

  if (previousRows.length > 0) {
    const previousGrouped = new Map<string, number>();
    for (const row of previousRows) {
      const key = getKey(row);
      if (!key) continue;
      if (!previousGrouped.has(key)) previousGrouped.set(key, 0);
    }
    for (const key of previousGrouped.keys()) {
      previousGrouped.set(key, computeAttendanceRate(previousRows.filter((row) => getKey(row) === key)));
    }

    for (const group of grouped.values()) {
      const previousRate = previousGrouped.get(group.id);
      if (typeof previousRate === "number") {
        group.delta = Number((group.attendanceRate - previousRate).toFixed(1));
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.attendanceRate - b.attendanceRate);
}

function buildOverviewCards(
  attendanceRows: ReportsAttendanceRow[],
  incidents: Incident[],
  riskStudents: ReportsRiskStudentRow[],
  performance: Record<ReportsPerformanceLevel, ReportsPerformanceRow[]>,
  previousAttendanceRows: ReportsAttendanceRow[]
): { cards: ReportsKpiCard[]; sectionsBelowThreshold: number } {
  const currentAttendanceRate = computeAttendanceRate(attendanceRows);
  const previousAttendanceRate = previousAttendanceRows.length > 0 ? computeAttendanceRate(previousAttendanceRows) : undefined;

  const belowThresholdCount = [...performance.section, ...performance.classroom].filter(
    (row) => row.markedCount > 0 && row.attendanceRate < ATTENDANCE_THRESHOLD
  ).length;

  const cards: ReportsKpiCard[] = [
    {
      key: "attendanceRate",
      value: currentAttendanceRate,
      displayValue: `${currentAttendanceRate.toFixed(1)}%`,
      delta: typeof previousAttendanceRate === "number" ? Number((currentAttendanceRate - previousAttendanceRate).toFixed(1)) : undefined,
    },
    {
      key: "presentCount",
      value: attendanceRows.filter((row) => row.status === "PRESENT").length,
      displayValue: `${attendanceRows.filter((row) => row.status === "PRESENT").length}`,
    },
    {
      key: "absentCount",
      value: attendanceRows.filter((row) => row.status === "ABSENT").length,
      displayValue: `${attendanceRows.filter((row) => row.status === "ABSENT").length}`,
    },
    {
      key: "excusedCount",
      value: attendanceRows.filter((row) => row.status === "EXCUSED").length,
      displayValue: `${attendanceRows.filter((row) => row.status === "EXCUSED").length}`,
    },
    {
      key: "lateCount",
      value: incidents.filter((incident) => incident.type === "LATE").length,
      displayValue: `${incidents.filter((incident) => incident.type === "LATE").length}`,
    },
    {
      key: "earlyLeaveCount",
      value: incidents.filter((incident) => incident.type === "EARLY_LEAVE").length,
      displayValue: `${incidents.filter((incident) => incident.type === "EARLY_LEAVE").length}`,
    },
    {
      key: "riskStudents",
      value: riskStudents.length,
      displayValue: `${riskStudents.length}`,
    },
    {
      key: "groupsBelowThreshold",
      value: belowThresholdCount,
      displayValue: `${belowThresholdCount}`,
    },
  ];

  return {
    cards,
    sectionsBelowThreshold: belowThresholdCount,
  };
}

export async function fetchAttendanceReportSummary(
  params: AttendanceReportsFilters & { yearId: string; termId: string }
): Promise<AttendanceReportsData> {
  const base = await loadBaseAttendanceData(params);

  const previousRange = shiftRange(params.dateFrom, params.dateTo);
  const previousBase = previousRange.dateFrom && previousRange.dateTo
    ? await loadBaseAttendanceData({ ...params, ...previousRange })
    : { attendanceRows: [] as ReportsAttendanceRow[] };

  const [absenceRecords, incidents, excuseRequests, missingCounts] = await Promise.all([
    fetchAbsenceRecords({
      yearId: params.yearId,
      termId: params.termId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      scopeType: params.scopeType,
      scopeIds: params.scopeIds,
      status: "ALL",
      granularities: ["PERIOD"],
      onlyUnexcused: false,
      search: "",
    }).then((rows) =>
      rows.filter((row) => {
        if (params.studentId && row.studentId !== params.studentId) return false;
        if (params.incidentType === "ABSENCE") return row.status === "ABSENT";
        if (params.incidentType === "EXCUSED") return row.status === "EXCUSED" || !!row.excuse;
        if (params.incidentType === "LATE") return row.status === "LATE";
        if (params.incidentType === "EARLY_LEAVE") return row.status === "EARLY_LEAVE";
        return true;
      })
    ),
    fetchIncidents({
      yearId: params.yearId,
      termId: params.termId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      scopeType: params.scopeType,
      scopeIds: params.scopeIds,
      type:
        params.incidentType === "LATE" || params.incidentType === "EARLY_LEAVE"
          ? params.incidentType
          : "ALL",
      search: "",
      onlyViolations: false,
      sessionStatus: "SUBMITTED",
    }).then((rows) => rows.filter((row) => !params.studentId || row.studentId === params.studentId)),
    fetchExcuseRequests({
      yearId: params.yearId,
      termId: params.termId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      scopeType: params.scopeType,
      scopeIds: params.scopeIds,
      status: params.excuseStatus,
      type: "ALL",
      search: "",
      hasAttachment: "ALL",
    }).then((rows) => rows.filter((row) => !params.studentId || row.studentId === params.studentId)),
    buildMissingAttendanceCounts(base.filteredSessions, base.attendanceRows, params.studentId),
  ]);

  const bucket = getTrendBucket(params.dateFrom, params.dateTo);
  const trend = buildTrend(base.attendanceRows, bucket);
  const absenceAnalysis = buildAbsenceAnalysis(absenceRecords, base.attendanceRows, bucket);
  const lateEarlyAnalysis = buildLateEarlyAnalysis(incidents, base.attendanceRows, bucket);
  const excusesAnalysis = buildExcusesAnalysis(excuseRequests, base.maps);
  const riskStudents = buildRiskStudents(base.attendanceRows, absenceRecords, incidents, excuseRequests, missingCounts);

  const performance = {
    stage: buildPerformanceRows("stage", base.attendanceRows, previousBase.attendanceRows || []),
    grade: buildPerformanceRows("grade", base.attendanceRows, previousBase.attendanceRows || []),
    section: buildPerformanceRows("section", base.attendanceRows, previousBase.attendanceRows || []),
    classroom: buildPerformanceRows("classroom", base.attendanceRows, previousBase.attendanceRows || []),
  } satisfies Record<ReportsPerformanceLevel, ReportsPerformanceRow[]>;

  const overview = buildOverviewCards(base.attendanceRows, incidents, riskStudents, performance, previousBase.attendanceRows || []);

  const studentOptions: ReportsStudentOption[] = Array.from(
    new Map(
      base.attendanceRows.map((row) => [
        row.studentId,
        {
          id: row.studentId,
          label: `${row.studentNameEn} (${row.studentNumber})`,
          studentNumber: row.studentNumber,
        },
      ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label));

  return {
    filters: params,
    studentOptions,
    attendanceRows: base.attendanceRows,
    absenceRecords,
    incidents,
    excuseRequests,
    overview,
    trend: {
      bucket,
      points: trend,
    },
    absenceAnalysis,
    lateEarlyAnalysis,
    excusesAnalysis,
    riskStudents,
    performance,
  };
}
