"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { LessonPlanSummary } from "@/features/academics/lesson-plans/services/lessonPlansService";

interface ProgressSummaryProps {
  summary: LessonPlanSummary;
}

export default function ProgressSummary({ summary }: ProgressSummaryProps) {
  const t = useTranslations("academics.lessonPlans.summary");

  const total =
    summary.totalPlanned +
    summary.totalInProgress +
    summary.totalDone +
    summary.totalSkipped;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("title")}</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Circle className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalPlanned}</p>
            <p className="text-xs text-gray-600">{t("planned")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{summary.totalInProgress}</p>
            <p className="text-xs text-gray-600">{t("inProgress")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{summary.totalDone}</p>
            <p className="text-xs text-gray-600">{t("done")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{summary.totalSkipped}</p>
            <p className="text-xs text-gray-600">{t("skipped")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {summary.completionPercentage}%
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-600">{t("totalLessons")}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t("completion")}</span>
          <span className="font-semibold text-gray-900">
            {summary.completionPercentage}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${summary.completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
