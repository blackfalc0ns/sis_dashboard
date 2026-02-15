// FILE: src/components/leads/LeadDetails.tsx

"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";
import ActivityLog from "@/components/leads/ActivityLog";
import NotesPanel from "@/components/leads/NotesPanel";
import LeadChatPanel from "@/components/leads/LeadChatPanel";
import TabNavigation from "@/components/admissions/TabNavigation";
import {
  getLeadById,
  getActivitiesByLeadId,
  getNotesByLeadId,
  addActivity,
  addNote,
  convertLeadToApplication,
} from "@/api/mockLeadsApi";
import { getConversationByLeadId } from "@/data/mockLeadMessages";
import { Lead, ActivityType } from "@/types/leads";

interface LeadDetailsProps {
  leadId: string;
}

export default function LeadDetails({ leadId }: LeadDetailsProps) {
  const router = useRouter();
  const t = useTranslations("admissions.lead_details");
  const t_leads = useTranslations("admissions.leads");
  const t_grades = useTranslations("admissions.grades");
  const locale = useLocale();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState(getActivitiesByLeadId(leadId));
  const [notes, setNotes] = useState(getNotesByLeadId(leadId));
  const [activeTab, setActiveTab] = useState("overview");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadLead = () => {
      const foundLead = getLeadById(leadId);
      if (foundLead) {
        setLead(foundLead);

        // Load unread message count
        const conversation = getConversationByLeadId(leadId);
        setUnreadCount(conversation?.unreadCount || 0);
      } else {
        alert("Lead not found");
        router.push(`/${locale}/admissions/leads`);
      }
    };
    loadLead();
  }, [leadId, router, locale]);

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  const handleAddActivity = (type: ActivityType, message: string) => {
    addActivity({
      leadId: lead.id,
      type,
      message,
      createdBy: String(lead.owner || "System"),
    });
    setActivities(getActivitiesByLeadId(leadId));
  };

  const handleAddNote = (body: string) => {
    addNote({
      leadId: lead.id,
      body,
      createdBy: String(lead.owner || "System"),
    });
    setNotes(getNotesByLeadId(leadId));
  };

  const handleConvertToApplication = () => {
    if (confirm(`Convert lead "${lead.name}" to application?`)) {
      const draft = convertLeadToApplication(lead.id);
      alert(`Lead converted! Application draft created: ${draft.id}`);
      router.push(`/${locale}/admissions/applications`);
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/${locale}/admissions/leads`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={t("back_to_leads")}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
          <p className="text-sm text-gray-500">
            {t("lead_id")}: {lead.id}
          </p>
        </div>
        <LeadStatusBadge status={lead.status} size="md" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleConvertToApplication}
            className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("convert_to_application")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 pt-4">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
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
                      {lead.name}
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

              {/* Student Information */}
              {((lead.studentName as string | undefined) ||
                (lead.studentNameArabic as string | undefined)) && (
                <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    {t("student_information")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(lead.studentName as string | undefined) && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          {t("student_name_en")}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {String(lead.studentName)}
                        </p>
                      </div>
                    )}
                    {(lead.studentNameArabic as string | undefined) && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          {t("student_name_ar")}
                        </p>
                        <p
                          className="text-sm font-semibold text-gray-900"
                          dir="rtl"
                        >
                          {String(lead.studentNameArabic)}
                        </p>
                      </div>
                    )}
                    {lead.gradeInterest && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          {t("grade_interest")}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {(() => {
                            const grade = String(lead.gradeInterest);
                            const gradeKey = grade
                              .toLowerCase()
                              .replace(/\s+/g, "_");
                            const translated = t_grades(gradeKey);
                            return translated !== gradeKey ? translated : grade;
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  {lead.gradeInterest && (
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("grade_interest")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          const grade = String(lead.gradeInterest);
                          const gradeKey = grade
                            .toLowerCase()
                            .replace(/\s+/g, "_");
                          const translated = t_grades(gradeKey);
                          return translated !== gradeKey ? translated : grade;
                        })()}
                      </p>
                    </div>
                  )}
                  {lead.source && (
                    <div>
                      <p className="text-xs text-gray-500">{t("source")}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          const sourceMap: Record<string, string> = {
                            in_app: "in_app",
                            referral: "referral",
                            walk_in: "walk_in",
                            other: "other",
                          };
                          const source = String(lead.source).toLowerCase();
                          const translationKey = sourceMap[source] || "other";
                          return t_leads(translationKey);
                        })()}
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
              leadName={lead.name}
              leadPhone={lead.phone}
              leadEmail={lead.email || ""}
              onMessagesRead={() => setUnreadCount(0)}
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
    </div>
  );
}
