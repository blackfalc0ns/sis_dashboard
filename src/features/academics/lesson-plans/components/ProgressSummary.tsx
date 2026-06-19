"use client";

import { useTranslations } from "next-intl";
import {
  BookOpen,
  CalendarRange,
  ChartNoAxesCombined,
  CircleCheck,
  Clock3,
  ListChecks,
} from "lucide-react";
import type { LessonPlanSummary } from "../services/lessonPlansService";

export default function ProgressSummary({
  summary,
}: {
  summary: LessonPlanSummary;
}) {
  const t = useTranslations("academics.lessonPlans.summary");
  const coverageWidth = Math.min(100, Math.max(0, summary.coveragePercent));
  const stats = [
    {
      key: "plans",
      label: t("lessonPlans"),
      value: summary.lessonPlansCount,
      icon: CalendarRange,
    },
    {
      key: "items",
      label: t("items"),
      value: summary.itemsCount,
      icon: ListChecks,
    },
    {
      key: "planned",
      label: t("planned"),
      value: summary.plannedItemsCount,
      icon: Clock3,
    },
    {
      key: "completed",
      label: t("completed"),
      value: summary.completedItemsCount,
      icon: CircleCheck,
    },
    {
      key: "unplanned",
      label: t("unplanned"),
      value: summary.unplannedLessonsCount,
      icon: BookOpen,
    },
    {
      key: "coverage",
      label: t("coverage"),
      value: `${summary.coveragePercent}%`,
      icon: ChartNoAxesCombined,
    },
  ] as const;

  return (
    <section className="space-y-3" aria-labelledby="lesson-plans-summary">
      <div className="flex items-center justify-between">
        <h2
          id="lesson-plans-summary"
          className="text-base font-semibold text-gray-900"
        >
          {t("title")}
        </h2>
        <span className="text-sm font-semibold text-primary">
          {summary.coveragePercent}%
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map(({ key, label, value, icon: Icon }) => (
          <div
            key={key}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div
        role="progressbar"
        aria-label={t("coverage")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={coverageWidth}
        className="h-2 overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${coverageWidth}%` }}
        />
      </div>
    </section>
  );
}
