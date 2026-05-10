"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import LeadChatPanel from "@/features/admissions/leads/components/LeadChatPanel";
import { fetchLeadById } from "@/features/admissions/leads/services/leadsApiService";
import type { Lead } from "@/features/admissions/leads/types/lead";

export default function LeadChatPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLead = useCallback(async () => {
    setIsLoading(true);
    try {
      setLead(await fetchLeadById(leadId));
    } catch (error) {
      console.error("Failed to load lead chat:", error);
      router.push(`/${locale}/admissions/leads`);
    } finally {
      setIsLoading(false);
    }
  }, [leadId, locale, router]);

  useEffect(() => {
    void loadLead();
  }, [loadLead]);

  if (isLoading || !lead) {
    return <MainLoader />;
  }

  const leadName = lead.studentName || lead.primaryContactName || lead.name || "";

  return (
    <LeadChatPanel
      leadId={lead.id}
      leadName={leadName}
      leadPhone={lead.phone}
      leadEmail={lead.email || ""}
      onMessagesRead={() => {}}
    />
  );
}
