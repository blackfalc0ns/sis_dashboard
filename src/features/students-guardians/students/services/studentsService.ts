// FILE: src/services/studentsService.ts
// Students service - handles all student-related business logic

import type {
  Student,
  StudentGuardian,
  StudentDocument,
  StudentMedicalProfile,
  StudentNote,
  CreateStudentNotePayload,
  StudentXpEvent,
  StudentXpSummary,
  StudentTimelineEvent,
  StudentStatus,
  RiskFlag,
  StudentEnrollment,
  EnrollmentTerm,
  UpdateStudentPayload,
} from "@/features/students-guardians/students/types";
import {
  mockStudents,
  mockStudentGuardians,
  mockStudentGuardianLinks,
  mockStudentDocuments,
  mockStudentMedicalProfiles,
  mockStudentNotes,
  mockStudentTimelineEvents,
  mockStudentEnrollments,
  getEnrollmentByStudentId,
  getEnrollmentByStudentIdAndAcademicYear,
  getEnrollmentsByStudentId,
  getEnrollmentsByClassroomId,
  getCurrentTerm,
  getTermsByEnrollmentId,
  getYearToDateAverages,
  getClassTeacher,
  getSubjectTeacher,
} from "@/data/mockStudents";
import { getOrGenerateGuardianEmail } from "./emailService";
import {
  composeNameParts,
  splitFullName,
} from "@/features/students-guardians/students/utils/studentUtils";
import type { StudentsAdapter } from "./studentsAdapter";
import {
  createStudentsApiAdapter,
  studentsApiAdapter,
} from "./studentsApiAdapter";

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const withResolvedStudentEmail = (student: Student): Student => student;

let currentStudentsAdapter: StudentsAdapter | null = null;

// ============================================================================
// STUDENT OPERATIONS
// ============================================================================

/**
 * Get all students
 */
const getAllStudentsImpl = (): Student[] => {
  return mockStudents.map(withResolvedStudentEmail);
};

/**
 * Get student by ID
 */
const getStudentByIdImpl = (id: string): Student | undefined => {
  const student = mockStudents.find((s) => s.id === id);
  if (!student) return undefined;
  return withResolvedStudentEmail(student);
};

const updateStudentImpl = async (
  studentId: string,
  payload: UpdateStudentPayload,
): Promise<Student> => {
  await delay();

  const index = mockStudents.findIndex((student) => student.id === studentId);
  if (index === -1) {
    throw new Error("student_not_found");
  }

  const existingStudent = mockStudents[index];
  const fallbackEnglishParts = splitFullName(existingStudent.full_name_en);
  const fallbackArabicParts = splitFullName(existingStudent.full_name_ar);
  const existingEnglishParts = {
    ...fallbackEnglishParts,
    firstName: existingStudent.first_name_en || fallbackEnglishParts.firstName,
    fatherName:
      existingStudent.father_name_en || fallbackEnglishParts.fatherName,
    grandfatherName:
      existingStudent.grandfather_name_en ||
      fallbackEnglishParts.grandfatherName,
    familyName:
      existingStudent.family_name_en || fallbackEnglishParts.familyName,
  };
  const existingArabicParts = {
    ...fallbackArabicParts,
    firstName: existingStudent.first_name_ar || fallbackArabicParts.firstName,
    fatherName:
      existingStudent.father_name_ar || fallbackArabicParts.fatherName,
    grandfatherName:
      existingStudent.grandfather_name_ar ||
      fallbackArabicParts.grandfatherName,
    familyName:
      existingStudent.family_name_ar || fallbackArabicParts.familyName,
  };
  const resolvedFirstNameEn =
    payload.first_name_en ?? existingEnglishParts.firstName;
  const resolvedFatherNameEn =
    payload.father_name_en ?? existingEnglishParts.fatherName;
  const resolvedGrandfatherNameEn =
    payload.grandfather_name_en ?? existingEnglishParts.grandfatherName;
  const resolvedFamilyNameEn =
    payload.family_name_en ?? existingEnglishParts.familyName;
  const resolvedFirstNameAr =
    payload.first_name_ar ?? existingArabicParts.firstName;
  const resolvedFatherNameAr =
    payload.father_name_ar ?? existingArabicParts.fatherName;
  const resolvedGrandfatherNameAr =
    payload.grandfather_name_ar ?? existingArabicParts.grandfatherName;
  const resolvedFamilyNameAr =
    payload.family_name_ar ?? existingArabicParts.familyName;
  const resolvedFullNameEn =
    payload.full_name_en ??
    (composeNameParts(
      resolvedFirstNameEn,
      resolvedFatherNameEn,
      resolvedGrandfatherNameEn,
      resolvedFamilyNameEn,
    ) ||
      payload.name ||
      existingStudent.full_name_en);
  const resolvedFullNameAr =
    payload.full_name_ar ??
    (composeNameParts(
      resolvedFirstNameAr,
      resolvedFatherNameAr,
      resolvedGrandfatherNameAr,
      resolvedFamilyNameAr,
    ) ||
      existingStudent.full_name_ar);
  const resolvedDateOfBirth =
    payload.dateOfBirth ?? payload.date_of_birth ?? existingStudent.dateOfBirth;

  const updatedStudent: Student = {
    ...existingStudent,
    ...payload,
    name: payload.name ?? resolvedFullNameEn,
    first_name_en: resolvedFirstNameEn,
    father_name_en: resolvedFatherNameEn,
    grandfather_name_en: resolvedGrandfatherNameEn,
    family_name_en: resolvedFamilyNameEn,
    first_name_ar: resolvedFirstNameAr,
    father_name_ar: resolvedFatherNameAr,
    grandfather_name_ar: resolvedGrandfatherNameAr,
    family_name_ar: resolvedFamilyNameAr,
    full_name_en: resolvedFullNameEn,
    full_name_ar: resolvedFullNameAr,
    dateOfBirth: resolvedDateOfBirth,
    date_of_birth: resolvedDateOfBirth,
    gender: payload.gender ?? existingStudent.gender,
    nationality: payload.nationality ?? existingStudent.nationality,
    status: payload.status ?? existingStudent.status,
    contact: {
      ...existingStudent.contact,
      ...payload.contact,
    },
    updated_at: new Date().toISOString(),
  };

  mockStudents[index] = updatedStudent;
  return withResolvedStudentEmail(updatedStudent);
};

/**
 * Get students by status
 */
const getStudentsByStatusImpl = (status: StudentStatus): Student[] => {
  return mockStudents.filter((s) => s.status === status);
};

/**
 * Get students by grade
 */
const getStudentsByGradeImpl = (grade: string): Student[] => {
  return mockStudents.filter(
    (s) => s.gradeRequested === grade || s.grade === grade,
  );
};

/**
 * Get students with risk flags
 */
const getAtRiskStudentsImpl = (): Student[] => {
  return mockStudents.filter((s) => s.risk_flags && s.risk_flags.length > 0);
};

/**
 * Search students by name or ID
 */
const searchStudentsImpl = (query: string): Student[] => {
  const lowerQuery = query.toLowerCase();
  return mockStudents.filter(
    (s) =>
      s.full_name_en.toLowerCase().includes(lowerQuery) ||
      s.full_name_ar.includes(query) ||
      (s.name && s.name.toLowerCase().includes(lowerQuery)) ||
      (s.student_id && s.student_id.toLowerCase().includes(lowerQuery)) ||
      s.id.toLowerCase().includes(lowerQuery),
  );
};

// ============================================================================
// GUARDIAN OPERATIONS
// ============================================================================

/**
 * Get all guardians for a student
 */
const getStudentGuardiansImpl = (studentId: string): StudentGuardian[] => {
  const links = mockStudentGuardianLinks.filter(
    (l) => l.studentId === studentId,
  );
  return links
    .map((link) =>
      mockStudentGuardians.find((g) => g.guardianId === link.guardianId),
    )
    .filter((g): g is StudentGuardian => g !== undefined)
    .map((guardian) => ({
      ...guardian,
      email: getOrGenerateGuardianEmail(guardian),
    }));
};

/**
 * Get primary guardian for a student
 */
const getPrimaryGuardianImpl = (
  studentId: string,
): StudentGuardian | undefined => {
  const primaryLink = mockStudentGuardianLinks.find(
    (l) => l.studentId === studentId && l.is_primary,
  );
  if (!primaryLink) return undefined;
  return mockStudentGuardians.find(
    (g) => g.guardianId === primaryLink.guardianId,
  );
};

/**
 * Get all students for a guardian
 */
const getGuardianStudentsImpl = (guardianId: string): Student[] => {
  const links = mockStudentGuardianLinks.filter(
    (l) => l.guardianId === guardianId,
  );
  return links
    .map((link) => mockStudents.find((s) => s.id === link.studentId))
    .filter((s): s is Student => s !== undefined);
};

/**
 * Get all guardians
 */
const getAllGuardiansImpl = (): StudentGuardian[] => {
  return mockStudentGuardians;
};

/**
 * Get guardian by ID
 */
const getGuardianByIdImpl = (
  guardianId: string,
): StudentGuardian | undefined => {
  return mockStudentGuardians.find((g) => g.guardianId === guardianId);
};

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

/**
 * Get all documents for a student
 */
const getStudentDocumentsImpl = (studentId: string): StudentDocument[] => {
  return mockStudentDocuments.filter((d) => d.studentId === studentId);
};

/**
 * Get missing documents for a student
 */
const getMissingDocumentsImpl = (studentId: string): StudentDocument[] => {
  return mockStudentDocuments.filter(
    (d) => d.studentId === studentId && d.status === "missing",
  );
};

// ============================================================================
// MEDICAL OPERATIONS
// ============================================================================

/**
 * Get medical profile for a student
 */
export function getStudentMedicalProfile(
  studentId: string,
): StudentMedicalProfile | undefined {
  return mockStudentMedicalProfiles.find((m) => m.studentId === studentId);
}

/**
 * Get students with medical conditions
 */
export function getStudentsWithMedicalConditions(): Student[] {
  const studentsWithConditions = mockStudentMedicalProfiles
    .filter((m) => m.notes || m.allergies)
    .map((m) => m.studentId);
  return mockStudents.filter((s) => studentsWithConditions.includes(s.id));
}

// ============================================================================
// NOTE OPERATIONS
// ============================================================================

const normalizeStudentNote = (
  note: StudentNote | (StudentNote & { xpAdjustment?: number }),
): StudentNote => ({
  ...note,
  xpAdjustment:
    typeof note.xpAdjustment === "number" && Number.isInteger(note.xpAdjustment)
      ? note.xpAdjustment
      : 0,
});

const validateXpAdjustment = (xpAdjustment: number) => {
  if (!Number.isInteger(xpAdjustment)) {
    throw new Error("xp_must_be_integer");
  }
  if (xpAdjustment < -50 || xpAdjustment > 50) {
    throw new Error("xp_out_of_range");
  }
  if (xpAdjustment === 0) {
    throw new Error("xp_cannot_be_zero");
  }
};

/**
 * Get all notes for a student
 */
export function getStudentNotes(studentId: string): StudentNote[] {
  return mockStudentNotes
    .filter((n) => n.studentId === studentId)
    .map(normalizeStudentNote)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get notes by category
 */
export function getStudentNotesByCategory(
  studentId: string,
  category: StudentNote["category"],
): StudentNote[] {
  return getStudentNotes(studentId).filter((n) => n.category === category);
}

/**
 * Get notes by visibility
 */
export function getStudentNotesByVisibility(
  studentId: string,
  visibility: StudentNote["visibility"],
): StudentNote[] {
  return getStudentNotes(studentId).filter((n) => n.visibility === visibility);
}

export function addStudentNote(
  studentId: string,
  payload: CreateStudentNotePayload,
): StudentNote {
  validateXpAdjustment(payload.xpAdjustment);

  const newNote: StudentNote = {
    id: `NOTE-${studentId}-${Date.now()}`,
    studentId,
    date: new Date().toISOString(),
    category: payload.category,
    note: payload.note.trim(),
    xpAdjustment: payload.xpAdjustment,
    visibility: payload.visibility,
    created_by: payload.created_by.trim(),
  };

  mockStudentNotes.unshift(newNote);
  return normalizeStudentNote(newNote);
}

export function getStudentXpEvents(studentId: string): StudentXpEvent[] {
  return getStudentNotes(studentId)
    .filter((note) => note.xpAdjustment !== 0)
    .map((note) => ({
      id: note.id,
      studentId: note.studentId,
      date: note.date,
      category: note.category,
      points: note.xpAdjustment,
      note: note.note,
      visibility: note.visibility,
      created_by: note.created_by,
    }));
}

export function getStudentXpSummary(studentId: string): StudentXpSummary {
  const events = getStudentXpEvents(studentId);
  const last7DaysThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentEvents = events.filter(
    (event) => new Date(event.date).getTime() >= last7DaysThreshold,
  );

  return {
    totalXp: events.reduce((sum, event) => sum + event.points, 0),
    recentXp: recentEvents.reduce((sum, event) => sum + event.points, 0),
    weeklyXpDelta: recentEvents.reduce((sum, event) => sum + event.points, 0),
    positiveNotesCount: events.filter((event) => event.points > 0).length,
    negativeNotesCount: events.filter((event) => event.points < 0).length,
    totalNotesCount: getStudentNotes(studentId).length,
    positivePointsTotal: events
      .filter((event) => event.points > 0)
      .reduce((sum, event) => sum + event.points, 0),
    negativePointsTotal: Math.abs(
      events
        .filter((event) => event.points < 0)
        .reduce((sum, event) => sum + event.points, 0),
    ),
  };
}

// ============================================================================
// TIMELINE OPERATIONS
// ============================================================================

/**
 * Get timeline events for a student
 */
export function getStudentTimeline(studentId: string): StudentTimelineEvent[] {
  return mockStudentTimelineEvents
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get student statistics
 */
export function getStudentStatistics() {
  const total = mockStudents.length;
  const active = mockStudents.filter((s) => s.status === "Active").length;
  const suspended = mockStudents.filter((s) => s.status === "Suspended").length;
  const withdrawn = mockStudents.filter((s) => s.status === "Withdrawn").length;

  // Calculate at-risk students using enrollment term data
  const atRisk = mockStudentEnrollments.filter((enrollment) => {
    const ytd = getYearToDateAverages(enrollment.enrollmentId);
    return ytd.riskFlags.length > 0;
  }).length;

  // Calculate average attendance using enrollment term data
  const enrollmentsWithData = mockStudentEnrollments.map((enrollment) => {
    return getYearToDateAverages(enrollment.enrollmentId);
  });

  const avgAttendance =
    enrollmentsWithData.length > 0
      ? Math.round(
          enrollmentsWithData.reduce((sum, ytd) => sum + ytd.attendance, 0) /
            enrollmentsWithData.length,
        )
      : 0;

  // Calculate average grade using enrollment term data
  const avgGrade =
    enrollmentsWithData.length > 0
      ? Math.round(
          enrollmentsWithData.reduce((sum, ytd) => sum + ytd.gradeAverage, 0) /
            enrollmentsWithData.length,
        )
      : 0;

  return {
    total,
    active,
    suspended,
    withdrawn,
    atRisk,
    avgAttendance,
    avgGrade,
  };
}

/**
 * Get grade distribution
 */
export function getGradeDistribution(): Record<string, number> {
  // Use enrollment data for accurate grade distribution
  return mockStudentEnrollments.reduce(
    (acc, enrollment) => {
      if (enrollment.status !== "active") {
        return acc;
      }
      const grade = enrollment.grade;
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

/**
 * Get section distribution for a grade
 */
export function getSectionDistribution(grade: string): Record<string, number> {
  // Use enrollment data for accurate section distribution
  return mockStudentEnrollments
    .filter((e) => e.grade === grade && e.status === "active")
    .reduce(
      (acc, enrollment) => {
        const section = enrollment.section;
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
}

/**
 * Get classroom distribution for a grade + section
 */
export function getClassroomDistribution(
  grade: string,
  section: string,
): Record<string, number> {
  return mockStudentEnrollments
    .filter(
      (enrollment) =>
        enrollment.grade === grade &&
        enrollment.section === section &&
        enrollment.status === "active",
    )
    .reduce(
      (acc, enrollment) => {
        const classroom = enrollment.classroom || "Unassigned";
        acc[classroom] = (acc[classroom] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
}

export function getStudentsByClassroomId(classroomId: string): Student[] {
  const classroomEnrollments = getEnrollmentsByClassroomId(classroomId);
  const enrolledStudentIds = new Set(
    classroomEnrollments.map((enrollment) => enrollment.studentId),
  );

  return getAllStudents().filter((student) =>
    enrolledStudentIds.has(student.id),
  );
}

/**
 * Get risk flag distribution
 */
export function getRiskFlagDistribution(): Record<RiskFlag, number> {
  const distribution: Record<RiskFlag, number> = {
    attendance: 0,
    grades: 0,
    behavior: 0,
  };

  // Use enrollment term data for accurate risk flags
  mockStudentEnrollments.forEach((enrollment) => {
    const ytd = getYearToDateAverages(enrollment.enrollmentId);
    ytd.riskFlags.forEach((flag) => {
      if (flag in distribution) {
        distribution[flag as RiskFlag]++;
      }
    });
  });

  return distribution;
}

// ============================================================================
// ERP DATA OPERATIONS (NEW)
// ============================================================================

/**
 * Get enrollment for a student
 */
export function getStudentEnrollment(
  studentId: string,
): StudentEnrollment | undefined {
  return getEnrollmentByStudentId(studentId);
}

export function getStudentEnrollmentByAcademicYear(
  studentId: string,
  academicYear: string,
): StudentEnrollment | undefined {
  return getEnrollmentsByStudentId(studentId).find(
    (enrollment) => enrollment.academicYear === academicYear,
  );
}

/**
 * Get current term for a student
 */
export function getStudentCurrentTerm(
  studentId: string,
): EnrollmentTerm | undefined {
  const enrollment = getEnrollmentByStudentId(studentId);
  if (!enrollment) return undefined;
  return getCurrentTerm(enrollment.enrollmentId);
}

/**
 * Get year-to-date performance for a student
 */
export function getStudentYTDPerformance(studentId: string): {
  attendance: number;
  gradeAverage: number;
  riskFlags: RiskFlag[];
} | null {
  const enrollment = getEnrollmentByStudentId(studentId);
  if (!enrollment) return null;
  return getYearToDateAverages(enrollment.enrollmentId);
}

export function getStudentYTDPerformanceByAcademicYear(
  studentId: string,
  academicYear: string,
): {
  attendance: number;
  gradeAverage: number;
  riskFlags: RiskFlag[];
} | null {
  const enrollment = getStudentEnrollmentByAcademicYear(
    studentId,
    academicYear,
  );
  if (!enrollment) return null;
  return getYearToDateAverages(enrollment.enrollmentId);
}

export function getStudentTerms(studentId: string): EnrollmentTerm[] {
  const enrollment = getEnrollmentByStudentId(studentId);
  if (!enrollment) return [];
  return getTermsByEnrollmentId(enrollment.enrollmentId);
}

export function getStudentTermsByAcademicYear(
  studentId: string,
  academicYear: string,
): EnrollmentTerm[] {
  const enrollment = getStudentEnrollmentByAcademicYear(
    studentId,
    academicYear,
  );
  if (!enrollment) return [];
  return getTermsByEnrollmentId(enrollment.enrollmentId);
}

export function getStudentTermByName(
  studentId: string,
  termName: EnrollmentTerm["term"],
): EnrollmentTerm | undefined {
  return getStudentTerms(studentId).find((term) => term.term === termName);
}

export function getStudentTermByNameForAcademicYear(
  studentId: string,
  academicYear: string,
  termName: EnrollmentTerm["term"],
): EnrollmentTerm | undefined {
  return getStudentTermsByAcademicYear(studentId, academicYear).find(
    (term) => term.term === termName,
  );
}

export function getStudentClassTeacher(
  studentId: string,
  academicYear?: string,
) {
  const enrollment = academicYear
    ? getStudentEnrollmentByAcademicYear(studentId, academicYear)
    : getStudentEnrollment(studentId);

  if (!enrollment) return undefined;

  return getClassTeacher(
    enrollment.grade,
    enrollment.section,
    enrollment.academicYear,
  );
}

export function getStudentSubjectTeacher(
  studentId: string,
  subject: string,
  academicYear?: string,
) {
  const enrollment = academicYear
    ? getStudentEnrollmentByAcademicYear(studentId, academicYear)
    : getStudentEnrollment(studentId);

  if (!enrollment) return undefined;

  return getSubjectTeacher(
    enrollment.grade,
    enrollment.section,
    subject,
    enrollment.academicYear,
  );
}

export type StudentWithEnrollmentContext = Student & {
  enrollment?: StudentEnrollment;
  currentTerm?: EnrollmentTerm;
  selectedTerm?: EnrollmentTerm;
  ytdPerformance?: ReturnType<typeof getYearToDateAverages>;
  contextPerformance?: {
    attendance: number;
    gradeAverage: number;
    riskFlags: RiskFlag[];
  };
};

const mapTermToPerformance = (
  term: EnrollmentTerm | undefined,
): StudentWithEnrollmentContext["contextPerformance"] =>
  term
    ? {
        attendance: term.attendancePercentage,
        gradeAverage: term.gradeAverage,
        riskFlags: [...term.riskFlags],
      }
    : undefined;

/**
 * Get students with current enrollment data (for display)
 */
const getStudentsWithEnrollmentImpl = (): StudentWithEnrollmentContext[] =>
  getStudentsWithEnrollmentForContextImpl();

const getStudentsWithEnrollmentForContextImpl = (
  academicYearId?: string | null,
  termId?: string | null,
): StudentWithEnrollmentContext[] => {
  return mockStudents
    .map((student) => {
      const enrollment = academicYearId
        ? getEnrollmentByStudentIdAndAcademicYear(student.id, academicYearId)
        : getEnrollmentByStudentId(student.id);
      const enrollmentTerms = enrollment
        ? getTermsByEnrollmentId(enrollment.enrollmentId)
        : [];
      const currentTerm = enrollment
        ? getCurrentTerm(enrollment.enrollmentId)
        : undefined;
      const selectedTerm =
        enrollmentTerms.find(
          (enrollmentTerm) => enrollmentTerm.termRecordId === termId,
        ) || undefined;
      const ytdPerformance = enrollment
        ? getYearToDateAverages(enrollment.enrollmentId)
        : undefined;
      const contextPerformance =
        mapTermToPerformance(selectedTerm || currentTerm) || ytdPerformance;

      return {
        ...withResolvedStudentEmail(student),
        enrollment,
        currentTerm,
        selectedTerm,
        ytdPerformance,
        contextPerformance,
      };
    })
    .filter((student) => {
      const matchesAcademicYear =
        !academicYearId ||
        student.enrollment?.academicYearId === academicYearId;
      const matchesTerm =
        !termId || student.selectedTerm?.termRecordId === termId;

      return matchesAcademicYear && matchesTerm;
    });
};

const mockStudentsAdapter: StudentsAdapter = {
  getAllStudents: getAllStudentsImpl,
  getStudentById: getStudentByIdImpl,
  updateStudent: updateStudentImpl,
  getStudentsByStatus: getStudentsByStatusImpl,
  getStudentsByGrade: getStudentsByGradeImpl,
  getAtRiskStudents: getAtRiskStudentsImpl,
  searchStudents: searchStudentsImpl,
  getStudentGuardians: getStudentGuardiansImpl,
  getPrimaryGuardian: getPrimaryGuardianImpl,
  getGuardianStudents: getGuardianStudentsImpl,
  getAllGuardians: getAllGuardiansImpl,
  getGuardianById: getGuardianByIdImpl,
  getStudentDocuments: getStudentDocumentsImpl,
  getMissingDocuments: getMissingDocumentsImpl,
  getStudentsWithEnrollment: getStudentsWithEnrollmentImpl,
  getStudentsWithEnrollmentForContext: getStudentsWithEnrollmentForContextImpl,
  fetchAllGuardians: async () => Promise.resolve(getAllGuardiansImpl()),
  fetchAllStudents: async () => Promise.resolve(getAllStudentsImpl()),
  fetchStudentById: async (id) => Promise.resolve(getStudentByIdImpl(id)),
  fetchStudentGuardians: async (studentId) =>
    Promise.resolve(getStudentGuardiansImpl(studentId)),
  fetchPrimaryGuardian: async (studentId) =>
    Promise.resolve(getPrimaryGuardianImpl(studentId)),
  fetchGuardianStudents: async (guardianId) =>
    Promise.resolve(getGuardianStudentsImpl(guardianId)),
  fetchGuardianById: async (guardianId) =>
    Promise.resolve(getGuardianByIdImpl(guardianId)),
  fetchStudentsWithEnrollment: async () =>
    Promise.resolve(getStudentsWithEnrollmentImpl()),
  fetchStudentsWithEnrollmentForContext: async (academicYearId, termId) =>
    Promise.resolve(
      getStudentsWithEnrollmentForContextImpl(academicYearId, termId),
    ),
};

currentStudentsAdapter = mockStudentsAdapter;

if (process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_STUDENTS_API === "true") {
  currentStudentsAdapter = studentsApiAdapter;
}

export function getStudentsAdapter(): StudentsAdapter {
  return currentStudentsAdapter || mockStudentsAdapter;
}

export function setStudentsAdapter(adapter: StudentsAdapter) {
  currentStudentsAdapter = adapter;
}

export function resetStudentsAdapter() {
  currentStudentsAdapter =
    process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_STUDENTS_API === "true"
      ? createStudentsApiAdapter()
      : mockStudentsAdapter;
}

export function activateStudentsAdapter(adapter: StudentsAdapter) {
  setStudentsAdapter(adapter);
  return adapter;
}

export function getAllStudents(): Student[] {
  return getStudentsAdapter().getAllStudents();
}

export async function fetchAllStudents(): Promise<Student[]> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchAllStudents) {
    return adapter.fetchAllStudents();
  }

  return Promise.resolve(adapter.getAllStudents());
}

export function getStudentById(id: string): Student | undefined {
  return getStudentsAdapter().getStudentById(id);
}

export async function fetchStudentById(
  id: string,
): Promise<Student | undefined> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchStudentById) {
    return adapter.fetchStudentById(id);
  }

  return Promise.resolve(adapter.getStudentById(id));
}

export async function fetchStudentGuardians(
  studentId: string,
): Promise<StudentGuardian[]> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchStudentGuardians) {
    return adapter.fetchStudentGuardians(studentId);
  }

  return Promise.resolve(adapter.getStudentGuardians(studentId));
}

export async function fetchPrimaryGuardian(
  studentId: string,
): Promise<StudentGuardian | undefined> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchPrimaryGuardian) {
    return adapter.fetchPrimaryGuardian(studentId);
  }

  return Promise.resolve(adapter.getPrimaryGuardian(studentId));
}

export async function fetchGuardianStudents(
  guardianId: string,
): Promise<Student[]> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchGuardianStudents) {
    return adapter.fetchGuardianStudents(guardianId);
  }

  return Promise.resolve(adapter.getGuardianStudents(guardianId));
}

export async function updateStudent(
  studentId: string,
  payload: UpdateStudentPayload,
): Promise<Student> {
  return getStudentsAdapter().updateStudent(studentId, payload);
}

export function getStudentsByStatus(status: StudentStatus): Student[] {
  return getStudentsAdapter().getStudentsByStatus(status);
}

export function getStudentsByGrade(grade: string): Student[] {
  return getStudentsAdapter().getStudentsByGrade(grade);
}

export function getAtRiskStudents(): Student[] {
  return getStudentsAdapter().getAtRiskStudents();
}

export function searchStudents(query: string): Student[] {
  return getStudentsAdapter().searchStudents(query);
}

export function getStudentGuardians(studentId: string): StudentGuardian[] {
  return getStudentsAdapter().getStudentGuardians(studentId);
}

export function getPrimaryGuardian(
  studentId: string,
): StudentGuardian | undefined {
  return getStudentsAdapter().getPrimaryGuardian(studentId);
}

export function getGuardianStudents(guardianId: string): Student[] {
  return getStudentsAdapter().getGuardianStudents(guardianId);
}

export function getAllGuardians(): StudentGuardian[] {
  return getStudentsAdapter().getAllGuardians();
}

export async function fetchAllGuardians(): Promise<StudentGuardian[]> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchAllGuardians) {
    return adapter.fetchAllGuardians();
  }

  return Promise.resolve(adapter.getAllGuardians());
}

export function getGuardianById(
  guardianId: string,
): StudentGuardian | undefined {
  return getStudentsAdapter().getGuardianById(guardianId);
}

export async function fetchGuardianById(
  guardianId: string,
): Promise<StudentGuardian | undefined> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchGuardianById) {
    return adapter.fetchGuardianById(guardianId);
  }

  return Promise.resolve(adapter.getGuardianById(guardianId));
}

export function getStudentDocuments(studentId: string): StudentDocument[] {
  return getStudentsAdapter().getStudentDocuments(studentId);
}

export function getMissingDocuments(studentId: string): StudentDocument[] {
  return getStudentsAdapter().getMissingDocuments(studentId);
}

export function getStudentsWithEnrollment(): StudentWithEnrollmentContext[] {
  return getStudentsAdapter().getStudentsWithEnrollment();
}

export async function fetchStudentsWithEnrollment(): Promise<
  StudentWithEnrollmentContext[]
> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchStudentsWithEnrollment) {
    return adapter.fetchStudentsWithEnrollment();
  }

  return Promise.resolve(adapter.getStudentsWithEnrollment());
}

export function getStudentsWithEnrollmentForContext(
  academicYearId?: string | null,
  termId?: string | null,
): StudentWithEnrollmentContext[] {
  return getStudentsAdapter().getStudentsWithEnrollmentForContext(
    academicYearId,
    termId,
  );
}

export async function fetchStudentsWithEnrollmentForContext(
  academicYearId?: string | null,
  termId?: string | null,
): Promise<StudentWithEnrollmentContext[]> {
  const adapter = getStudentsAdapter();
  if (adapter.fetchStudentsWithEnrollmentForContext) {
    return adapter.fetchStudentsWithEnrollmentForContext(
      academicYearId,
      termId,
    );
  }

  return Promise.resolve(
    adapter.getStudentsWithEnrollmentForContext(academicYearId, termId),
  );
}

/**
 * Get students with complete enrollment history
 */
export function getStudentsWithEnrollmentHistory(): Array<
  Student & {
    enrollmentHistory: StudentEnrollment[];
    currentEnrollment?: StudentEnrollment;
  }
> {
  return mockStudents.map((student) => {
    const enrollmentHistory = getEnrollmentsByStudentId(student.id);

    const currentEnrollment = getEnrollmentByStudentId(student.id);

    return {
      ...student,
      enrollmentHistory,
      currentEnrollment,
    };
  });
}
