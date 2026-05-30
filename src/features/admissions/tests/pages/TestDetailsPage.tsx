"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import TestScoreModal from "@/features/admissions/tests/components/TestScoreModal";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import MainLoader from "@/components/ui/loaders/MainLoader";
import {
  fetchPlacementTestById,
  completePlacementTest,
  updatePlacementTest,
} from "@/features/admissions/tests/services/testsApiService";
import type { Test } from "@/features/admissions/types/admissions";
import { useToast } from "@/components/ui/toast/Toast";

interface TestDetailsPageProps {
  testId: string;
}

export default function TestDetailsPage({ testId }: TestDetailsPageProps) {
  const t = useTranslations("admissions.tests");
  const locale = useLocale();
  const router = useRouter();
  const { isReadOnly } = useAdmissionsYearTermContext();
  const { showToast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const loadTest = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPlacementTestById(testId);
      setTest(data);
    } catch (err) {
      console.error("Failed to load test:", err);
      console.error("Test ID was:", testId);
      setTest(null);
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    void loadTest();
  }, [loadTest]);

  if (isLoading) {
    return <MainLoader />;
  }

  if (!test) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Test not found</p>
          <button
            onClick={() => router.push(`/${locale}/admissions/tests`)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const studentName = test.studentName || "";

  const handleAddScore = () => {
    if (isReadOnly) return;
    setIsScoreModalOpen(true);
  };

  const handleScoreSubmit = async (
    _testId: string,
    score: number,
    _maxScore: number,
    status: "completed" | "failed",
    notes?: string,
  ) => {
    try {
      await completePlacementTest(testId, { score, status, notes });
      showToast("Test score saved successfully!", "success");
      setIsScoreModalOpen(false);
      await loadTest();
    } catch (err) {
      console.error("Failed to save score:", err);
      showToast("Failed to save test score.", "error");
    }
  };

  const handleReschedule = () => {
    if (isReadOnly) return;
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (data: {
    date: string;
    time: string;
    [key: string]: unknown;
  }) => {
    try {
      await updatePlacementTest(testId, {
        date: data.date,
        time: data.time,
      });
      showToast("Test rescheduled successfully!", "success");
      setIsRescheduleModalOpen(false);
      await loadTest();
    } catch (err) {
      console.error("Failed to reschedule test:", err);
      showToast("Failed to reschedule test.", "error");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "scheduled":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "rescheduled":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <button
              onClick={() => router.push(`/${locale}/admissions/tests`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              {locale === "ar" ? <ArrowRight /> : <ArrowLeft />}
              <span className="text-sm font-medium">
                {t("details.back_to_tests")}
              </span>
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("details.title")} {test.id}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {studentName} • {test.type}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <StatusBadge status={test.status} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Test Details */}
        {isReadOnly && <AdmissionsReadOnlyBanner />}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {t("details.test_information")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date & Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("details.date_time")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{t("details.date")}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.scheduledAt
                      ? new Date(test.scheduledAt).toLocaleDateString(locale, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("details.time")}</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {test.scheduledAt
                      ? new Date(test.scheduledAt).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t("details.test_info")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{t("details.type")}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.type}
                  </p>
                </div>
                {test.subjectName && (
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("details.subject")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {test.subjectName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Application</p>
                  <button
                    onClick={() =>
                      router.push(
                        `/${locale}/admissions/applications/${test.applicationId}`,
                      )
                    }
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {test.applicationId}
                  </button>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("details.student_information")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.student_name")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentName || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score & Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("details.score_notes")}
            </h2>
            {test.status !== "cancelled" && (
              <button
                onClick={handleAddScore}
                disabled={isReadOnly}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                {test.score !== undefined
                  ? t("details.update_score")
                  : t("details.add_score")}
              </button>
            )}
          </div>

          {test.score !== undefined && test.score !== null ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">
                  {t("details.score")}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {test.score}
                  </span>
                  <span
                    className={`ml-4 text-sm font-medium ${
                      test.status === "completed"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {test.status === "completed" ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>

              {test.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-xs text-gray-500">
                      {t("details.notes")}
                    </p>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {test.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {test.status === "cancelled"
                  ? t("details.score_not_available_cancelled")
                  : t("details.no_score_yet")}
              </p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          <div className="flex items-center gap-3 flex-wrap">
            {(test.status === "scheduled" || test.status === "rescheduled") && (
              <button
                onClick={handleReschedule}
                disabled={isReadOnly}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t("actions.reschedule")}
              </button>
            )}
            {(test.status === "scheduled" ||
              test.status === "rescheduled" ||
              test.status === "completed" ||
              test.status === "failed") &&
              test.score === undefined && (
                <button
                  onClick={handleAddScore}
                  disabled={isReadOnly}
                  className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("actions.add_score")}
                </button>
              )}
            <button
              onClick={() =>
                router.push(
                  `/${locale}/admissions/applications/${test.applicationId}`,
                )
              }
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.view_application")}
            </button>
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {test && (
        <TestScoreModal
          test={{
            ...test,
            studentName,
          }}
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          onSubmit={handleScoreSubmit}
        />
      )}

      {/* Reschedule Modal */}
      <ScheduleTestModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onSubmit={handleRescheduleSubmit}
        studentName={studentName}
      />
    </div>
  );
}
