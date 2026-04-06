"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Phone, Mail, Calendar, Tag } from "lucide-react";
import { getLeadById, convertLeadToApplication } from "@/api/mockLeadsApi";
import LeadStatusBadge from "@/features/admissions/leads/components/LeadStatusBadge";

export default function LeadOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("admissions.lead_details");
  const t_leads = useTranslations("admissions.leads");
  const leadId = params.id as string;
  const lang = (params.lang as string) || "en";

  const lead = useMemo(() => getLeadById(leadId), [leadId]);

  if (!lead) return null;

  const handleConvertToApplication = () => {
    if (confirm(`Convert lead "${lead.name}" to application?`)) {
      const draft = convertLeadToApplication(lead.id);
      alert(`Lead converted! Application draft created: ${draft.id}`);
      router.push(`/${lang}/admissions/applications`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={handleConvertToApplication}
          className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t("convert_to_application")}
        </button>
      </div>

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
            <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
              <Phone className="w-3 h-3" /> {t("phone")}
            </p>
            <p className="text-sm font-semibold text-gray-900">{lead.phone}</p>
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
            <p className="text-sm font-medium text-gray-900">{lead.id}</p>
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
                const translationKey = channelMap[lead.channel] || "other";
                return t_leads(translationKey);
              })()}
            </p>
          </div>

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
  );
}
