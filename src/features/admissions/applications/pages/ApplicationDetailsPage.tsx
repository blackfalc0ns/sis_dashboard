"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  User,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import TabNavigation from "@/features/admissions/shared/TabNavigation";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import ScheduleInterviewModal, {
  type ScheduleInterviewFormData,
} from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import DecisionModal from "@/features/admissions/decisions/components/DecisionModal";
import EnrollmentForm from "@/features/admissions/enrollment/components/EnrollmentForm";
import DetailsTab from "@/features/admissions/applications/components/tabs/DetailsTab";
import GuardiansTab from "@/features/admissions/applications/components/tabs/GuardiansTab";
import DocumentsTab from "@/features/admissions/applications/components/tabs/DocumentsTab";
import TestsTab from "@/features/admissions/applications/components/tabs/TestsTab";
import InterviewsTab from "@/features/admissions/applications/components/tabs/InterviewsTab";
import TimelineTab from "@/features/admissions/applications/components/tabs/TimelineTab";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import type { Application, DecisionType } from "@/features/admissions/types/admissions";
import {
  fetchApplicationById,
  submitApplication,
} from "@/features/admissions/applications/services/applicationsApiService";
import { createPlacementTest } from "@/features/admissions/tests/services/testsApiService";
import { createInterview } from "@/features/admissions/interviews/services/interviewsApiService";
import {
  createDecision,
  getDecisionFriendlyErrorMessage,
} from "@/features/admissions/decisions/services/decisionsApiService";
import {
  createEnrollmentHandoffPreview,
  getEnrollmentFriendlyErrorMessage,
} from "@/features/admissions/enrollment/services/admissionsEnrollmentApiService";

interface ApplicationDetailsPageProps {
  applicationId: string;
}

export default function ApplicationDetailsPage({
  applicationId,
}: ApplicationDetailsPageProps) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const router = useRouter();
  const normalizeQueryValues = useCallback(
    (values: Record<"tab", string>) => {
      const validTabs = new Set([
        "details",
        "guardians",
        "documents",
        "tests",
        "interviews",
        "timeline",
      ]);

      return validTabs.has(values.tab) ? null : { tab: null };
    },
    [],
  );
  const { values, setValue } = useAdmissionsUrlQueryState<{
    tab: string;
  }>({
    defaults: {
      tab: "details",
    },
    normalize: normalizeQueryValues,
  });
  const activeTab = values.tab;

  // Modal states
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplication = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setApplication(await fetchApplicationById(applicationId));
    } catch (loadError) {
      console.error("Failed to load application:", loadError);
      setApplication(null);
      setError("Application not found");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  if (isLoading) {
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
          <p className="text-gray-500">{error || "Application not found"}</p>
          <button
            onClick={() => router.push(`/${locale}/admissions/applications`)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "details",
      label: t("tabs.details"),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "guardians",
      label: t("tabs.guardians"),
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "documents",
      label: t("tabs.documents"),
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      id: "tests",
      label: t("tabs.tests"),
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: "interviews",
      label: t("tabs.interviews"),
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "timeline",
      label: t("tabs.timeline"),
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setValue("tab", tabId, "push");
  };

  const handleScheduleTest = () => {
    setIsScheduleTestOpen(true);
  };

  const handleScheduleInterview = () => {
    setIsScheduleInterviewOpen(true);
  };

  const handleMakeDecision = () => {
    setIsDecisionOpen(true);
  };

  const handleEnroll = () => {
    setIsEnrollmentOpen(true);
  };

  const handleSubmitApplication = async () => {
    try {
      const updated = await submitApplication(application.id);
      setApplication(updated);
      alert("Application submitted successfully.");
    } catch (submitError) {
      console.error("Failed to submit application:", submitError);
      alert("Failed to submit application. Please try again.");
    }
  };

  const handleScheduleTestSubmit = async (data: {
    date: string;
    time: string;
    type: string;
    notes: string;
  }) => {
    try {
      await createPlacementTest({
        applicationId: application.id,
        studentName: application.studentName,
        date: data.date,
        time: data.time,
      });
      setIsScheduleTestOpen(false);
      await loadApplication();
    } catch (scheduleError) {
      console.error("Failed to schedule test:", scheduleError);
      alert("Failed to schedule test. Please try again.");
    }
  };

  const handleScheduleInterviewSubmit = async (
    data: ScheduleInterviewFormData,
  ) => {
    try {
      await createInterview({
        applicationId: application.id,
        studentName: application.studentName,
        date: data.date,
        time: data.time,
        interviewerUserId: data.interviewerUserId,
        interviewerName: data.interviewerName,
        notes: data.notes,
      });
      setIsScheduleInterviewOpen(false);
      await loadApplication();
    } catch (scheduleError) {
      console.error("Failed to schedule interview:", scheduleError);
      alert("Failed to schedule interview. Please try again.");
    }
  };

  const handleDecisionSubmit = async (
    decision: DecisionType,
    reason: string,
  ) => {
    try {
      await createDecision({
        applicationId: application.id,
        decision,
        reason,
      });
      setIsDecisionOpen(false);
      await loadApplication();
    } catch (decisionError) {
      console.error("Failed to create decision:", decisionError);
      alert(
        getDecisionFriendlyErrorMessage(decisionError) ||
          "Failed to create decision. Please try again.",
      );
    }
  };

  const handleEnrollmentSubmit = async () => {
    try {
      await createEnrollmentHandoffPreview(application.id);
      setIsEnrollmentOpen(false);
      alert("Enrollment handoff preview created successfully.");
    } catch (enrollmentError) {
      console.error("Failed to create enrollment handoff:", enrollmentError);
      alert(
        getEnrollmentFriendlyErrorMessage(enrollmentError) ||
          "Failed to create enrollment handoff. Please try again.",
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <button
              onClick={() => router.push(`/${locale}/admissions/applications`)}
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
          <div className="px-6">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {activeTab === "details" && <DetailsTab application={application} />}
          {activeTab === "guardians" && (
            <GuardiansTab application={application} />
          )}
          {activeTab === "documents" && (
            <DocumentsTab application={application} />
          )}
          {activeTab === "tests" && (
            <TestsTab
              application={application}
              onScheduleTest={handleScheduleTest}
            />
          )}
          {activeTab === "interviews" && (
            <InterviewsTab
              application={application}
              onScheduleInterview={handleScheduleInterview}
            />
          )}
          {activeTab === "timeline" && (
            <TimelineTab application={application} />
          )}
        </div>

        {/* Sticky Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSubmitApplication}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Submit Application
            </button>
            <button
              onClick={handleScheduleTest}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.schedule_test")}
            </button>
            <button
              onClick={handleScheduleInterview}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.schedule_interview")}
            </button>
            <button
              onClick={handleMakeDecision}
              className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.make_decision")}
            </button>
            {application.status === "accepted" && (
              <button
                onClick={handleEnroll}
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
        onSubmit={handleScheduleTestSubmit}
        studentName={application.studentName}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        onSubmit={handleScheduleInterviewSubmit}
        studentName={application.studentName}
      />

      <DecisionModal
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        onSubmit={handleDecisionSubmit}
        application={application}
      />

      <EnrollmentForm
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        onSubmit={handleEnrollmentSubmit}
        application={application}
      />
    </div>
  );
}
