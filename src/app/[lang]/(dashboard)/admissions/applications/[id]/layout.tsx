"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import ScheduleInterviewModal from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import DecisionModal from "@/features/admissions/decisions/components/DecisionModal";
import EnrollmentForm from "@/features/admissions/enrollment/components/EnrollmentForm";
import { useSectionTabs } from "@/hooks/useSectionTabs";
import { buildLocalePath } from "@/lib/routing/localePath";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import type { Application, DecisionType } from "@/features/admissions/types/admissions";
import { fetchApplicationById, submitApplication } from "@/features/admissions/applications/services/applicationsApiService";
import { createPlacementTest } from "@/features/admissions/tests/services/testsApiService";
import { createInterview } from "@/features/admissions/interviews/services/interviewsApiService";
import {
  createDecision,
  getDecisionFriendlyErrorMessage,
} from "@/features/admissions/decisions/services/decisionsApiService";
import {
  executeFullEnrollment,
  getEnrollmentFriendlyErrorMessage,
} from "@/features/admissions/enrollment/services/admissionsEnrollmentApiService";

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
  const lang = (params.lang as string) || "en";
  const { isReadOnly } = useAdmissionsYearTermContext();

  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const { activeTab, entityId: applicationId, handleTabClick } = useSectionTabs({
    basePath: ["admissions", "applications"],
    idParam: "id",
    tabs,
    defaultTab: "details",
  });

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);

  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;
    void fetchApplicationById(applicationId)
      .then((nextApplication) => {
        if (!cancelled) setApplication(nextApplication);
      })
      .catch((error) => {
        console.error("Failed to load application:", error);
        if (!cancelled) setApplication(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApplication(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const refreshApplication = async () => {
    if (!applicationId) return;
    setApplication(await fetchApplicationById(applicationId));
  };

  if (isLoadingApplication) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Application not found</p>
          <button
            onClick={() => router.push(buildLocalePath(lang, "admissions", "applications"))}
            className="mt-4 px-4 py-2 bg-[#036b80] text-white rounded-lg"
          >
            {t("header.back_to_applications")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <button
              onClick={() => router.push(buildLocalePath(lang, "admissions", "applications"))}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              {locale === "ar" ? <ArrowRight /> : <ArrowLeft />}
              <span className="text-sm font-medium">{t("header.back_to_applications")}</span>
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

        {isReadOnly && <AdmissionsReadOnlyBanner />}

        {/* Sticky Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          {isEnrolled ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                {t("actions.enrolled_status")}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              {application.status === "documents_pending" && (
                <button
                  disabled={isReadOnly}
                  onClick={async () => {
                    try {
                      await submitApplication(application.id);
                      await refreshApplication();
                    } catch (err) {
                      console.error("Failed to submit application:", err);
                      alert("Failed to submit application.");
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("actions.submit_application")}
                </button>
              )}
              <button
                disabled={isReadOnly}
                onClick={() => setIsScheduleTestOpen(true)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t("actions.schedule_test")}
              </button>
              <button
                disabled={isReadOnly}
                onClick={() => setIsScheduleInterviewOpen(true)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t("actions.schedule_interview")}
              </button>
              <button
                disabled={isReadOnly}
                onClick={() => setIsDecisionOpen(true)}
                className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t("actions.make_decision")}
              </button>
              {application.status === "accepted" && (
                <button
                  disabled={isReadOnly}
                  onClick={() => setIsEnrollmentOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("actions.enroll_student")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ScheduleTestModal
        isOpen={isScheduleTestOpen}
        onClose={() => setIsScheduleTestOpen(false)}
        onSubmit={async (data) => {
          await createPlacementTest({
            applicationId: application.id,
            studentName: application.studentName,
            date: data.date,
            time: data.time,
          });
          await refreshApplication();
          setIsScheduleTestOpen(false);
        }}
        studentName={application.studentName}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        onSubmit={async (data) => {
          await createInterview({
            applicationId: application.id,
            studentName: application.studentName,
            date: data.date,
            time: data.time,
            interviewerUserId: data.interviewerUserId,
            interviewerName: data.interviewerName,
            notes: data.notes,
          });
          await refreshApplication();
          setIsScheduleInterviewOpen(false);
        }}
        studentName={application.studentName}
      />

      <DecisionModal
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        onSubmit={async (decision: DecisionType, reason: string) => {
          try {
            await createDecision({
              applicationId: application.id,
              decision,
              reason,
            });
            await refreshApplication();
            setIsDecisionOpen(false);
          } catch (error) {
            alert(
              getDecisionFriendlyErrorMessage(error) ||
                "Failed to create decision. Please try again.",
            );
          }
        }}
        application={application}
      />

      <EnrollmentForm
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        onSubmit={async (data) => {
          try {
            // Directly create student + guardian + enrollment (skip handoff preview)
            await executeFullEnrollment({
              applicationId: application.id,
              studentName: application.studentName,
              classroomId: data.classroomId!,
              enrollmentDate: data.startDate,
              gradeId: data.gradeId,
              sectionId: data.sectionId,
            });

            setIsEnrolled(true);
            alert("Student enrolled successfully!");
            setIsEnrollmentOpen(false);
            await refreshApplication();
          } catch (error) {
            console.error("Failed to enroll:", error);
            alert(
              getEnrollmentFriendlyErrorMessage(error) ||
                "Failed to enroll student. Please try again.",
            );
          }
        }}
        application={application}
      />
    </div>
  );
}
