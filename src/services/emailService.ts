// FILE: src/services/emailService.ts

/**
 * Email Service - Generate and manage emails for students and guardians
 */

import {
  generateStudentEmail,
  generateGuardianEmail,
} from "@/utils/emailGenerator";

/**
 * Generate email for a student based on their information
 */
export function getOrGenerateStudentEmail(student: {
  id: string;
  email?: string;
  full_name_en?: string;
  studentName?: string;
  full_name_ar?: string;
  studentNameArabic?: string;
}): string {
  // Return existing email if available
  if (student.email && student.email !== "") {
    return student.email;
  }

  // Generate new email
  const englishName = student.full_name_en || student.studentName;
  const arabicName = student.full_name_ar || student.studentNameArabic;

  return generateStudentEmail(student.id, englishName, arabicName);
}

/**
 * Generate email for a guardian based on their information
 */
export function getOrGenerateGuardianEmail(guardian: {
  id?: string;
  guardianId?: string;
  email?: string;
  full_name?: string;
  name?: string;
}): string {
  // Return existing email if available
  if (guardian.email && guardian.email !== "") {
    return guardian.email;
  }

  // Generate new email
  const name = guardian.full_name || guardian.name;
  const id = guardian.id || guardian.guardianId || "";

  return generateGuardianEmail(id, name);
}

/**
 * Ensure all students have emails
 */
export function ensureStudentsHaveEmails<
  T extends { id: string; email?: string },
>(students: T[]): T[] {
  return students.map((student) => ({
    ...student,
    email: getOrGenerateStudentEmail(
      student as T & {
        full_name_en?: string;
        studentName?: string;
        full_name_ar?: string;
        studentNameArabic?: string;
      },
    ),
  }));
}

/**
 * Ensure all guardians in a list have emails
 */
export function ensureGuardiansHaveEmails<
  T extends { id: string; email?: string },
>(guardians: T[]): T[] {
  return guardians.map((guardian) => ({
    ...guardian,
    email: getOrGenerateGuardianEmail(
      guardian as T & { full_name?: string; name?: string },
    ),
  }));
}
