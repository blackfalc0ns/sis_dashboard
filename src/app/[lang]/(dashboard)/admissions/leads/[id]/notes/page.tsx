"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getNotesByLeadId, addNote, getLeadById } from "@/api/mockLeadsApi";
import NotesPanel from "@/features/admissions/leads/components/NotesPanel";

export default function LeadNotesPage() {
  const params = useParams();
  const leadId = params.id as string;

  const lead = useMemo(() => getLeadById(leadId), [leadId]);
  const [notes, setNotes] = useState(getNotesByLeadId(leadId));

  if (!lead) return null;

  const handleAddNote = (body: string) => {
    addNote({
      leadId: lead.id,
      body,
      createdBy: String(lead.owner || "System"),
    });
    setNotes(getNotesByLeadId(leadId));
  };

  return <NotesPanel notes={notes} onAddNote={handleAddNote} />;
}
