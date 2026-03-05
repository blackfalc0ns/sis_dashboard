// FILE: src/types/admissions/test.ts
// Test model

import type { TestStatus } from "@/features/admissions/types/enums";

export interface Test {
  id: string;
  applicationId: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  duration?: string;
  location: string;
  proctor?: string;
  proctorPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  status: TestStatus;
  score?: number;
  maxScore?: number;
  notes?: string;
}
