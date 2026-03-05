"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  User,
  MessageCircle,
  TrendingUp,
  Tag,
} from "lucide-react";
import { getLeadById } from "@/api/mockLeadsApi";
import { getConversationByLeadId } from "@/data/mockLeadMessages";
import LeadStatusBadge from "@/features/admissions/leads/components/LeadStatusBadge";
import { useSectionTabs } from "@/hooks/useSectionTabs";
import { buildLocalePath } from "@/lib/routing/localePath";

const tabs = [
  { key: "overview", labelKey: "overview", icon: User },
  { key: "chat", labelKey: "messages", icon: MessageCircle },
  { key: "activity", labelKey: "activity_log", icon: TrendingUp },
  { key: "notes", labelKey: "notes", icon: Tag },
];

export default function LeadProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("admissions.lead_details");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  const { activeTab, entityId: leadId, handleTabClick } = useSectionTabs({
    basePath: ["admissions", "leads"],
    idParam: "id",
    tabs,
  });

  const lead = useMemo(() => {
    return getLeadById(leadId);
  }, [leadId]);

  const unreadCount = useMemo(() => {
    const conversation = getConversationByLeadId(leadId);
    return conversation?.unreadCount || 0;
  }, [leadId]);

  // Add badge to chat tab
  const tabsWithBadges = useMemo(() => {
    return tabs.map((tab) => ({
      ...tab,
      badge: tab.key === "chat" ? unreadCount : undefined,
    }));
  }, [unreadCount]);

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">{t("lead_not_found")}</p>
          <button
            onClick={() => router.push(buildLocalePath(lang, "admissions", "leads"))}
            className="mt-4 text-[#036b80] hover:underline"
          >
            {t("back_to_leads")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(buildLocalePath(lang, "admissions", "leads"))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={t("back_to_leads")}
        >
          {locale === "ar" ? (
            <ArrowRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
          <p className="text-sm text-gray-500">
            {t("lead_id")}: {lead.id}
          </p>
        </div>
        <LeadStatusBadge status={lead.status} size="md" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabsWithBadges.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const badge = tab.badge;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative ${
                    isActive
                      ? "border-[#036b80] text-[#036b80]"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(tab.labelKey)}
                  {badge !== undefined && badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white border border-red-200 rounded-full">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
