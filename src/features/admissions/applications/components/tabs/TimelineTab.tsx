"use client";

import { useTranslations } from "next-intl";
import { Application } from "@/features/admissions/types/admissions";

interface TimelineTabProps {
  application: Application;
}

export default function TimelineTab({ application }: TimelineTabProps) {
  const t = useTranslations("admissions.application360");

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{t("timeline.title")}</h3>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {t("timeline.application_submitted")}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(application.submittedDate).toLocaleString()}
            </p>
          </div>
        </div>
        {application.tests.map((test) => (
          <div key={test.id} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {test.subject} {t("timeline.test")}{" "}
                {test.status === "completed"
                  ? t("timeline.completed")
                  : t("timeline.scheduled")}
              </p>
              <p className="text-xs text-gray-500">{test.date}</p>
            </div>
          </div>
        ))}
        {application.interviews.map((interview) => (
          <div key={interview.id} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("timeline.interview")}{" "}
                {interview.status === "completed"
                  ? t("timeline.completed")
                  : t("timeline.scheduled")}
              </p>
              <p className="text-xs text-gray-500">{interview.date}</p>
            </div>
          </div>
        ))}
        {application.decision && (
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("timeline.decision")}:{" "}
                {application.decision.decision.toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                {application.decision.decisionDate}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
