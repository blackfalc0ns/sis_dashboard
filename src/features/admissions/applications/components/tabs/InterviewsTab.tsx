"use client";

import { useTranslations } from "next-intl";
import { Application } from "@/features/admissions/types/admissions";
import { StatusBadge } from "@/features/admissions/shared";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";

interface InterviewsTabProps {
  application: Application;
  onScheduleInterview: () => void;
}

export default function InterviewsTab({
  application,
  onScheduleInterview,
}: InterviewsTabProps) {
  const t = useTranslations("admissions.application360");
  const { isReadOnly } = useAdmissionsYearTermContext();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("interviews.title")}</h3>
        <button
          onClick={onScheduleInterview}
          disabled={isReadOnly}
          className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t("interviews.schedule_interview")}
        </button>
      </div>
      {application.interviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          {t("interviews.no_interviews")}
        </p>
      ) : (
        <div className="space-y-2">
          {application.interviews.map((interview) => (
            <div
              key={interview.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("interviews.interview_with")} {interview.interviewer}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {interview.date} {t("interviews.at")} {interview.time} •{" "}
                    {interview.location}
                  </p>
                  {interview.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      {interview.notes}
                    </p>
                  )}
                  {interview.rating && (
                    <p className="text-sm font-medium text-primary mt-2">
                      {t("interviews.rating")}: {interview.rating}/5
                    </p>
                  )}
                </div>
                <StatusBadge status={interview.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
