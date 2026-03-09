import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceEntry, AttendanceSession } from "@/features/attendance/roll-call/types";
import type { Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";
import type { Incident, IncidentType } from "../types";

interface StudentLike {
  id: string;
  studentNumber?: string;
  nameAr?: string;
  nameEn?: string;
  full_name_ar?: string;
  full_name_en?: string;
  student_id?: string;
}

interface DeriveOptions {
  yearId: string;
  termId: string;
  sessions: AttendanceSession[];
  entries: AttendanceEntry[];
  policies: AttendancePolicy[];
  grades: Grade[];
  sections: Section[];
  studentsById: Map<string, StudentLike>;
}

interface ResolvedScope {
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
}

const POLICY_PRIORITY: Array<AttendancePolicy["scopeType"]> = ["SECTION", "GRADE", "STAGE", "SCHOOL"];

export function resolveSessionScope(
  session: AttendanceSession,
  gradesById: Map<string, Grade>,
  sectionsById: Map<string, Section>
): ResolvedScope {
  const sectionId = session.scopeIds?.sectionId;
  if (session.scopeType === "SECTION" && sectionId) {
    const section = sectionsById.get(sectionId);
    const grade = section ? gradesById.get(section.gradeId) : undefined;
    return {
      sectionId,
      gradeId: section?.gradeId,
      stageId: grade?.stageId,
    };
  }

  const gradeId = session.scopeIds?.gradeId;
  if (session.scopeType === "GRADE" && gradeId) {
    const grade = gradesById.get(gradeId);
    return {
      gradeId,
      stageId: grade?.stageId,
    };
  }

  const stageId = session.scopeIds?.stageId;
  if (session.scopeType === "STAGE" && stageId) {
    return { stageId };
  }

  return {};
}

function resolveEffectivePolicy(
  policies: AttendancePolicy[],
  date: string,
  scope: ResolvedScope
): AttendancePolicy | null {
  const active = policies.filter((policy) => {
    if (!policy.isActive) return false;
    if (date < policy.effectiveStartDate || date > policy.effectiveEndDate) return false;
    return true;
  });

  for (const scopeType of POLICY_PRIORITY) {
    const match = active.find((policy) => {
      if (policy.scopeType !== scopeType) return false;
      if (scopeType === "SCHOOL") return true;
      if (scopeType === "STAGE") return policy.scopeIds?.stageId === scope.stageId;
      if (scopeType === "GRADE") return policy.scopeIds?.gradeId === scope.gradeId;
      return policy.scopeIds?.sectionId === scope.sectionId;
    });

    if (match) return match;
  }

  return null;
}

function getStudentInfo(student: StudentLike | undefined) {
  return {
    studentNameAr: student?.nameAr || student?.full_name_ar || "",
    studentNameEn: student?.nameEn || student?.full_name_en || "",
    studentNumber: student?.studentNumber || student?.student_id || student?.id || "",
  };
}

function toIncident(
  yearId: string,
  termId: string,
  session: AttendanceSession,
  entry: AttendanceEntry,
  type: IncidentType,
  minutes: number,
  scope: ResolvedScope,
  gradesById: Map<string, Grade>,
  sectionsById: Map<string, Section>,
  policy: AttendancePolicy | null,
  studentsById: Map<string, StudentLike>
): Incident {
  const grade = scope.gradeId ? gradesById.get(scope.gradeId) : undefined;
  const section = scope.sectionId ? sectionsById.get(scope.sectionId) : undefined;
  const student = studentsById.get(entry.studentId);
  const threshold = type === "LATE" ? policy?.lateThresholdMinutes : policy?.earlyLeaveThresholdMinutes;

  return {
    id: `${session.id}:${entry.studentId}:${type}`,
    yearId,
    termId,
    date: session.date,
    periodIndex: session.periodIndex || 0,
    periodNameAr: session.periodNameAr,
    periodNameEn: session.periodNameEn,
    sessionId: session.id,
    studentId: entry.studentId,
    ...getStudentInfo(student),
    stageId: scope.stageId,
    gradeId: scope.gradeId,
    sectionId: scope.sectionId,
    gradeNameAr: grade?.nameAr,
    gradeNameEn: grade?.nameEn,
    sectionNameAr: section?.nameAr,
    sectionNameEn: section?.nameEn,
    type,
    minutes,
    threshold: typeof threshold === "number" ? threshold : undefined,
    isViolation: typeof threshold === "number" ? minutes >= threshold : false,
    policyScopeSummary: policy ? `${policy.scopeType} - ${policy.nameEn || policy.nameAr}` : "SCHOOL - default",
    sessionStatus: session.status,
    updatedAt: entry.updatedAt,
  };
}

export function deriveIncidentsFromSessions(options: DeriveOptions): Incident[] {
  const { yearId, termId, sessions, entries, policies, grades, sections, studentsById } = options;
  const gradesById = new Map(grades.map((grade) => [grade.id, grade]));
  const sectionsById = new Map(sections.map((section) => [section.id, section]));

  const entriesBySession = new Map<string, AttendanceEntry[]>();
  for (const entry of entries) {
    const bucket = entriesBySession.get(entry.sessionId) || [];
    bucket.push(entry);
    entriesBySession.set(entry.sessionId, bucket);
  }

  const incidents: Incident[] = [];

  for (const session of sessions) {
    if (session.mode !== "PERIOD" || !session.periodIndex) continue;

    const scope = resolveSessionScope(session, gradesById, sectionsById);
    const policy = resolveEffectivePolicy(policies, session.date, scope);
    const sessionEntries = entriesBySession.get(session.id) || [];

    for (const entry of sessionEntries) {
      const isLate = entry.status === "LATE" || (typeof entry.minutesLate === "number" && entry.minutesLate > 0);
      if (isLate) {
        incidents.push(
          toIncident(
            yearId,
            termId,
            session,
            entry,
            "LATE",
            Math.max(0, entry.minutesLate || 0),
            scope,
            gradesById,
            sectionsById,
            policy,
            studentsById
          )
        );
      }

      const isEarlyLeave = entry.status === "EARLY_LEAVE" && typeof entry.minutesEarlyLeave === "number";
      if (isEarlyLeave) {
        incidents.push(
          toIncident(
            yearId,
            termId,
            session,
            entry,
            "EARLY_LEAVE",
            Math.max(0, entry.minutesEarlyLeave || 0),
            scope,
            gradesById,
            sectionsById,
            policy,
            studentsById
          )
        );
      }
    }
  }

  return incidents;
}
