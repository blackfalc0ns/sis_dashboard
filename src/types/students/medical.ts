// FILE: src/types/students/medical.ts
// Student medical profile model

/**
 * Student Medical Profile
 * Contains medical information and health records for a student
 */
export interface StudentMedicalProfile {
  studentId: string; // Student this profile belongs to
  blood_type?: string; // Blood type (A+, B+, O-, etc.)
  allergies?: string; // Known allergies
  notes?: string; // Additional medical notes
  emergency_plan?: string; // Emergency response plan
}

// Backward compatibility alias
export type StudentMedicalProfileMock = StudentMedicalProfile;
