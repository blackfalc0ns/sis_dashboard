// Attendance Roll Call Service

import type {
  AttendanceSession,
  AttendanceEntry,
  AttendanceSessionMode,
  AttendanceSessionStatus,
  SessionWithEntries,
  RosterStudent,
} from "../types";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import { mockStudentEnrollments, mockStudents } from "@/data/mockStudents";
import {
  ATTENDANCE_SCOPE_PRIORITY,
  isScopeSelectionComplete,
  matchesDirectAttendanceScope,
  resolveAttendanceHierarchyScope,
  scopeMatchesTarget,
  type AttendanceScopeIds,
} from "@/features/attendance/shared/attendanceScope";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  getStructureTreeSnapshot,
  resolveStructureContextForAcademicYear,
} from "@/features/academics/academic-structure-tree/services/structureService";

// Term-scoped mock store
const sessionStore: Record<string, AttendanceSession[]> = {};
const entryStore: Record<string, AttendanceEntry[]> = {};

async function ensureSeededAttendanceData(yearId: string, termId: string) {
  const storeKey = `${yearId}-${termId}`;
  if ((sessionStore[storeKey]?.length || 0) > 0) {
    return;
  }

  const [academicYears, terms] = await Promise.all([
    fetchAcademicYears(),
    fetchTermsByYear(yearId),
  ]);

  const academicYear = academicYears.find((item) => item.id === yearId);
  const term = terms.find((item) => item.id === termId);
  if (!academicYear || !term) {
    return;
  }

  const structure = getStructureTreeSnapshot(yearId, termId);
  const classroomsById = new Map(structure.classrooms.map((item) => [item.id, item]));
  const sectionsById = new Map(structure.sections.map((item) => [item.id, item]));
  const gradesById = new Map(structure.grades.map((item) => [item.id, item]));

  const activeEnrollments = mockStudentEnrollments.filter(
    (enrollment) =>
      enrollment.academicYear === academicYear.name &&
      enrollment.status === "active" &&
      enrollment.classroomId &&
      classroomsById.has(enrollment.classroomId)
  );

  const enrollmentsByClassroom = new Map<string, typeof activeEnrollments>();
  for (const enrollment of activeEnrollments) {
    const classroomId = enrollment.classroomId!;
    if (!enrollmentsByClassroom.has(classroomId)) {
      enrollmentsByClassroom.set(classroomId, []);
    }
    enrollmentsByClassroom.get(classroomId)!.push(enrollment);
  }

  const targetClassrooms = Array.from(enrollmentsByClassroom.entries())
    .filter(([, enrollments]) => enrollments.length > 0)
    .sort(([leftId], [rightId]) => {
      const left = classroomsById.get(leftId);
      const right = classroomsById.get(rightId);
      return (left?.order || 0) - (right?.order || 0);
    })
    .slice(0, 6);

  if (targetClassrooms.length === 0) {
    return;
  }

  const seedDates: string[] = [];
  const startDate = new Date(term.startDate);
  for (let week = 0; week < 8; week += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + week * 7);
    seedDates.push(date.toISOString().slice(0, 10));
  }

  sessionStore[storeKey] = [];
  entryStore[storeKey] = [];

  targetClassrooms.forEach(([classroomId, enrollments], classroomIndex) => {
    const classroom = classroomsById.get(classroomId);
    const section = classroom ? sectionsById.get(classroom.sectionId) : undefined;
    const grade = section ? gradesById.get(section.gradeId) : undefined;

    if (!classroom || !section || !grade) {
      return;
    }

    seedDates.forEach((date, dateIndex) => {
      const sessionId = `seed-session-${storeKey}-${classroomId}-${date}`;
      const now = `${date}T07:00:00.000Z`;
      const session: AttendanceSession = {
        id: sessionId,
        yearId,
        termId,
        date,
        scopeType: "CLASSROOM",
        scopeIds: {
          stageId: grade.stageId,
          gradeId: grade.id,
          sectionId: section.id,
          classroomId: classroom.id,
        },
        mode: "PERIOD",
        periodId: `period-1`,
        periodIndex: 1,
        periodNameAr: "الحصة الأولى",
        periodNameEn: "Period 1",
        status: "SUBMITTED",
        createdAt: now,
        updatedAt: now,
      };

      sessionStore[storeKey].push(session);

      enrollments.forEach((enrollment, studentIndex) => {
        const selector = (studentIndex + dateIndex + classroomIndex) % 11;
        const baseEntry: AttendanceEntry = {
          id: `seed-entry-${sessionId}-${enrollment.studentId}`,
          sessionId,
          studentId: enrollment.studentId,
          status: "PRESENT",
          updatedAt: `${date}T08:00:00.000Z`,
        };

        if (selector === 0) {
          baseEntry.status = "ABSENT";
          baseEntry.note = "Repeated absence for reports seeding";
        } else if (selector === 1) {
          baseEntry.status = "EXCUSED";
          baseEntry.excuseReason = "Medical appointment";
          baseEntry.excuseAttachments = [
            {
              id: `att-${sessionId}-${enrollment.studentId}`,
              name: "medical-note.pdf",
              size: 248000,
              type: "application/pdf",
              uploadedAt: `${date}T08:10:00.000Z`,
            },
          ];
        } else if (selector === 2 || selector === 3) {
          baseEntry.status = "LATE";
          baseEntry.minutesLate = 7 + ((studentIndex + dateIndex) % 18);
        } else if (selector === 4) {
          baseEntry.status = "EARLY_LEAVE";
          baseEntry.minutesEarlyLeave = 5 + ((studentIndex + classroomIndex) % 15);
        }

        entryStore[storeKey].push(baseEntry);
      });
    });
  });
}

/**
 * Fetch effective policy for a scope and date
 * Priority: CLASSROOM > SECTION > GRADE > STAGE > SCHOOL
 */
export async function fetchEffectivePolicy(
  yearId: string,
  termId: string,
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM",
  scopeIds: AttendanceScopeIds,
  date: string
): Promise<AttendancePolicy | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const policies = await fetchPolicies(yearId, termId);

  // Filter active policies that cover the date
  const activePolicies = policies.filter((p) => {
    if (!p.isActive) return false;
    if (date < p.effectiveStartDate || date > p.effectiveEndDate) return false;
    return true;
  });

  const resolvedScope = resolveAttendanceHierarchyScope({ scopeType, scopeIds });

  for (const priority of ATTENDANCE_SCOPE_PRIORITY) {
    const matchingPolicy = activePolicies.find(
      (policy) =>
        policy.scopeType === priority &&
        scopeMatchesTarget(policy.scopeType, policy.scopeIds, resolvedScope)
    );

    if (matchingPolicy) return matchingPolicy;
  }

  return null;
}

function getEnrollmentScopeMaps() {
  const gradesById = new Map<string, { stageId: string }>();
  const sectionsById = new Map<string, { gradeId: string }>();
  const classroomsById = new Map<string, { sectionId: string }>();

  const seenContexts = new Set<string>();
  for (const enrollment of mockStudentEnrollments) {
    const context = resolveStructureContextForAcademicYear(enrollment.academicYear);
    if (!context) continue;

    const key = `${context.academicYearId}-${context.termId}`;
    if (seenContexts.has(key)) continue;
    seenContexts.add(key);

    const structure = getStructureTreeSnapshot(context.academicYearId, context.termId);
    structure.grades.forEach((grade) => gradesById.set(grade.id, { stageId: grade.stageId }));
    structure.sections.forEach((section) => sectionsById.set(section.id, { gradeId: section.gradeId }));
    structure.classrooms.forEach((classroom) =>
      classroomsById.set(classroom.id, { sectionId: classroom.sectionId })
    );
  }

  return { gradesById, sectionsById, classroomsById };
}

/**
 * Fetch roster (students) for a scope
 */
export async function fetchRoster(
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM",
  scopeIds: AttendanceScopeIds
): Promise<RosterStudent[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (!isScopeSelectionComplete(scopeType, scopeIds)) {
    return [];
  }

  const { gradesById, sectionsById, classroomsById } = getEnrollmentScopeMaps();
  const targetScope = resolveAttendanceHierarchyScope({
    scopeType,
    scopeIds,
    gradesById,
    sectionsById,
    classroomsById,
  });

  const matchedStudentIds = new Set(
    mockStudentEnrollments
      .filter((enrollment) => enrollment.status !== "withdrawn")
      .filter((enrollment) => {
        const enrollmentScope = resolveAttendanceHierarchyScope({
          scopeType: enrollment.classroomId
            ? "CLASSROOM"
            : enrollment.sectionId
              ? "SECTION"
              : enrollment.gradeId
                ? "GRADE"
                : "SCHOOL",
          scopeIds: {
            stageId: undefined,
            gradeId: enrollment.gradeId,
            sectionId: enrollment.sectionId,
            classroomId: enrollment.classroomId,
          },
          gradesById,
          sectionsById,
          classroomsById,
        });

        if (scopeType === "SCHOOL") return true;
        if (scopeType === "STAGE") return enrollmentScope.stageId === targetScope.stageId;
        if (scopeType === "GRADE") return enrollmentScope.gradeId === targetScope.gradeId;
        if (scopeType === "SECTION") return enrollmentScope.sectionId === targetScope.sectionId;
        return enrollmentScope.classroomId === targetScope.classroomId;
      })
      .map((enrollment) => enrollment.studentId)
  );

  return mockStudents
    .filter((student) => matchedStudentIds.has(student.id))
    .map((student) => ({
      id: student.id,
      nameAr: student.full_name_ar,
      nameEn: student.full_name_en,
      studentNumber: student.student_id || student.id,
      photoUrl: undefined,
    }))
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

/**
 * Get or create session
 */
export async function getOrCreateSession(params: {
  yearId: string;
  termId: string;
  date: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: AttendanceScopeIds;
  mode: AttendanceSessionMode;
  periodId?: string; // Canonical stable ID from TimetablePeriod.id
  periodIndex?: number; // Display/order only (derived from timetable)
  periodNameAr?: string;
  periodNameEn?: string;
}): Promise<SessionWithEntries> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const storeKey = `${params.yearId}-${params.termId}`;
  if (!sessionStore[storeKey]) {
    sessionStore[storeKey] = [];
  }
  if (!entryStore[storeKey]) {
    entryStore[storeKey] = [];
  }

  // Find existing session
  const existing = sessionStore[storeKey].find((s) => {
    if (s.date !== params.date) return false;
    if (s.scopeType !== params.scopeType) return false;
    if (s.mode !== params.mode) return false;
    
    // For PERIOD mode, match by periodId first (canonical), fallback to periodIndex for backward compatibility
    if (params.mode === "PERIOD") {
      // If both have periodId, match by periodId
      if (params.periodId && s.periodId) {
        if (s.periodId !== params.periodId) return false;
      } else if (params.periodId && !s.periodId) {
        // Session lacks periodId but we have it - check periodIndex for backward compat
        if (s.periodIndex !== params.periodIndex) return false;
      } else if (!params.periodId && s.periodId) {
        // We lack periodId but session has it - no match
        return false;
      } else {
        // Neither has periodId - fallback to periodIndex
        if (s.periodIndex !== params.periodIndex) return false;
      }
    }

    // Check scope IDs match
    return matchesDirectAttendanceScope(params.scopeType, s.scopeIds, params.scopeIds);
  });

  if (existing) {
    // Migration: patch periodId on existing session if it lacks one
    if (params.periodId && !existing.periodId && params.mode === "PERIOD") {
      existing.periodId = params.periodId;
      existing.updatedAt = new Date().toISOString();
    }
    
    const entries = entryStore[storeKey].filter((e) => e.sessionId === existing.id);
    return { session: existing, entries };
  }

  // Create new session
  const newSession: AttendanceSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    yearId: params.yearId,
    termId: params.termId,
    date: params.date,
    scopeType: params.scopeType,
    scopeIds: params.scopeIds,
    mode: params.mode,
    periodId: params.periodId, // Store canonical periodId
    periodIndex: params.periodIndex,
    periodNameAr: params.periodNameAr,
    periodNameEn: params.periodNameEn,
    status: "DRAFT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  sessionStore[storeKey].push(newSession);

  return { session: newSession, entries: [] };
}

/**
 * Save session entries
 */
export async function saveSession(
  session: AttendanceSession,
  entries: AttendanceEntry[]
): Promise<SessionWithEntries> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const storeKey = `${session.yearId}-${session.termId}`;
  if (!sessionStore[storeKey]) {
    sessionStore[storeKey] = [];
  }
  if (!entryStore[storeKey]) {
    entryStore[storeKey] = [];
  }

  // Update session
  const sessionIndex = sessionStore[storeKey].findIndex((s) => s.id === session.id);
  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  if (sessionIndex >= 0) {
    sessionStore[storeKey][sessionIndex] = updatedSession;
  } else {
    sessionStore[storeKey].push(updatedSession);
  }

  // Update entries
  entryStore[storeKey] = entryStore[storeKey].filter((e) => e.sessionId !== session.id);
  entryStore[storeKey].push(...entries);

  return { session: updatedSession, entries };
}

/**
 * Submit session (lock for editing)
 */
export async function submitSession(sessionId: string, yearId: string, termId: string): Promise<AttendanceSession> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const storeKey = `${yearId}-${termId}`;
  const sessionIndex = sessionStore[storeKey]?.findIndex((s) => s.id === sessionId);

  if (sessionIndex === undefined || sessionIndex < 0) {
    throw new Error("Session not found");
  }

  const updatedSession = {
    ...sessionStore[storeKey][sessionIndex],
    status: "SUBMITTED" as AttendanceSessionStatus,
    updatedAt: new Date().toISOString(),
  };

  sessionStore[storeKey][sessionIndex] = updatedSession;

  return updatedSession;
}

/**
 * Unsubmit session (reopen for editing)
 */
export async function unsubmitSession(yearId: string, termId: string, sessionId: string): Promise<AttendanceSession> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const storeKey = `${yearId}-${termId}`;
  const sessionIndex = sessionStore[storeKey]?.findIndex((s) => s.id === sessionId);

  if (sessionIndex === undefined || sessionIndex < 0) {
    throw new Error("Session not found");
  }

  const session = sessionStore[storeKey][sessionIndex];
  
  // If already DRAFT, return as-is
  if (session.status === "DRAFT") {
    return session;
  }

  const updatedSession = {
    ...session,
    status: "DRAFT" as AttendanceSessionStatus,
    updatedAt: new Date().toISOString(),
  };

  sessionStore[storeKey][sessionIndex] = updatedSession;

  return updatedSession;
}

/**
 * Fetch sessions for a date range
 */
export async function fetchSessions(
  yearId: string,
  termId: string,
  startDate?: string,
  endDate?: string,
  scopeFilter?: {
    scopeType: AttendanceSession["scopeType"];
    scopeIds?: AttendanceScopeIds;
  }
): Promise<AttendanceSession[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  await ensureSeededAttendanceData(yearId, termId);

  const storeKey = `${yearId}-${termId}`;
  let sessions = sessionStore[storeKey] || [];

  if (startDate) {
    sessions = sessions.filter((s) => s.date >= startDate);
  }
  if (endDate) {
    sessions = sessions.filter((s) => s.date <= endDate);
  }

  if (scopeFilter) {
    sessions = sessions.filter((session) => {
      if (session.scopeType !== scopeFilter.scopeType) return false;
      return matchesDirectAttendanceScope(scopeFilter.scopeType, session.scopeIds, scopeFilter.scopeIds);
    });
  }

  return sessions;
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string, yearId: string, termId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const storeKey = `${yearId}-${termId}`;
  
  if (sessionStore[storeKey]) {
    sessionStore[storeKey] = sessionStore[storeKey].filter((s) => s.id !== sessionId);
  }
  
  if (entryStore[storeKey]) {
    entryStore[storeKey] = entryStore[storeKey].filter((e) => e.sessionId !== sessionId);
  }
}

/**
 * Fetch entries by session ID (for Absences tab)
 */
export async function fetchEntriesBySessionId(
  yearId: string,
  termId: string,
  sessionId: string
): Promise<AttendanceEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const storeKey = `${yearId}-${termId}`;
  return entryStore[storeKey]?.filter((e) => e.sessionId === sessionId) || [];
}

/**
 * Fetch entries for multiple sessions (for Absences tab)
 */
export async function fetchEntriesForSessions(
  yearId: string,
  termId: string,
  sessionIds: string[]
): Promise<AttendanceEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const storeKey = `${yearId}-${termId}`;
  return entryStore[storeKey]?.filter((e) => sessionIds.includes(e.sessionId)) || [];
}

/**
 * Upsert entry (create or update) - for Absences tab corrections
 */
export async function upsertEntry(
  yearId: string,
  termId: string,
  sessionId: string,
  studentId: string,
  patch: Partial<AttendanceEntry>
): Promise<AttendanceEntry> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const storeKey = `${yearId}-${termId}`;
  if (!entryStore[storeKey]) {
    entryStore[storeKey] = [];
  }

  const existingIndex = entryStore[storeKey].findIndex(
    (e) => e.sessionId === sessionId && e.studentId === studentId
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    // Update existing
    const updated = {
      ...entryStore[storeKey][existingIndex],
      ...patch,
      updatedAt: now,
    };
    entryStore[storeKey][existingIndex] = updated;

    // Update session timestamp
    if (sessionStore[storeKey]) {
      const sessionIndex = sessionStore[storeKey].findIndex((s) => s.id === sessionId);
      if (sessionIndex >= 0) {
        sessionStore[storeKey][sessionIndex].updatedAt = now;
      }
    }

    return updated;
  } else {
    // Create new
    const newEntry: AttendanceEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      studentId,
      status: "PRESENT",
      ...patch,
      updatedAt: now,
    };
    entryStore[storeKey].push(newEntry);

    // Update session timestamp
    if (sessionStore[storeKey]) {
      const sessionIndex = sessionStore[storeKey].findIndex((s) => s.id === sessionId);
      if (sessionIndex >= 0) {
        sessionStore[storeKey][sessionIndex].updatedAt = now;
      }
    }

    return newEntry;
  }
}
