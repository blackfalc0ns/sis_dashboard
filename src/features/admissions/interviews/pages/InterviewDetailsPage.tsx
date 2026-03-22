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
  Star,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { mockApplications, mockInterviews } from "@/data/mockAdmissions";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import InterviewRatingModal from "@/features/admissions/interviews/components/InterviewRatingModal";
import ScheduleInterviewModal from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";

interface InterviewDetailsPageProps {
  interviewId: string;
}

export default function InterviewDetailsPage({
  interviewId,
}: InterviewDetailsPageProps) {
  const t = useTranslations("admissions.interviews");
  const locale = useLocale();
  const router = useRouter();
  const { isReadOnly } = useAdmissionsYearTermContext();

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  // Find interview from applications or standalone interviews
  // React Compiler will optimize this automatically
  const findInterviewData = () => {
    // Check in applications first
    for (const app of mockApplications) {
      const interview = app.interviews.find((i) => i.id === interviewId);
      if (interview) {
        return {
          interview,
          application: app,
          studentName:
            locale === "ar"
              ? app.full_name_ar || app.studentNameArabic || app.studentName
              : app.full_name_en || app.studentName,
        };
      }
    }

    // Check standalone interviews
    const standaloneInterview = mockInterviews.find(
      (i) => i.id === interviewId,
    );
    if (standaloneInterview) {
      const app = mockApplications.find(
        (a) => a.id === standaloneInterview.applicationId,
      );
      return {
        interview: standaloneInterview,
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

  const interviewData = findInterviewData();

  if (!interviewData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Interview not found</p>
          <button
            onClick={() => router.push(`/${locale}/admissions/interviews`)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  const { interview, application, studentName } = interviewData;

  const handleRateInterview = () => {
    if (isReadOnly) return;
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = (
    interviewId: string,
    rating: number,
    notes?: string,
  ) => {
    console.log("Interview rating:", { interviewId, rating, notes });
    // In a real app, this would update the backend
    // For now, we'll just refresh to show the change
    setIsRatingModalOpen(false);
    router.refresh();
  };

  const handleReschedule = () => {
    if (isReadOnly) return;
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = (data: {
    date: string;
    time: string;
    interviewer: string;
    location: string;
    notes?: string;
  }) => {
    console.log("Rescheduling interview:", { interviewId, ...data });
    // In a real app, this would update the backend
    // For now, we'll just close the modal and refresh
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
              onClick={() => router.push(`/${locale}/admissions/interviews`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              {locale === "ar" ? <ArrowRight /> : <ArrowLeft />}
              <span className="text-sm font-medium">
                {t("details.back_to_interviews")}
              </span>
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("details.title")} {interview.id}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {studentName} • {application?.gradeRequested || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(interview.status)}
                <StatusBadge status={interview.status} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Interview Details */}
        {isReadOnly && <AdmissionsReadOnlyBanner />}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {t("details.interview_information")}
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
                    {new Date(interview.date).toLocaleDateString(locale, {
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
                    {interview.time}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.duration")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {interview.duration
                      ? `${interview.duration} ${t("details.minutes")}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Interviewer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t("details.location_interviewer")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.location")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {interview.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.interviewer")}
                  </p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {interview.interviewer}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.interviewer_phone")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {interview.interviewerPhone || "N/A"}
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
                    {interview.guardianName ||
                      application?.guardianName ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("details.guardian_phone")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {interview.guardianPhone ||
                      application?.guardianPhone ||
                      "N/A"}
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

        {/* Rating & Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("details.rating_notes")}
            </h2>
            {/* Allow rating for scheduled, rescheduled, or completed interviews */}
            {(interview.status === "scheduled" ||
              interview.status === "rescheduled" ||
              interview.status === "completed") && (
              <button
                onClick={handleRateInterview}
                disabled={isReadOnly}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                {interview.rating
                  ? t("details.update_rating")
                  : t("details.add_rating")}
              </button>
            )}
          </div>

          {interview.rating ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">
                  {t("details.rating")}
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= (interview.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-lg font-bold text-gray-900 ml-2">
                    {interview.rating}/5
                  </span>
                </div>
              </div>

              {interview.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-xs text-gray-500">
                      {t("details.notes")}
                    </p>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {interview.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {interview.status === "cancelled"
                  ? t("details.rating_not_available_cancelled")
                  : t("details.no_rating_yet")}
              </p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Show reschedule and cancel buttons only for scheduled/rescheduled interviews */}
            {(interview.status === "scheduled" ||
              interview.status === "rescheduled") && (
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
            {/* Show rate button for scheduled, rescheduled, or completed interviews without rating */}
            {(interview.status === "scheduled" ||
              interview.status === "rescheduled" ||
              interview.status === "completed") &&
              !interview.rating && (
                <button
                  onClick={handleRateInterview}
                  disabled={isReadOnly}
                  className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("actions.rate_interview")}
                </button>
              )}
            {/* Always show view application button except for cancelled interviews where it's the only button */}
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

      {/* Rating Modal */}
      {interview && (
        <InterviewRatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          onSubmit={handleRatingSubmit}
          interview={{
            ...interview,
            studentName,
            applicationId: application?.id || interview.applicationId,
          }}
        />
      )}

      {/* Reschedule Modal */}
      {interview && application && (
        <ScheduleInterviewModal
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
