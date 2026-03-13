import { mockStudents } from "@/data/mockStudents";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import {
  fetchEntriesForSessions,
  fetchRoster,
  fetchSessions,
  upsertEntry,
} from "@/features/attendance/roll-call/services/attendanceRollCallService";
import { matchesResolvedAttendanceScope } from "@/features/attendance/shared/attendanceScope";
import type { AttendanceEntry, AttendanceSession } from "@/features/attendance/roll-call/types";
import type { Incident, LateEarlyFilters } from "../types";
import { deriveIncidentsFromSessions, resolveSessionScope } from "../utils/deriveIncidents";

interface FetchIncidentsParams extends Partial<LateEarlyFilters> {
  yearId: string;
  termId: string;
}

interface UpdateIncidentMinutesParams {
  yearId: string;
  termId: string;
  sessionId: string;
  studentId: string;
  type: "LATE" | "EARLY_LEAVE";
  minutes: number;
}

interface StudentLike {
  id: string;
  studentNumber?: string;
  nameAr?: string;
  nameEn?: string;
  full_name_ar?: string;
  full_name_en?: string;
  student_id?: string;
}

function buildStudentsMap(roster: Awaited<ReturnType<typeof fetchRoster>>): Map<string, StudentLike> {
  const map = new Map<string, StudentLike>();

  for (const student of mockStudents as StudentLike[]) {
    map.set(student.id, student);
  }

  for (const student of roster) {
    map.set(student.id, {
      id: student.id,
      nameAr: student.nameAr,
      nameEn: student.nameEn,
      studentNumber: student.studentNumber,
    });
  }

  return map;
}

function applyScopeFilter(
  sessions: AttendanceSession[],
  scopeType: LateEarlyFilters["scopeType"],
  scopeIds: LateEarlyFilters["scopeIds"],
  grades: Grade[],
  sections: Section[],
  classrooms: Classroom[]
): AttendanceSession[] {
  const gradesById = new Map(grades.map((grade) => [grade.id, grade]));
  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const classroomsById = new Map(classrooms.map((classroom) => [classroom.id, classroom]));

  return sessions.filter((session) => {
    const resolved = resolveSessionScope(session, gradesById, sectionsById, classroomsById);
    return matchesResolvedAttendanceScope(scopeType, scopeIds, resolved);
  });
}

function applyIncidentFilters(incidents: Incident[], filters: Partial<LateEarlyFilters>): Incident[] {
  const {
    type = "ALL",
    onlyViolations = false,
    minutesMin,
    minutesMax,
    periodIndex,
    search = "",
    sessionStatus = "ALL",
  } = filters;

  return incidents.filter((incident) => {
    if (type !== "ALL" && incident.type !== type) return false;
    if (onlyViolations && !incident.isViolation) return false;
    if (typeof minutesMin === "number" && incident.minutes < minutesMin) return false;
    if (typeof minutesMax === "number" && incident.minutes > minutesMax) return false;
    if (typeof periodIndex === "number" && incident.periodIndex !== periodIndex) return false;
    if (sessionStatus !== "ALL" && incident.sessionStatus !== sessionStatus) return false;

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      const haystack = [incident.studentNameAr, incident.studentNameEn, incident.studentNumber || ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export async function fetchIncidents(params: FetchIncidentsParams): Promise<Incident[]> {
  const {
    yearId,
    termId,
    dateFrom,
    dateTo,
    scopeType = "SCHOOL",
    scopeIds,
    sessionStatus = "ALL",
  } = params;

  const [structure, policies, allSessions] = await Promise.all([
    fetchStructureTree(yearId, termId),
    fetchPolicies(yearId, termId),
    fetchSessions(yearId, termId, dateFrom, dateTo),
  ]);

  let sessions = allSessions;

  // Filter by session status
  if (sessionStatus !== "ALL") {
    sessions = sessions.filter((session) => session.status === sessionStatus);
  } else {
    // By default, only show SUBMITTED sessions to avoid counting DRAFT as incidents
    sessions = sessions.filter((session) => session.status === "SUBMITTED");
  }

  sessions = applyScopeFilter(sessions, scopeType, scopeIds, structure.grades, structure.sections, structure.classrooms);

  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((session) => session.id);
  const [entries, roster] = await Promise.all([
    fetchEntriesForSessions(yearId, termId, sessionIds),
    fetchRoster("SCHOOL", {}),
  ]);

  const incidents = deriveIncidentsFromSessions({
    yearId,
    termId,
    sessions,
    entries,
    policies,
    grades: structure.grades,
    sections: structure.sections,
    classrooms: structure.classrooms,
    studentsById: buildStudentsMap(roster),
  });

  const filtered = applyIncidentFilters(incidents, params);

  return filtered.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.minutes !== b.minutes) return b.minutes - a.minutes;
    return (a.studentNameEn || "").localeCompare(b.studentNameEn || "");
  });
}

export async function updateIncidentMinutes(params: UpdateIncidentMinutesParams): Promise<Incident> {
  const { yearId, termId, sessionId, studentId, type, minutes } = params;

  if (!Number.isFinite(minutes) || minutes < 0) {
    throw new Error("Minutes must be a non-negative number");
  }

  const patch: Partial<AttendanceEntry> =
    type === "LATE"
      ? { status: "LATE", minutesLate: minutes }
      : { status: "EARLY_LEAVE", minutesEarlyLeave: minutes };

  const [updatedEntry, structure, policies, sessions, roster] = await Promise.all([
    upsertEntry(yearId, termId, sessionId, studentId, patch),
    fetchStructureTree(yearId, termId),
    fetchPolicies(yearId, termId),
    fetchSessions(yearId, termId),
    fetchRoster("SCHOOL", {}),
  ]);

  const session = sessions.find((item) => item.id === sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const incidents = deriveIncidentsFromSessions({
    yearId,
    termId,
    sessions: [session],
    entries: [updatedEntry],
    policies,
    grades: structure.grades,
    sections: structure.sections,
    classrooms: structure.classrooms,
    studentsById: buildStudentsMap(roster),
  });

  const updatedIncident = incidents.find(
    (incident) => incident.sessionId === sessionId && incident.studentId === studentId && incident.type === type
  );

  if (!updatedIncident) {
    throw new Error("Incident not found after update");
  }

  return updatedIncident;
}
