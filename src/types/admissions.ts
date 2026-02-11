// FILE: src/types/admissions.ts

export type LeadStatus = "New" | "Contacted";
export type ApplicationStatus =
  | "submitted"
  | "documents_pending"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "rejected";
export type TestStatus = "scheduled" | "completed" | "failed";
export type InterviewStatus = "scheduled" | "completed";
export type DecisionType = "accept" | "waitlist" | "reject";

export interface Guardian {
  id?: string;
  full_name: string;
  relation: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  national_id: string;
  job_title: string;
  workplace: string;
  is_primary: boolean;
  can_pickup: boolean;
  can_receive_notifications: boolean;
}

export interface Application {
  [key: string]: unknown;
  id: string;
  leadId?: string;
  source?: "in_app" | "referral" | "walk_in" | "other";

  // Student Information
  full_name_ar: string;
  full_name_en: string;
  studentName: string; // Display name (for backward compatibility)
  studentNameArabic?: string; // Alias for full_name_ar
  gender: string;
  date_of_birth: string;
  dateOfBirth?: string; // Alias for date_of_birth
  nationality: string;

  // Contact Information
  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;

  // Academic Information
  grade_requested: string;
  gradeRequested: string; // Alias for grade_requested
  previous_school?: string;
  previousSchool?: string; // Alias for previous_school
  join_date?: string;

  // Medical & Notes
  medical_conditions?: string;
  notes?: string;

  // Guardians
  guardians: Guardian[];
  guardianName: string; // Primary guardian name (for backward compatibility)
  guardianPhone: string; // Primary guardian phone (for backward compatibility)
  guardianEmail: string; // Primary guardian email (for backward compatibility)

  // Status & Dates
  status: ApplicationStatus;
  submittedDate: string;

  // Related Data
  documents: Document[];
  tests: Test[];
  interviews: Interview[];
  decision?: Decision;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  status: "complete" | "missing";
  uploadedDate?: string;
}

export interface Test {
  id: string;
  applicationId: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  proctor?: string;
  status: TestStatus;
  score?: number;
  maxScore?: number;
  notes?: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  date: string;
  time: string;
  interviewer: string;
  location: string;
  status: InterviewStatus;
  notes?: string;
  rating?: number;
}

export interface Decision {
  id: string;
  applicationId: string;
  decision: DecisionType;
  reason: string;
  decisionDate: string;
  decidedBy: string;
}

export interface Enrollment {
  id: string;
  applicationId: string;
  academicYear: string;
  grade: string;
  section: string;
  startDate: string;
  enrolledDate: string;
}
