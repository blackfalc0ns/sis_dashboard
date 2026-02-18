"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  User,
  FileCheck,
} from "lucide-react";
import { mockApplications } from "@/data/mockAdmissions";
import StatusBadge from "@/components/admissions/shared/StatusBadge";
import ScheduleTestModal from "@/components/admissions/modals/ScheduleTestModal";
import ScheduleInterviewModal from "@/components/admissions/modals/ScheduleInterviewModal";
import DecisionModal from "@/components/admissions/modals/DecisionModal";
import EnrollmentForm from "@/components/admissions/forms/EnrollmentForm";

const tabs = [
  { key: "details", labelKey: "tabs.details", icon: FileText },
  { key: "guardians", labelKey: "tabs.guardians", icon: User },
  { key: "documents", labelKey: "tabs.documents", icon: FileCheck },
  { key: "tests", labelKey: "tabs.tests", icon: ClipboardCheck },
  { key: "interviews", labelKey: "tabs.interviews", icon: MessageSquare },
  { key: "timeline", labelKey: "tabs.timeline", icon: Calendar },
];

export default function ApplicationProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const lang = (params.lang as string) || "en";
  const applicationId = params.id as string;

  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  const application = useMemo(() => {
    return mockApplications.find((app) => app.id === applicationId);
  }, [applicationId]);

  const activeTab = useMemo(() => {
    const pathParts = pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart === applicationId) {
      return "details";
    }
    return lastPart;
  }, [pathname, applicationId]);

  if (!application) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Application not found</p>
          <button
            onClick={() => router.push(`/${lang}/admissions/applications`)}
            className="mt-4 px-4 py-2 bg-[#036b80] text-white rounded-lg"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const handleTabClick = (tabKey: string) => {
    const path =
      tabKey === "details"
        ? `/${lang}/admissions/applications/${applicationId}`
        : `/${lang}/admissions/applications/${applicationId}/${tabKey}`;
    startTransition(() => {
      router.push(path, { scroll: false });
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <button
              onClick={() => router.push(`/${lang}/admissions/applications`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              {locale === "ar" ? <ArrowRight /> : <ArrowLeft />}
              <span className="text-sm font-medium">Back to Applications</span>
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("header.title")} {application.id}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {application.studentName} - {application.gradeRequested}
                </p>
              </div>
              <StatusBadge status={application.status} size="md" />
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabClick(tab.key)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-[#036b80] text-[#036b80]"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">{children}</div>

        {/* Sticky Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsScheduleTestOpen(true)}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.schedule_test")}
            </button>
            <button
              onClick={() => setIsScheduleInterviewOpen(true)}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.schedule_interview")}
            </button>
            <button
              onClick={() => setIsDecisionOpen(true)}
              className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.make_decision")}
            </button>
            {application.status === "accepted" && (
              <button
                onClick={() => setIsEnrollmentOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t("actions.enroll_student")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScheduleTestModal
        isOpen={isScheduleTestOpen}
        onClose={() => setIsScheduleTestOpen(false)}
        onSubmit={(data) => {
          console.log("Schedule test:", data);
          setIsScheduleTestOpen(false);
        }}
        studentName={application.studentName}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        onSubmit={(data) => {
          console.log("Schedule interview:", data);
          setIsScheduleInterviewOpen(false);
        }}
        studentName={application.studentName}
      />

      <DecisionModal
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        onSubmit={(data) => {
          console.log("Make decision:", data);
          setIsDecisionOpen(false);
        }}
        application={application}
      />

      <EnrollmentForm
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        onSubmit={(data) => {
          console.log("Enroll student:", data);
          setIsEnrollmentOpen(false);
        }}
        application={application}
      />
    </div>
  );
}
