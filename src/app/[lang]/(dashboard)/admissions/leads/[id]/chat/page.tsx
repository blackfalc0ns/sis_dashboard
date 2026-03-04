import { getLeadById } from "@/api/mockLeadsApi";
import LeadChatPanel from "@/components/features/leads/components/LeadChatPanel";

export default async function LeadChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = getLeadById(id);

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
