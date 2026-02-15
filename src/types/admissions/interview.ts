// FILE: src/types/admissions/interview.ts
// Interview model

import type { InterviewStatus } from "./enums";

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
