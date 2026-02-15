// FILE: src/types/admissions/decision.ts
// Decision model

import type { DecisionType } from "./enums";

export interface Decision {
  id: string;
  applicationId: string;
  decision: DecisionType;
  reason: string;
  decisionDate: string;
  decidedBy: string;
}
