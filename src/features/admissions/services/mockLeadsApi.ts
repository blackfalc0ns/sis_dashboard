// FILE: src/api/mockLeadsApi.ts
// Simplified mock API for leads management

import { mockLeads } from "@/data/mockDataLinked";
import { Lead, ActivityLogItem, Note, ApplicationDraft } from "@/types/leads";

// Use leads from centralized mock data
const leads: Lead[] = mockLeads as Lead[];

// Activity log storage
const activities: ActivityLogItem[] = [
  {
    id: "A001",
    leadId: "L001",
    type: "StatusChange",
    message: "Lead status changed to Converted",
    createdAt: "2026-01-05T09:00:00Z",
    createdBy: "System",
  },
  {
    id: "A002",
    leadId: "L002",
    type: "Call",
    message: "Initial phone call made. Parent interested in Grade 7 admission.",
    createdAt: "2026-01-08T15:00:00Z",
    createdBy: "Ahmed Al-Mansoori",
  },
  {
    id: "A003",
    leadId: "L003",
    type: "WhatsApp",
    message: "Sent school brochure and fee structure via WhatsApp",
    createdAt: "2026-01-10T12:00:00Z",
    createdBy: "Fatima Al-Zaabi",
  },
  {
    id: "A004",
    leadId: "L003",
    type: "Call",
    message: "Follow-up call completed. Parent requested campus tour.",
    createdAt: "2026-01-11T10:00:00Z",
    createdBy: "Fatima Al-Zaabi",
  },
  {
    id: "A005",
    leadId: "L004",
    type: "StatusChange",
    message: "Lead created with status New",
    createdAt: "2026-02-01T09:00:00Z",
    createdBy: "System",
  },
  {
    id: "A006",
    leadId: "L005",
    type: "StatusChange",
    message: "Lead status changed to Closed",
    createdAt: "2025-12-20T16:00:00Z",
    createdBy: "Sarah Johnson",
  },
  {
    id: "A007",
    leadId: "L006",
    type: "Email",
    message: "Sent welcome email with school information packet",
    createdAt: "2026-02-05T09:30:00Z",
    createdBy: "Ahmed Al-Mansoori",
  },
  {
    id: "A008",
    leadId: "L007",
    type: "Call",
    message: "Initial contact made. Parent interested in bilingual program.",
    createdAt: "2026-02-08T13:00:00Z",
    createdBy: "Fatima Al-Zaabi",
  },
  {
    id: "A009",
    leadId: "L008",
    type: "StatusChange",
    message: "Lead status changed to Contacted",
    createdAt: "2026-02-10T09:00:00Z",
    createdBy: "Sarah Johnson",
  },
];

// Notes storage
const notes: Note[] = [
  {
    id: "N001",
    leadId: "L001",
    body: "Parent inquired about STEM program and extracurricular activities.",
    createdAt: "2026-01-05T10:30:00Z",
    createdBy: "Sarah Johnson",
  },
  {
    id: "N002",
    leadId: "L002",
    body: "Follow-up scheduled for campus tour next week.",
    createdAt: "2026-01-08T15:30:00Z",
    createdBy: "Ahmed Al-Mansoori",
  },
  {
    id: "N003",
    leadId: "L003",
    body: "Parent specifically interested in Arabic language program. Mentioned student has strong foundation in Arabic.",
    createdAt: "2026-01-10T14:00:00Z",
    createdBy: "Fatima Al-Zaabi",
  },
  {
    id: "N004",
    leadId: "L004",
    body: "Student is very active in sports. Parent asked about football and basketball programs.",
    createdAt: "2026-02-01T11:00:00Z",
    createdBy: "Mohammed Hassan",
  },
  {
    id: "N005",
    leadId: "L005",
    body: "Parent decided to go with competitor school due to proximity to home.",
    createdAt: "2025-12-20T16:00:00Z",
    createdBy: "Sarah Johnson",
  },
  {
    id: "N006",
    leadId: "L006",
    body: "Very interested in our technology and innovation programs. Student has coding experience.",
    createdAt: "2026-02-05T10:00:00Z",
    createdBy: "Ahmed Al-Mansoori",
  },
  {
    id: "N007",
    leadId: "L007",
    body: "Parent concerned about class sizes. Explained our small class policy (max 20 students).",
    createdAt: "2026-02-08T13:30:00Z",
    createdBy: "Fatima Al-Zaabi",
  },
  {
    id: "N008",
    leadId: "L008",
    body: "Sibling already enrolled in Grade 4. Parent very satisfied with school experience.",
    createdAt: "2026-02-10T09:00:00Z",
    createdBy: "Sarah Johnson",
  },
];

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

  // Add initial activity
  addActivity({
    leadId: newLead.id,
    type: "StatusChange",
    message: `Lead created with status ${newLead.status}`,
    createdBy: "System",
  });

  return newLead;
};

// ============================================================================
// ACTIVITY LOG OPERATIONS
// ============================================================================

export const getActivitiesByLeadId = (leadId: string): ActivityLogItem[] => {
  return activities
    .filter((a) => a.leadId === leadId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
};

export const addActivity = (
  activityData: Omit<ActivityLogItem, "id" | "createdAt">,
): ActivityLogItem => {
  const newActivity: ActivityLogItem = {
    ...activityData,
    id: `A${String(activities.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  activities.push(newActivity);
  return newActivity;
};

// ============================================================================
// NOTES OPERATIONS
// ============================================================================

export const getNotesByLeadId = (leadId: string): Note[] => {
  return notes
    .filter((n) => n.leadId === leadId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
};

export const addNote = (noteData: Omit<Note, "id" | "createdAt">): Note => {
  const newNote: Note = {
    ...noteData,
    id: `N${String(notes.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  notes.push(newNote);

  // Add activity for note
  addActivity({
    leadId: noteData.leadId,
    type: "Note",
    message: `Note added: ${noteData.body.substring(0, 50)}${noteData.body.length > 50 ? "..." : ""}`,
    createdBy: noteData.createdBy,
  });

  return newNote;
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
    studentName: lead.name,
    gradeRequested: lead.gradeInterest,
    status: "Draft",
    createdAt: new Date().toISOString(),
  };

  // Add activity
  addActivity({
    leadId: lead.id,
    type: "StatusChange",
    message: `Lead converted to application ${draft.id}`,
    createdBy: "System",
  });

  return draft;
};
