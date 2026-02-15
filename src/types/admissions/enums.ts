// FILE: src/types/admissions/enums.ts
// Admissions enums and status types

// Lead Types
export type LeadChannel = "In-app" | "Referral" | "Walk-in" | "Other";

export type LeadStatus = "New" | "Contacted" | "Converted" | "Closed";

export type ActivityType =
  | "Call"
  | "WhatsApp"
  | "Email"
  | "Note"
  | "StatusChange";

// Application Types
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

export type DocumentStatus = "complete" | "missing";

export type ApplicationSource = "in_app" | "referral" | "walk_in" | "other";
