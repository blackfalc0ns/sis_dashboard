// FILE: src/types/admissions/enrollment.ts
// Enrollment model

export interface Enrollment {
  id: string;
  applicationId: string;
  academicYear: string;
  grade: string;
  section: string;
  startDate: string;
  enrolledDate: string;
}
