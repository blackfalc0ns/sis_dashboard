// FILE: src/utils/updateMockDataWithEmails.ts

/**
 * Utility to add random emails to mock data
 * This file demonstrates how to add emails to students and guardians
 */

import { generateStudentEmail, generateGuardianEmail } from "./emailGenerator";

interface ApplicationWithEmail {
  id: string;
  student_email?: string;
  full_name_en?: string;
  studentName?: string;
  full_name_ar?: string;
  studentNameArabic?: string;
  guardianEmail?: string;
  guardians?: Array<{
    id: string;
    email?: string;
    full_name?: string;
    is_primary?: boolean;
  }>;
}

interface StudentWithEmail {
  id: string;
  email?: string;
  full_name_en?: string;
  studentName?: string;
  full_name_ar?: string;
  studentNameArabic?: string;
  guardians?: Array<{
    id: string;
    email?: string;
    full_name?: string;
  }>;
}

interface LeadWithEmail {
  id: string;
  email?: string;
  name?: string;
}

// Example usage for updating applications
export function addEmailsToApplication(
  application: ApplicationWithEmail,
): ApplicationWithEmail {
  // Add student email if missing
  if (!application.student_email || application.student_email === "") {
    application.student_email = generateStudentEmail(
      application.id,
      application.full_name_en || application.studentName,
      application.full_name_ar || application.studentNameArabic,
    );
  }

  // Add emails to guardians if missing
  if (application.guardians && Array.isArray(application.guardians)) {
    application.guardians = application.guardians.map((guardian) => {
      if (!guardian.email || guardian.email === "") {
        guardian.email = generateGuardianEmail(
          guardian.id,
          guardian.full_name,
          undefined,
        );
      }
      return guardian;
    });

    // Update primary guardian email
    const primaryGuardian = application.guardians.find((g) => g.is_primary);
    if (primaryGuardian && !application.guardianEmail) {
      application.guardianEmail = primaryGuardian.email;
    }
  }

  return application;
}

// Example usage for updating students
export function addEmailsToStudent(
  student: StudentWithEmail,
): StudentWithEmail {
  // Add student email if missing
  if (!student.email || student.email === "") {
    student.email = generateStudentEmail(
      student.id,
      student.full_name_en || student.studentName,
      student.full_name_ar || student.studentNameArabic,
    );
  }

  // Add emails to guardians if missing
  if (student.guardians && Array.isArray(student.guardians)) {
    student.guardians = student.guardians.map((guardian) => {
      if (!guardian.email || guardian.email === "") {
        guardian.email = generateGuardianEmail(
          guardian.id,
          guardian.full_name,
          undefined,
        );
      }
      return guardian;
    });
  }

  return student;
}

// Example usage for updating leads
export function addEmailsToLead(lead: LeadWithEmail): LeadWithEmail {
  // Leads already have emails, but we can generate if missing
  if (!lead.email || lead.email === "") {
    lead.email = generateGuardianEmail(lead.id, lead.name, undefined);
  }

  return lead;
}

// Batch update function
export function addEmailsToMockData(data: {
  leads?: LeadWithEmail[];
  applications?: ApplicationWithEmail[];
  students?: StudentWithEmail[];
}) {
  const updated = { ...data };

  if (updated.leads) {
    updated.leads = updated.leads.map(addEmailsToLead);
  }

  if (updated.applications) {
    updated.applications = updated.applications.map(addEmailsToApplication);
  }

  if (updated.students) {
    updated.students = updated.students.map(addEmailsToStudent);
  }

  return updated;
}
