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
import { mockStudents } from "@/data/mockStudents";

// Term-scoped mock store
const sessionStore: Record<string, AttendanceSession[]> = {};
const entryStore: Record<string, AttendanceEntry[]> = {};

/**
 * Fetch effective policy for a scope and date
 * Priority: SECTION > GRADE > STAGE > SCHOOL
 */
export async function fetchEffectivePolicy(
  yearId: string,
  termId: string,
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION",
  scopeIds: { stageId?: string; gradeId?: string; sectionId?: string },
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

  // Priority order: SECTION > GRADE > STAGE > SCHOOL
  const priorityOrder = ["SECTION", "GRADE", "STAGE", "SCHOOL"];

  for (const priority of priorityOrder) {
    const matchingPolicy = activePolicies.find((p) => {
      if (p.scopeType !== priority) return false;

      if (priority === "SCHOOL") return true;
      if (priority === "STAGE") return p.scopeIds?.stageId === scopeIds.stageId;
      if (priority === "GRADE") return p.scopeIds?.gradeId === scopeIds.gradeId;
      if (priority === "SECTION") return p.scopeIds?.sectionId === scopeIds.sectionId;

      return false;
    });

    if (matchingPolicy) return matchingPolicy;
  }

  return null;
}

/**
 * Fetch roster (students) for a scope
 */
export async function fetchRoster(
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION",
  scopeIds: { stageId?: string; gradeId?: string; sectionId?: string } // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<RosterStudent[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  // For now, return all mock students (simplified for demo)
  // In production, this would call the actual students API with proper filtering
  // based on enrollment data (scopeType, scopeIds)
  
  // Return a reasonable subset for demo purposes
  const maxStudents = scopeType === "SECTION" ? 30 : scopeType === "GRADE" ? 50 : 100;
  const filteredStudents = mockStudents.slice(0, maxStudents);

  return filteredStudents.map((s) => ({
    id: s.id,
    nameAr: s.full_name_ar,
    nameEn: s.full_name_en,
    studentNumber: s.student_id || s.id,
    photoUrl: undefined, // Mock students don't have photos
  }));
}

/**
 * Get or create session
 */
export async function getOrCreateSession(params: {
  yearId: string;
  termId: string;
  date: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION";
  scopeIds?: { stageId?: string; gradeId?: string; sectionId?: string };
  mode: AttendanceSessionMode;
  periodIndex?: number;
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
    if (params.mode === "PERIOD" && s.periodIndex !== params.periodIndex) return false;

    // Check scope IDs match
    if (params.scopeType === "SECTION") {
      return s.scopeIds?.sectionId === params.scopeIds?.sectionId;
    }
    if (params.scopeType === "GRADE") {
      return s.scopeIds?.gradeId === params.scopeIds?.gradeId;
    }
    if (params.scopeType === "STAGE") {
      return s.scopeIds?.stageId === params.scopeIds?.stageId;
    }

    return true; // SCHOOL
  });

  if (existing) {
    const entries = entryStore[storeKey].filter((e) => e.sessionId === existing.id);
    return { session: existing, entries };
  }

  // Create new session
  const newSession: AttendanceSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    yearId: params.yearId,
    termId: params.termId,
    date: params.date,
    scopeType: params.scopeType,
    scopeIds: params.scopeIds,
    mode: params.mode,
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
 * Fetch sessions for a date range
 */
export async function fetchSessions(
  yearId: string,
  termId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceSession[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const storeKey = `${yearId}-${termId}`;
  let sessions = sessionStore[storeKey] || [];

  if (startDate) {
    sessions = sessions.filter((s) => s.date >= startDate);
  }
  if (endDate) {
    sessions = sessions.filter((s) => s.date <= endDate);
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
