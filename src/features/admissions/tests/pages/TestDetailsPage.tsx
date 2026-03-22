"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { mockApplications, mockTests } from "@/data/mockAdmissions";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import TestScoreModal from "@/features/admissions/tests/components/TestScoreModal";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";

interface TestDetailsPageProps {
  testId: string;
}

export default function TestDetailsPage({ testId }: TestDetailsPageProps) {
  const t = useTranslations("admissions.tests");
  const locale = useLocale();
  const router = useRouter();
  const { isReadOnly } = useAdmissionsYearTermContext();

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  // Find test from applications or standalone tests
  const findTestData = () => {
    // Check in applications first
    for (const app of mockApplications) {
      const test = app.tests.find((t) => t.id === testId);
      if (test) {
        return {
          test,
          application: app,
          studentName:
            locale === "ar"
              ? app.full_name_ar || app.studentNameArabic || app.studentName
              : app.full_name_en || app.studentName,
        };
      }
    }

    // Check standalone tests
    const standaloneTest = mockTests.find((t) => t.id === testId);
    if (standaloneTest) {
      const app = mockApplications.find(
        (a) => a.id === standaloneTest.applicationId,
      );
      return {
        test: standaloneTest,
        application: app,
        studentName:
          locale === "ar"
            ? app?.full_name_ar ||
              app?.studentNameArabic ||
              app?.studentName ||
              "Unknown"
            : app?.full_name_en || app?.studentName || "Unknown",
      };
    }

    return null;
  };

  const testData = findTestData();

  if (!testData) {
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

  const { test, application, studentName } = testData;

  const handleAddScore = () => {
    if (isReadOnly) return;
    setIsScoreModalOpen(true);
  };

  const handleScoreSubmit = (
    testId: string,
    score: number,
    maxScore: number,
    status: "completed" | "failed",
    notes?: string,
  ) => {
    console.log("Test score:", { testId, score, maxScore, status, notes });
    // In a real app, this would update the backend
    setIsScoreModalOpen(false);
    router.refresh();
  };

  const handleReschedule = () => {
    if (isReadOnly) return;
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = (data: {
    date: string;
    time: string;
    proctor: string;
    location: string;
    notes?: string;
  }) => {
    console.log("Rescheduling test:", { testId, ...data });
    // In a real app, this would update the backend
    setIsRescheduleModalOpen(false);
    router.refresh();
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
                    {new Date(test.date).toLocaleDateString(locale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("details.time")}</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {test.time}
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
                  <p className="text-xs text-gray-500">
                    {t("details.subject")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.subject}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("details.type")}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.duration")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.duration
                      ? `${test.duration} ${t("details.minutes")}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Proctor */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t("details.location_proctor")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.location")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.proctor")}
                  </p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {test.proctor || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.proctor_phone")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.proctorPhone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("details.guardian_info")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.guardian_name")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.guardianName || application?.guardianName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.guardian_phone")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {test.guardianPhone || application?.guardianPhone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Information */}
        {application && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {t("details.student_information")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.student_name")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.application_id")}
                  </p>
                  <button
                    onClick={() =>
                      router.push(
                        `/${locale}/admissions/applications/${application.id}`,
                      )
                    }
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {application.id}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.grade_requested")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {application.gradeRequested}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.application_status")}
                  </p>
                  <StatusBadge status={application.status} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score & Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("details.score_notes")}
            </h2>
            {/* Allow score entry for scheduled, rescheduled, or completed tests, but not cancelled */}
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

          {test.score !== undefined ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">
                  {t("details.score")}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {test.score}
                  </span>
                  <span className="text-lg text-gray-500">
                    / {test.maxScore || 100}
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
            {/* Show reschedule and cancel buttons only for scheduled/rescheduled tests */}
            {(test.status === "scheduled" || test.status === "rescheduled") && (
              <>
                <button
                  onClick={handleReschedule}
                  disabled={isReadOnly}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {t("actions.reschedule")}
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                  {t("actions.cancel")}
                </button>
              </>
            )}
            {/* Show add score button for scheduled, rescheduled, or completed tests without score */}
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
            {/* Always show view application button */}
            {application && (
              <button
                onClick={() =>
                  router.push(
                    `/${locale}/admissions/applications/${application.id}`,
                  )
                }
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t("actions.view_application")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {test && (
        <TestScoreModal
          test={{
            ...test,
            studentName,
            applicationId: application?.id || test.applicationId,
          }}
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          onSubmit={handleScoreSubmit}
        />
      )}

      {/* Reschedule Modal */}
      {test && application && (
        <ScheduleTestModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          onSubmit={handleRescheduleSubmit}
          studentName={studentName}
          guardianName={application.guardianName}
          guardianPhone={application.guardianPhone}
        />
      )}
    </div>
  );
}
