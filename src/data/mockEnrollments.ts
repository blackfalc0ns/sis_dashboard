// FILE: src/data/mockEnrollments.ts
// ERP Enrollment mock data

import type { StudentEnrollment } from "@/types/students";
import { mockStudents } from "./mockDataLinked";

/**
 * Generate enrollments for all students
 * Students have different academic years based on their enrollment date
 */
export const mockStudentEnrollments: StudentEnrollment[] = mockStudents.map(
  (student, index) => {
    const enrollmentId = `ENR-${student.id}`;

    // Determine academic year based on student ID or submitted date
    let academicYear = "2026-2027"; // Default for new students

    // Students from 2024 submissions → 2024-2025 academic year
    if (student.id.startsWith("2024-")) {
      academicYear = "2024-2025";
    }
    // Students from 2025 submissions → 2025-2026 academic year
    else if (student.id.startsWith("2025-")) {
      academicYear = "2025-2026";
    }
    // Students from 2026 applications → 2026-2027 academic year
    else if (
      student.id.startsWith("STU-APP-2024") ||
      student.id.startsWith("STU-APP-2026")
    ) {
      academicYear = "2026-2027";
    }

    // Determine grade from student data
    const grade = student.gradeRequested;

    // Assign section based on index (distribute across A, B, C)
    const sections = ["A", "B", "C"];
    const section = sections[index % 3];

    // Enrollment date is the student's submitted date or a default
    const enrollmentDate = student.submittedDate || "2026-09-01";

    // Status based on student status
    let status: StudentEnrollment["status"] = "active";
    if (student.status === "Withdrawn") {
      status = "withdrawn";
    } else if (student.status === "Suspended") {
      status = "active"; // Suspended students are still enrolled
    }

    return {
      enrollmentId,
      studentId: student.id,
      academicYear,
      grade,
      section,
      enrollmentDate,
      status,
    };
  },
);

/**
 * Get enrollment by student ID
 */
export function getEnrollmentByStudentId(
  studentId: string,
): StudentEnrollment | undefined {
  return mockStudentEnrollments.find((e) => e.studentId === studentId);
}

/**
 * Get enrollments by grade
 */
export function getEnrollmentsByGrade(grade: string): StudentEnrollment[] {
  return mockStudentEnrollments.filter((e) => e.grade === grade);
}

/**
 * Get enrollments by section
 */
export function getEnrollmentsBySection(
  grade: string,
  section: string,
): StudentEnrollment[] {
  return mockStudentEnrollments.filter(
    (e) => e.grade === grade && e.section === section,
  );
}
