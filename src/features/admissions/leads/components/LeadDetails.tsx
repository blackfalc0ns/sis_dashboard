// FILE: src/components/leads/LeadDetails.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  Edit,
} from "lucide-react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import LeadStatusBadge from "@/features/admissions/leads/components/LeadStatusBadge";
import CreateLeadModal from "@/features/admissions/leads/components/CreateLeadModal";
import ActivityLog from "@/features/admissions/leads/components/ActivityLog";
import NotesPanel from "@/features/admissions/leads/components/NotesPanel";
import LeadChatPanel from "@/features/admissions/leads/components/LeadChatPanel";
import TabNavigation from "@/features/admissions/shared/TabNavigation";
import {
  fetchLeadById,
  updateLead,
  convertLead,
} from "@/features/admissions/leads/services/leadsApiService";
import { Lead, ActivityType } from "@/features/admissions/types/leads";
import type {
  ActivityLogItem,
  Note,
  UpdateLeadPayload,
} from "@/features/admissions/leads/types/lead";
import { useToast } from "@/components/ui/toast/Toast";

interface LeadDetailsProps {
  leadId: string;
}

export default function LeadDetails({ leadId }: LeadDetailsProps) {
  const router = useRouter();
  const t = useTranslations("admissions.lead_details");
  const t_leads = useTranslations("admissions.leads");
  const locale = useLocale();
  const { showToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Activity log and notes are UI-ready stubs (no backend endpoint)
  const [activities] = useState<ActivityLogItem[]>([]);
  const [notes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [unreadCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadLead = useCallback(async () => {
    setIsLoading(true);
    try {
      const foundLead = await fetchLeadById(leadId);
      setLead(foundLead);
    } catch (err) {
      console.error("Failed to load lead:", err);
      showToast("Lead not found", "error");
      router.push(`/${locale}/admissions/leads`);
    } finally {
      setIsLoading(false);
    }
  }, [leadId, router, locale, showToast]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  if (isLoading || !lead) {
    return <MainLoader />;
  }

  const displayName = lead.studentName || lead.primaryContactName || lead.name || "";

  const handleAddActivity = (type: ActivityType, message: string) => {
    void type;
    void message;
    showToast("Activity log is not yet available from the API.", "info");
  };

  const handleAddNote = (body: string) => {
    void body;
    showToast("Notes are not yet available from the API.", "info");
  };

  const handleConvertToApplication = async () => {
    if (confirm(t("mark_converted_confirm", { name: displayName }))) {
      try {
        await convertLead(lead.id);
        showToast(t("marked_converted"), "success");
        // Reload to reflect updated status
        await loadLead();
      } catch (err) {
        console.error("Failed to convert lead:", err);
        showToast(t("mark_converted_failed"), "error");
      }
    }
  };

  const handleUpdateLead = async (data: UpdateLeadPayload) => {
    try {
      const updatedLead = await updateLead(lead.id, data);
      setLead(updatedLead);
      showToast(t_leads("lead_updated"), "success");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update lead:", err);
      showToast(t_leads("update_failed"), "error");
      throw err;
    }
  };

  const tabs = [
    {
      id: "chat",
      label: t("messages"),
      icon: <MessageCircle className="w-4 h-4" />,
      badge: unreadCount,
    },
    {
      id: "overview",
      label: t("overview"),
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "activity",
      label: t("activity_log"),
      icon: <TrendingUp className="w-4 h-4" />,
    },
    { id: "notes", label: t("notes"), icon: <Tag className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.push(`/${locale}/admissions/leads`)}
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
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-500">
            {t("lead_id")}: {lead.id}
          </p>
        </div>
        <LeadStatusBadge status={lead.status} size="md" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 pt-4 flex items-center justify-between">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Edit className="h-4 w-4" />
              {t_leads("edit")}
            </button>
            <button
              onClick={handleConvertToApplication}
              className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("mark_converted")}
            </button>
          </div>
        </div>

        <div className="px-6 py-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Guardian/Parent Contact Information */}
              <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  {t("guardian_parent_contact")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      {t("guardian_name")}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {lead.primaryContactName || displayName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {t("phone")}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {lead.phone}
                    </p>
                  </div>
                  {lead.email && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {t("email")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {lead.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {t("lead_details")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{t("lead_id")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("status")}</p>
                    <div className="mt-1">
                      <LeadStatusBadge status={lead.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("channel")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        const channelMap: Record<string, string> = {
                          "In-app": "in_app",
                          Referral: "referral",
                          "Walk-in": "walk_in",
                          Other: "other",
                        };
                        const translationKey =
                          channelMap[lead.channel] || "other";
                        return t_leads(translationKey);
                      })()}
                    </p>
                  </div>
                  {lead.studentName && (
                    <div>
                      <p className="text-xs text-gray-500">
                        Student Name
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.studentName}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {t("created")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <LeadChatPanel
              leadId={lead.id}
              leadName={displayName}
              leadPhone={lead.phone}
              leadEmail={lead.email || ""}
              onMessagesRead={() => {}}
            />
          )}

          {activeTab === "activity" && (
            <ActivityLog
              activities={activities}
              onAddActivity={handleAddActivity}
            />
          )}

          {activeTab === "notes" && (
            <NotesPanel notes={notes} onAddNote={handleAddNote} />
          )}
        </div>
      </div>

      <CreateLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateLead}
        initialLead={lead}
        mode="update"
      />
    </div>
  );
}
