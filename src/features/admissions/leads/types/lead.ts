// FILE: src/types/admissions/lead.ts
// Lead model and related types

import type { LeadChannel, LeadStatus, ActivityType } from "@/features/admissions/types/enums";

export interface Lead {
  [key: string]: unknown;
  id: string;
  studentName: string;
  primaryContactName?: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  status: LeadStatus;
  notes?: string;
  createdAt: string; // ISO date string
  // Legacy compatibility — derived getter-like helpers can map these
  name?: string;
  gradeInterest?: string;
  source?: string;
}

export interface CreateLeadPayload {
  studentName: string;
  primaryContactName: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  notes?: string;
}

export interface UpdateLeadPayload {
  studentName?: string;
  primaryContactName?: string;
  phone?: string;
  email?: string;
  channel?: LeadChannel;
  status?: LeadStatus;
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
