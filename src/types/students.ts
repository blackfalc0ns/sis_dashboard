// FILE: src/types/students.ts

export type StudentStatus = "active" | "withdrawn" | "suspended";
export type RiskFlag = "attendance" | "grades" | "behavior";

export interface Student {
  [key: string]: unknown;
  id: string;
  student_id: string;
  name: string;
  date_of_birth: string;
  grade: string;
  section: string;
  status: StudentStatus;
  photo?: string;
  enrollment_year: number;
  attendance_percentage: number;
  current_average: number;
  risk_flags: RiskFlag[];
  created_at: string;
  updated_at: string;
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relation: "father" | "mother" | "guardian" | "other";
  portal_access: boolean;
  created_at: string;
}

export interface GuardianLink {
  id: string;
  student_id: string;
  guardian_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  type: string;
  file_url: string;
  status: "complete" | "missing" | "expired";
  expiry_date?: string;
  uploaded_at: string;
}

export interface MedicalProfile {
  id: string;
  student_id: string;
  allergies: string[];
  medical_notes: string;
  emergency_plan?: string;
  updated_at: string;
}

export interface StudentNote {
  id: string;
  student_id: string;
  category: "academic" | "behavioral" | "medical" | "general";
  note: string;
  visibility: "internal" | "visible_to_guardian";
  created_by: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  minutes?: number;
  reason?: string;
  created_at: string;
}

export interface ReinforcementEvent {
  id: string;
  student_id: string;
  matrix_item_id: string;
  points: number;
  note?: string;
  created_by: string;
  created_at: string;
}

export interface BehaviorIncident {
  id: string;
  student_id: string;
  severity: "low" | "medium" | "high";
  description: string;
  action_taken: string;
  status: "open" | "resolved";
  created_by: string;
  created_at: string;
  resolved_at?: string;
}
