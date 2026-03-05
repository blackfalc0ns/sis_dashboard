// FILE: src/types/students/enrollment.ts
// ERP Enrollment types

/**
 * Student Enrollment
 * Represents a student's enrollment for a specific academic year
 */
export interface StudentEnrollment {
  enrollmentId: string; // e.g., "ENR-2026-001"
  studentId: string; // Links to Student.id
  academicYear: string; // e.g., "2026-2027"
  grade: string; // e.g., "Grade 6"
  section: string; // e.g., "A", "B", "C"
  enrollmentDate: string; // ISO date string
  status: "active" | "completed" | "withdrawn"; // Enrollment status
}

/**
 * Enrollment Term
 * Represents performance data for a specific term within an enrollment
 */
export interface EnrollmentTerm {
  termId: string; // e.g., "TERM-ENR-2026-001-T1"
  enrollmentId: string; // Links to StudentEnrollment.enrollmentId
  term: "Term 1" | "Term 2" | "Term 3";
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  attendancePercentage: number; // 0-100
  gradeAverage: number; // 0-100
  riskFlags: ("attendance" | "grades" | "behavior")[]; // Risk indicators
}

/**
 * Class Teacher Assignment
 * Maps a class (grade + section) to a homeroom/class teacher
 */
export interface ClassTeacherAssignment {
  assignmentId: string; // e.g., "CTA-2026-G6-A"
  academicYear: string; // e.g., "2026-2027"
  grade: string; // e.g., "Grade 6"
  section: string; // e.g., "A"
  teacherId: string; // e.g., "T001"
  teacherName: string; // e.g., "Ms. Sarah Johnson"
  teacherNameArabic?: string; // Arabic name
}

/**
 * Subject Teacher Assignment
 * Maps a class + subject to a subject teacher
 */
export interface SubjectTeacherAssignment {
  assignmentId: string; // e.g., "STA-2026-G6-A-MATH"
  academicYear: string; // e.g., "2026-2027"
  grade: string; // e.g., "Grade 6"
  section: string; // e.g., "A"
  subject: string; // e.g., "Mathematics", "Science", "Arabic"
  teacherId: string; // e.g., "T001"
  teacherName: string; // e.g., "Dr. Ahmed Al-Mansoori"
  teacherNameArabic?: string; // Arabic name
}
