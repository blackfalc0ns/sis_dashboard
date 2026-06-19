"use client";

import { useTranslations } from "next-intl";
import type { LessonPlanSummary } from "../services/lessonPlansService";

export default function ProgressSummary({
  summary,
}: {
  summary: LessonPlanSummary;
}) {
  const t = useTranslations("academics.lessonPlans.summary");
  const stats = [
    [t("plans"), summary.lessonPlansCount],
    [t("totalLessons"), summary.itemsCount],
    [t("planned"), summary.plannedItemsCount],
    [t("done"), summary.completedItemsCount],
    [t("unplanned"), summary.unplannedLessonsCount],
  ] as const;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{t("title")}</h3>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map(([label, count]) => (
          <div key={label}>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{t("coverage")}</span>
        <span className="font-semibold">{summary.coveragePercent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${summary.coveragePercent}%` }}
        />
      </div>
    </div>
  );
}
