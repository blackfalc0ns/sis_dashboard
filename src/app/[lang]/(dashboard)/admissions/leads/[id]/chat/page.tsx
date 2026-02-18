"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getLeadById } from "@/api/mockLeadsApi";
import LeadChatPanel from "@/components/leads/LeadChatPanel";

export default function LeadChatPage() {
  const params = useParams();
  const leadId = params.id as string;

  const lead = useMemo(() => getLeadById(leadId), [leadId]);

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
