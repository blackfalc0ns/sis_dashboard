// FILE: src/types/leads.ts

export type LeadChannel = "In-app" | "Referral" | "Walk-in" | "Other";
export type LeadStatus = "New" | "Contacted";
export type ActivityType =
  | "Call"
  | "WhatsApp"
  | "Email"
  | "Note"
  | "StatusChange";

export interface Lead {
  [key: string]: unknown;
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  status: LeadStatus;
  owner: string;
  createdAt: string; // ISO date string
  gradeInterest?: string;
  source?: string;
  notes?: string;
}

export interface ActivityLogItem {
  id: string;
  leadId: string;
  type: ActivityType;
  message: string;
  createdAt: string;
  createdBy: string;
}

export interface Note {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface ApplicationDraft {
  id: string;
  leadId: string;
  studentName: string;
  gradeRequested?: string;
  status: "Draft";
  createdAt: string;
}
