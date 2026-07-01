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
  MessageCircle,
  ArrowRight,
  Edit,
} from "lucide-react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import LeadStatusBadge from "@/features/admissions/leads/components/LeadStatusBadge";
import CreateLeadModal from "@/features/admissions/leads/components/CreateLeadModal";
import ApplicationCreateStepper from "@/features/admissions/applications/components/ApplicationCreateStepper";
import LeadChatPanel from "@/features/admissions/leads/components/LeadChatPanel";
import TabNavigation from "@/features/admissions/shared/TabNavigation";
import { Button } from "@/components/ui";
import {
  fetchLeadById,
  updateLead,
} from "@/features/admissions/leads/services/leadsApiService";
import { Lead } from "@/features/admissions/types/leads";
import type {
  UpdateLeadPayload,
} from "@/features/admissions/leads/types/lead";
import {
  mapLeadChannelToApplicationSource,
  type ApplicationCreationPayload,
} from "@/features/admissions/applications/services/applicationCreationService";
import { createApplication } from "@/features/admissions/applications/services/applicationsApiService";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [unreadCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateApplicationOpen, setIsCreateApplicationOpen] = useState(false);

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

  const handleConvertToApplication = () => {
    setIsCreateApplicationOpen(true);
  };

  const handleCreateApplicationFromLead = async (
    data: ApplicationCreationPayload,
  ) => {
    try {
      const createdApplication = await createApplication({
        ...data,
        leadId: lead.id,
        source: mapLeadChannelToApplicationSource(lead.channel),
      });
      await updateLead(lead.id, { status: "Converted" });
      showToast(t("marked_converted"), "success");
      setIsCreateApplicationOpen(false);
      router.push(`/${locale}/admissions/applications/${createdApplication.id}`);
    } catch (err) {
      console.error("Failed to create application from lead:", err);
      showToast(t("mark_converted_failed"), "error");
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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          type="button"
          onClick={() => router.push(`/${locale}/admissions/leads`)}
          variant="ghost"
          size="sm"
          className="p-2"
          title={t("back_to_leads")}
          aria-label={t("back_to_leads")}
        >
          {locale === "ar" ? (
            <ArrowRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          )}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
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
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
              size="sm"
              leftIcon={<Edit className="h-4 w-4" />}
            >
              {t_leads("edit")}
            </Button>
            <Button
              type="button"
              onClick={handleConvertToApplication}
              size="sm"
            >
              {t("mark_converted")}
            </Button>
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
        </div>
      </div>

      <CreateLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateLead}
        initialLead={lead}
        mode="update"
      />
      <ApplicationCreateStepper
        lead={lead}
        isOpen={isCreateApplicationOpen}
        onClose={() => setIsCreateApplicationOpen(false)}
        onSubmit={handleCreateApplicationFromLead}
      />
    </div>
  );
}
