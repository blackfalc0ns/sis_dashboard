"use client";

import { useParams } from "next/navigation";
import LeadDetails from "@/features/admissions/leads/components/LeadDetails";

export default function LeadOverviewPage() {
  const params = useParams();
  const leadId = params.id as string;

  return <LeadDetails leadId={leadId} />;
}
