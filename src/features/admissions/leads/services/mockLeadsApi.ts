// Legacy shim — all consumers should migrate to leadsApiService.ts
// Re-exports async functions matching the old API for backward compatibility

import {
  fetchLeads,
  fetchLeadById,
  createLead as apiCreateLead,
  convertLead,
} from "@/features/admissions/leads/services/leadsApiService";
import type { Lead, ActivityLogItem, Note, ApplicationDraft } from "@/features/admissions/leads/types/lead";
import type { LeadChannel } from "@/features/admissions/types/enums";

// Synchronous shim: getLeads returns an empty array
// Components that use this must migrate to the async fetchLeads()
export const getLeads = (): Lead[] => {
  console.warn("getLeads() is deprecated. Use async fetchLeads() from leadsApiService.");
  return [];
};

export const getLeadById = (id: string): Lead | undefined => {
  console.warn("getLeadById() is deprecated. Use async fetchLeadById() from leadsApiService.");
  void id;
  return undefined;
};

export const createLead = (leadData: Omit<Lead, "id" | "createdAt">): Lead => {
  console.warn("createLead() sync is deprecated. Use async createLead() from leadsApiService.");
  // Fire-and-forget the async version
  void apiCreateLead({
    studentName: String(leadData.studentName || leadData.name || ""),
    primaryContactName: String(leadData.primaryContactName || ""),
    phone: String(leadData.phone),
    email: leadData.email ? String(leadData.email) : undefined,
    channel: leadData.channel as LeadChannel,
    notes: leadData.notes ? String(leadData.notes) : undefined,
  });
  // Return a stub
  return {
    ...leadData,
    id: `pending-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as Lead;
};

// Activity log — UI Ready stubs (no backend endpoint)
export const getActivitiesByLeadId = (_leadId: string): ActivityLogItem[] => [];
export const addActivity = (
  _activityData: Omit<ActivityLogItem, "id" | "createdAt">
): ActivityLogItem => ({
  ..._activityData,
  id: `stub-${Date.now()}`,
  createdAt: new Date().toISOString(),
});

// Notes — UI Ready stubs (no backend endpoint)
export const getNotesByLeadId = (_leadId: string): Note[] => [];
export const addNote = (_noteData: Omit<Note, "id" | "createdAt">): Note => ({
  ..._noteData,
  id: `stub-${Date.now()}`,
  createdAt: new Date().toISOString(),
});

// Conversion — delegates to API
export const convertLeadToApplication = (leadId: string): ApplicationDraft => {
  console.warn("convertLeadToApplication() is deprecated. Use convertLead() from leadsApiService.");
  void convertLead(leadId);
  return {
    id: `draft-${Date.now()}`,
    leadId,
    studentName: "",
    status: "Draft",
    createdAt: new Date().toISOString(),
  };
};

// Re-export async versions for gradual migration
export { fetchLeads, fetchLeadById, convertLead };
