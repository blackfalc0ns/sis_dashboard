// FILE: src/api/mockLeadsApi.ts
// Simplified mock API for leads management

import { mockLeads } from "@/data/mockDataLinked";
import { Lead, ApplicationDraft } from "@/features/admissions/leads/types/lead";

// Use leads from centralized mock data
const leads: Lead[] = mockLeads as Lead[];

// ============================================================================
// LEAD OPERATIONS
// ============================================================================

export const getLeads = (): Lead[] => {
  return [...leads];
};

export const getLeadById = (id: string): Lead | undefined => {
  return leads.find((lead) => lead.id === id);
};

export const createLead = (leadData: Omit<Lead, "id" | "createdAt">): Lead => {
  const id = `L${String(leads.length + 1).padStart(3, "0")}`;
  const createdAt = new Date().toISOString();

  const newLead = {
    ...leadData,
    id,
    createdAt,
  } as Lead;

  leads.push(newLead);

  return newLead;
};

// ============================================================================
// LEAD CONVERSION
// ============================================================================

export const convertLeadToApplication = (leadId: string): ApplicationDraft => {
  const lead = getLeadById(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  const draft: ApplicationDraft = {
    id: `APP-DRAFT-${Date.now()}`,
    leadId: lead.id,
    studentName: lead.studentName || lead.name || "",
    gradeRequested: lead.gradeInterest as string | undefined,
    status: "Draft",
    createdAt: new Date().toISOString(),
  };

  return draft;
};
