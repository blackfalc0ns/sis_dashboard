// FILE: src/types/admissions/lead.ts
// Lead model and related types

import type { LeadChannel, LeadStatus, ActivityType } from "./enums";

export interface Lead {
  [key: string]: unknown;
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  status: LeadStatus;
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
