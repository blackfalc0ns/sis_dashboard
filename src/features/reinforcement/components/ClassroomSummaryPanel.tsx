"use client";

import { Building2, Coins, GraduationCap, ListChecks } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ClassroomReinforcementSummary,
  ReinforcementTask,
  XpSummary,
} from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getText = (record: unknown, locale: string): string | undefined => {
  if (!isRecord(record)) return undefined;
  const keys =
    locale === "ar"
      ? ["nameAr", "titleAr", "full_name_ar", "fullNameAr", "name"]
      : ["nameEn", "titleEn", "full_name_en", "fullNameEn", "name"];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  const fallback = record.id || record.studentId || record.classroomId;
  return typeof fallback === "string" ? fallback : undefined;
};

const toLabel = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toValue = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "-";
};

const taskTitle = (task: ReinforcementTask, locale: string): string =>
  locale === "ar"
    ? task.titleAr || task.titleEn || task.id
    : task.titleEn || task.titleAr || task.id;

const statusLabel = (status: unknown, locale: string): string => {
  const value = typeof status === "string" ? status : "";
  const labels: Record<string, { en: string; ar: string }> = {
    cancelled: { en: "Cancelled", ar: "ملغي" },
    completed: { en: "Completed", ar: "مكتمل" },
    in_progress: { en: "In progress", ar: "قيد التنفيذ" },
    not_completed: { en: "Not completed", ar: "غير مكتمل" },
  };
  return labels[value]?.[locale === "ar" ? "ar" : "en"] || value;
};

function SummaryGrid({
  summary,
  emptyMessage,
}: {
  summary?: Record<string, unknown>;
  emptyMessage: string;
}) {
  if (!isRecord(summary) || Object.keys(summary).length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Object.entries(summary).slice(0, 9).map(([key, value]) => (
        <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
          <div className="text-xs font-medium uppercase text-gray-500">
            {toLabel(key)}
          </div>
          <div className="mt-1 text-base font-semibold text-gray-900">
            {toValue(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function XpSummaryBlock({ xpSummary }: { xpSummary?: XpSummary }) {
  const t = useTranslations("reinforcement.xp");
  const rows = [
    ["totalXp", xpSummary?.totalXp],
    ["earnedXp", xpSummary?.earnedXp],
    ["spentXp", xpSummary?.spentXp],
    ["balance", xpSummary?.balance],
    ["ledgerCount", xpSummary?.ledgerCount],
  ].filter(([, value]) => value !== undefined && value !== null);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-gray-900">
          {t("summaryTitle")}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {rows.map(([key, value]) => (
          <div key={key as string} className="rounded-lg bg-gray-50 px-3 py-3">
            <div className="text-xs font-medium uppercase text-gray-500">
              {toLabel(key as string)}
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {toValue(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface ClassroomSummaryPanelProps {
  summary: ClassroomReinforcementSummary;
}

export default function ClassroomSummaryPanel({
  summary,
}: ClassroomSummaryPanelProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const tasks = Array.isArray(summary.tasks) ? summary.tasks : [];
  const students = Array.isArray(summary.students) ? summary.students : [];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-900">
            {t("overview.classroomSummary")}
          </h2>
        </div>
        <SummaryGrid
          summary={summary.summary}
          emptyMessage={t("emptyStates.classroomSummary")}
        />
      </section>

      <XpSummaryBlock xpSummary={summary.xpSummary} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              {t("overview.relatedTasks")}
            </h2>
          </div>
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
              {t("emptyStates.tasks")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.slice(0, 10).map((task) => (
                <div key={task.id} className="py-3">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {taskTitle(task, locale)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {statusLabel(task.status, locale) || task.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              {t("overview.students")}
            </h2>
          </div>
          {students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
              {t("emptyStates.studentProgress")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.slice(0, 10).map((student, index) => (
                <div
                  key={
                    isRecord(student) &&
                    typeof (student.id || student.studentId) === "string"
                      ? String(student.id || student.studentId)
                      : index
                  }
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                    {getText(student, locale) || `${t("common.student")} ${index + 1}`}
                  </span>
                  {isRecord(student) && "xp" in student ? (
                    <span className="text-xs font-semibold text-primary">
                      {toValue(student.xp)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
