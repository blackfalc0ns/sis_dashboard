// FILE: src/types/admissions/test.ts
// Test model

import type { TestStatus } from "./enums";

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
