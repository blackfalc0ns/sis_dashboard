// FILE: src/types/admissions/index.ts
// Main exports for admissions module

// Enums & Status Types
export type {
  LeadChannel,
  LeadStatus,
  ActivityType,
  ApplicationStatus,
  TestStatus,
  InterviewStatus,
  DecisionType,
  DocumentStatus,
  ApplicationSource,
} from "./enums";

// Models
export type { Lead, ActivityLogItem, Note, ApplicationDraft } from "./lead";
export type { Guardian } from "./guardian";
export type { Document } from "./document";
export type { Test } from "./test";
export type { Interview } from "./interview";
export type { Decision } from "./decision";
export type { Enrollment } from "./enrollment";
export type { Application } from "./application";
