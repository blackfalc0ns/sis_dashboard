// FILE: src/services/studentsService.ts
// Students service - handles all student-related business logic

import type {
  Student,
  StudentGuardian,
  StudentGuardianLink,
  StudentDocument,
  StudentMedicalProfile,
  StudentNote,
  StudentTimelineEvent,
  StudentStatus,
  RiskFlag,
  StudentEnrollment,
  EnrollmentTerm,
} from "@/types/students";
import {
  mockStudents,
  mockStudentGuardians,
  mockStudentGuardianLinks,
  mockStudentDocuments,
  mockStudentMedicalProfiles,
  mockStudentNotes,
  mockStudentTimelineEvents,
  mockStudentEnrollments,
  mockEnrollmentTerms,
  getEnrollmentByStudentId,
  getCurrentTerm,
  getYearToDateAverages,
} from "@/data/mockStudents";

// ============================================================================
// STUDENT OPERATIONS
// ============================================================================

/**
 * Get all students
 */
export function getAllStudents(): Student[] {
  return mockStudents;
}

/**
 * Get student by ID
 */
export function getStudentById(id: string): Student | undefined {
  return mockStudents.find((s) => s.id === id);
}

/**
 * Get students by status
 */
export function getStudentsByStatus(status: StudentStatus): Student[] {
  return mockStudents.filter((s) => s.status === status);
}

/**
 * Get students by grade
 */
export function getStudentsByGrade(grade: string): Student[] {
  return mockStudents.filter(
    (s) => s.gradeRequested === grade || s.grade === grade,
  );
}

/**
 * Get students with risk flags
 */
export function getAtRiskStudents(): Student[] {
  return mockStudents.filter((s) => s.risk_flags && s.risk_flags.length > 0);
}

/**
 * Search students by name or ID
 */
export function searchStudents(query: string): Student[] {
  const lowerQuery = query.toLowerCase();
  return mockStudents.filter(
    (s) =>
      s.full_name_en.toLowerCase().includes(lowerQuery) ||
      s.full_name_ar.includes(query) ||
      (s.name && s.name.toLowerCase().includes(lowerQuery)) ||
      (s.student_id && s.student_id.toLowerCase().includes(lowerQuery)) ||
      s.id.toLowerCase().includes(lowerQuery),
  );
}

// ============================================================================
// GUARDIAN OPERATIONS
// ============================================================================

/**
 * Get all guardians for a student
 */
export function getStudentGuardians(studentId: string): StudentGuardian[] {
  const links = mockStudentGuardianLinks.filter(
    (l) => l.studentId === studentId,
  );
  return links
    .map((link) =>
      mockStudentGuardians.find((g) => g.guardianId === link.guardianId),
    )
    .filter((g): g is StudentGuardian => g !== undefined);
}

/**
 * Get primary guardian for a student
 */
export function getPrimaryGuardian(
  studentId: string,
): StudentGuardian | undefined {
  const primaryLink = mockStudentGuardianLinks.find(
    (l) => l.studentId === studentId && l.is_primary,
  );
  if (!primaryLink) return undefined;
  return mockStudentGuardians.find(
    (g) => g.guardianId === primaryLink.guardianId,
  );
}

/**
 * Get all students for a guardian
 */
export function getGuardianStudents(guardianId: string): Student[] {
  const links = mockStudentGuardianLinks.filter(
    (l) => l.guardianId === guardianId,
  );
  return links
    .map((link) => mockStudents.find((s) => s.id === link.studentId))
    .filter((s): s is Student => s !== undefined);
}

/**
 * Get all guardians
 */
export function getAllGuardians(): StudentGuardian[] {
  return mockStudentGuardians;
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

/**
 * Get all documents for a student
 */
export function getStudentDocuments(studentId: string): StudentDocument[] {
  return mockStudentDocuments.filter((d) => d.studentId === studentId);
}

/**
 * Get missing documents for a student
 */
export function getMissingDocuments(studentId: string): StudentDocument[] {
  return mockStudentDocuments.filter(
    (d) => d.studentId === studentId && d.status === "missing",
  );
}

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

/**
 * Get all notes for a student
 */
export function getStudentNotes(studentId: string): StudentNote[] {
  return mockStudentNotes.filter((n) => n.studentId === studentId);
}

/**
 * Get notes by category
 */
export function getStudentNotesByCategory(
  studentId: string,
  category: StudentNote["category"],
): StudentNote[] {
  return mockStudentNotes.filter(
    (n) => n.studentId === studentId && n.category === category,
  );
}

/**
 * Get notes by visibility
 */
export function getStudentNotesByVisibility(
  studentId: string,
  visibility: StudentNote["visibility"],
): StudentNote[] {
  return mockStudentNotes.filter(
    (n) => n.studentId === studentId && n.visibility === visibility,
  );
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
    .filter((e) => e.grade === grade)
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

/**
 * Get students with current enrollment data (for display)
 */
export function getStudentsWithEnrollment(): Array<
  Student & {
    enrollment?: StudentEnrollment;
    currentTerm?: EnrollmentTerm;
    ytdPerformance?: ReturnType<typeof getYearToDateAverages>;
  }
> {
  return mockStudents.map((student) => {
    const enrollment = getEnrollmentByStudentId(student.id);
    const currentTerm = enrollment
      ? getCurrentTerm(enrollment.enrollmentId)
      : undefined;
    const ytdPerformance = enrollment
      ? getYearToDateAverages(enrollment.enrollmentId)
      : undefined;

    return {
      ...student,
      enrollment,
      currentTerm,
      ytdPerformance,
    };
  });
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
    const enrollmentHistory = mockStudentEnrollments
      .filter((e) => e.studentId === student.id)
      .sort((a, b) => a.academicYear.localeCompare(b.academicYear));

    // Get the most recent enrollment (last in sorted array)
    const currentEnrollment = enrollmentHistory[enrollmentHistory.length - 1];

    return {
      ...student,
      enrollmentHistory,
      currentEnrollment,
    };
  });
}
