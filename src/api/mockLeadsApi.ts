// FILE: src/api/mockLeadsApi.ts

import { Lead, ActivityLogItem, Note, ApplicationDraft } from "@/types/leads";

// Mock data storage
const leads: Lead[] = [
  // Week 1 (most recent - Feb 11, 2026)
  {
    id: "L001",
    name: "Ahmed Hassan",
    phone: "050-123-4567",
    email: "ahmed.hassan@email.com",
    channel: "In-app",
    status: "New",
    owner: "Sara Ahmed",
    createdAt: "2026-02-10T09:00:00Z",
    gradeInterest: "Grade 5",
    source: "Website Form",
  },
  {
    id: "L002",
    name: "Fatima Ali",
    phone: "050-234-5678",
    email: "fatima.ali@email.com",
    channel: "Referral",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-02-09T14:30:00Z",
    gradeInterest: "Grade 3",
    source: "Parent Referral",
  },
  {
    id: "L003",
    name: "Omar Abdullah",
    phone: "050-345-6789",
    channel: "Walk-in",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-02-08T11:15:00Z",
    gradeInterest: "Grade 7",
  },
  {
    id: "L004",
    name: "Layla Mohammed",
    phone: "050-456-7890",
    email: "layla.m@email.com",
    channel: "Referral",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-02-07T16:45:00Z",
    gradeInterest: "Grade 4",
    notes: "Converted to application APP-2024-001",
  },
  {
    id: "L005",
    name: "Youssef Ibrahim",
    phone: "050-567-8901",
    channel: "Other",
    status: "New",
    owner: "Sara Ahmed",
    createdAt: "2026-02-06T10:20:00Z",
    gradeInterest: "Grade 1",
  },

  // Week 2 (Feb 4-3, 2026)
  {
    id: "L006",
    name: "Mariam Saeed",
    phone: "050-678-9012",
    email: "mariam.saeed@email.com",
    channel: "In-app",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-02-05T08:00:00Z",
    gradeInterest: "Grade 6",
  },
  {
    id: "L007",
    name: "Khalid Ahmed",
    phone: "050-789-0123",
    email: "khalid@email.com",
    channel: "In-app",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-02-04T14:00:00Z",
    gradeInterest: "Grade 2",
  },

  // Week 3 (Jan 28-27, 2026)
  {
    id: "L008",
    name: "Noor Hassan",
    phone: "050-890-1234",
    channel: "Referral",
    status: "New",
    owner: "Mohammed Khalil",
    createdAt: "2026-02-03T11:30:00Z",
    gradeInterest: "Grade 5",
  },
  {
    id: "L009",
    name: "Sara Abdullah",
    phone: "050-901-2345",
    email: "sara.a@email.com",
    channel: "Walk-in",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-02-02T09:15:00Z",
    gradeInterest: "Grade 8",
  },
  {
    id: "L010",
    name: "Mohammed Ali",
    phone: "050-012-3456",
    channel: "In-app",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-31T16:00:00Z",
    gradeInterest: "Grade 4",
  },
  {
    id: "L011",
    name: "Aisha Ibrahim",
    phone: "050-123-4568",
    email: "aisha@email.com",
    channel: "Referral",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-01-30T10:30:00Z",
    gradeInterest: "Grade 6",
  },

  // Week 4 (Jan 21-20, 2026)
  {
    id: "L012",
    name: "Hassan Mohammed",
    phone: "050-234-5679",
    channel: "In-app",
    status: "New",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-29T13:45:00Z",
    gradeInterest: "Grade 3",
  },
  {
    id: "L013",
    name: "Zainab Ali",
    phone: "050-345-6780",
    email: "zainab@email.com",
    channel: "Walk-in",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-01-28T15:20:00Z",
    gradeInterest: "Grade 7",
  },
  {
    id: "L014",
    name: "Ali Hassan",
    phone: "050-456-7891",
    channel: "Referral",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-25T09:00:00Z",
    gradeInterest: "Grade 5",
  },
  {
    id: "L015",
    name: "Fatima Hassan",
    phone: "050-567-8902",
    email: "fatima.h@email.com",
    channel: "In-app",
    status: "New",
    owner: "Sara Ahmed",
    createdAt: "2026-01-24T11:30:00Z",
    gradeInterest: "Grade 2",
  },

  // Week 5 (Jan 14-13, 2026)
  {
    id: "L016",
    name: "Omar Khalil",
    phone: "050-678-9013",
    channel: "Other",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-23T14:15:00Z",
    gradeInterest: "Grade 4",
  },
  {
    id: "L017",
    name: "Layla Ahmed",
    phone: "050-789-0124",
    email: "layla.a@email.com",
    channel: "In-app",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-01-22T16:45:00Z",
    gradeInterest: "Grade 6",
  },
  {
    id: "L018",
    name: "Youssef Ali",
    phone: "050-890-1235",
    channel: "Referral",
    status: "New",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-21T10:00:00Z",
    gradeInterest: "Grade 8",
  },
  {
    id: "L019",
    name: "Mariam Hassan",
    phone: "050-901-2346",
    email: "mariam.h@email.com",
    channel: "Walk-in",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-01-18T13:30:00Z",
    gradeInterest: "Grade 3",
  },

  // Week 6 (Jan 7-6, 2026)
  {
    id: "L020",
    name: "Khalid Mohammed",
    phone: "050-012-3457",
    channel: "In-app",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-17T09:45:00Z",
    gradeInterest: "Grade 5",
  },
  {
    id: "L021",
    name: "Noor Ali",
    phone: "050-123-4569",
    email: "noor@email.com",
    channel: "Referral",
    status: "New",
    owner: "Sara Ahmed",
    createdAt: "2026-01-16T15:00:00Z",
    gradeInterest: "Grade 7",
  },
  {
    id: "L022",
    name: "Sara Mohammed",
    phone: "050-234-5680",
    channel: "In-app",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-15T11:20:00Z",
    gradeInterest: "Grade 4",
  },
  {
    id: "L023",
    name: "Ahmed Ibrahim",
    phone: "050-345-6781",
    email: "ahmed.i@email.com",
    channel: "Other",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-01-14T14:30:00Z",
    gradeInterest: "Grade 2",
  },

  // Older data (31-60 days back)
  {
    id: "L024",
    name: "Aisha Mohammed",
    phone: "050-456-7892",
    channel: "In-app",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2026-01-10T10:15:00Z",
    gradeInterest: "Grade 6",
  },
  {
    id: "L025",
    name: "Hassan Ali",
    phone: "050-567-8903",
    email: "hassan.a@email.com",
    channel: "Referral",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2026-01-05T13:00:00Z",
    gradeInterest: "Grade 5",
  },
  {
    id: "L026",
    name: "Zainab Hassan",
    phone: "050-678-9014",
    channel: "Walk-in",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2025-12-28T16:30:00Z",
    gradeInterest: "Grade 3",
  },
  {
    id: "L027",
    name: "Ali Mohammed",
    phone: "050-789-0125",
    email: "ali.m@email.com",
    channel: "In-app",
    status: "New",
    owner: "Sara Ahmed",
    createdAt: "2025-12-20T09:45:00Z",
    gradeInterest: "Grade 8",
  },
  {
    id: "L028",
    name: "Fatima Ibrahim",
    phone: "050-890-1236",
    channel: "Referral",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2025-12-15T14:20:00Z",
    gradeInterest: "Grade 4",
  },

  // Older data (61-90 days back)
  {
    id: "L029",
    name: "Omar Hassan",
    phone: "050-901-2347",
    email: "omar.h@email.com",
    channel: "In-app",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2025-12-10T11:00:00Z",
    gradeInterest: "Grade 7",
  },
  {
    id: "L030",
    name: "Layla Ali",
    phone: "050-012-3458",
    channel: "Other",
    status: "New",
    owner: "Mohammed Khalil",
    createdAt: "2025-12-05T15:45:00Z",
    gradeInterest: "Grade 2",
  },
  {
    id: "L031",
    name: "Youssef Hassan",
    phone: "050-123-4570",
    email: "youssef.h@email.com",
    channel: "In-app",
    status: "Contacted",
    owner: "Sara Ahmed",
    createdAt: "2025-11-28T10:30:00Z",
    gradeInterest: "Grade 5",
  },
  {
    id: "L032",
    name: "Mariam Ali",
    phone: "050-234-5681",
    channel: "Referral",
    status: "Contacted",
    owner: "Mohammed Khalil",
    createdAt: "2025-11-20T13:15:00Z",
    gradeInterest: "Grade 6",
  },
  {
    id: "L033",
    name: "Khalid Hassan",
    phone: "050-345-6782",
    email: "khalid.h@email.com",
    channel: "Walk-in",
    status: "New",
    owner: "Sara Ahmed",
    createdAt: "2025-11-15T09:00:00Z",
    gradeInterest: "Grade 3",
  },

  // Week 6 (Jan 7-6) - Remove older data beyond 12 weeks
];

let activities: ActivityLogItem[] = [
  {
    id: "A001",
    leadId: "L001",
    type: "StatusChange",
    message: "Lead status changed to New",
    createdAt: "2024-02-10T09:00:00Z",
    createdBy: "System",
  },
  {
    id: "A002",
    leadId: "L002",
    type: "Call",
    message: "Initial phone call made. Parent interested in Grade 3 admission.",
    createdAt: "2024-02-09T15:00:00Z",
    createdBy: "Mohammed Khalil",
  },
  {
    id: "A003",
    leadId: "L002",
    type: "StatusChange",
    message: "Lead status changed to Contacted",
    createdAt: "2024-02-09T15:05:00Z",
    createdBy: "Mohammed Khalil",
  },
  {
    id: "A004",
    leadId: "L003",
    type: "WhatsApp",
    message: "Sent school brochure and fee structure via WhatsApp",
    createdAt: "2024-02-08T12:00:00Z",
    createdBy: "Sara Ahmed",
  },
];

let notes: Note[] = [
  {
    id: "N001",
    leadId: "L001",
    body: "Parent inquired about extracurricular activities and transportation services.",
    createdAt: "2024-02-10T10:30:00Z",
    createdBy: "Sara Ahmed",
  },
  {
    id: "N002",
    leadId: "L002",
    body: "Follow-up scheduled for next week to discuss enrollment process.",
    createdAt: "2024-02-09T15:30:00Z",
    createdBy: "Mohammed Khalil",
  },
];

// CRUD Operations for Leads
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

export const updateLead = (id: string, updates: Partial<Lead>): Lead | null => {
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return null;

  const oldLead = leads[index];
  leads[index] = { ...oldLead, ...updates };

  // Track status changes
  if (updates.status && updates.status !== oldLead.status) {
    addActivity({
      leadId: id,
      type: "StatusChange",
      message: `Lead status changed from ${oldLead.status} to ${updates.status}`,
      createdBy: updates.owner || oldLead.owner,
    });
  }

  return leads[index];
};

export const deleteLead = (id: string): boolean => {
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return false;

  leads.splice(index, 1);
  // Clean up related data
  activities = activities.filter((a) => a.leadId !== id);
  notes = notes.filter((n) => n.leadId !== id);
  return true;
};

// Activity Log Operations
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

// Notes Operations
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

// Convert Lead to Application (stub)
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

  // Update lead status to Contacted when converting
  updateLead(leadId, {
    status: "Contacted",
    notes: `Converted to application ${draft.id}`,
  });

  // Add activity
  addActivity({
    leadId: lead.id,
    type: "StatusChange",
    message: `Lead converted to application ${draft.id}`,
    createdBy: lead.owner,
  });

  return draft;
};
