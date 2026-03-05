"use client";

import { useEffect, useState } from "react";
import { getLeadById } from "@/api/mockLeadsApi";
import LeadChatPanel from "@/features/admissions/leads/components/LeadChatPanel";
import type { Lead } from "@/features/admissions/leads/types/lead";

export default function LeadChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      const foundLead = getLeadById(id);
      setLead(foundLead || null);
    });
  }, [params]);

  if (!lead) return null;

  return (
    <LeadChatPanel
      leadId={lead.id}
      leadName={lead.name}
      leadPhone={lead.phone}
      leadEmail={lead.email || ""}
      onMessagesRead={() => {}}
    />
  );
}
