// FILE: src/app/[lang]/admissions/leads/[id]/page.tsx

"use client";

import { useParams } from "next/navigation";
import LeadDetails from "@/components/leads/LeadDetails";

export default function LeadDetailsPage() {
  const params = useParams();
  const leadId = params.id as string;

  return (
    <main className="flex-1 p-6">
      <LeadDetails leadId={leadId} />
    </main>
  );
}
