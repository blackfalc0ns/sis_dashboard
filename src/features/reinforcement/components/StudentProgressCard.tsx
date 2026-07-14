"use client";

import { BookOpen, Coins, ListChecks } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ReinforcementCompactTask,
  StudentReinforcementProgress,
  XpSummary,
} from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toLabel = (key: string): string =>
  key
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toValue = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  return "-";
};

type Translator = ReturnType<typeof useTranslations>;

const localizedValue = (value: unknown, t: Translator): string => {
  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }

  return toValue(value);
};

const fieldLabel = (key: string, t: Translator): string =>
  typeof t.has === "function" && t.has(`progressFields.${key}`)
    ? t(`progressFields.${key}`)
    : toLabel(key);

const xpValue = (value: unknown, t: Translator): string =>
  `${toValue(value)} ${t("xp.unit")}`;

const localizedTaskTitle = (task: ReinforcementCompactTask, locale: string): string =>
  locale === "ar"
    ? task.titleAr || task.titleEn || task.id
    : task.titleEn || task.titleAr || task.id;

const translatedStatusLabel = (status: unknown, t: Translator): string => {
  const value = typeof status === "string" ? status : "";
  return value && typeof t.has === "function" && t.has(`status.${value}`)
    ? t(`status.${value}`)
    : value
      ? toLabel(value)
      : "";
};

const normalizeProgressSummary = (
  progress: StudentReinforcementProgress,
): Record<string, unknown> | undefined => {
  const summary: Record<string, unknown> = {};

  Object.entries(progress.assignments).forEach(([key, value]) => {
    summary[key] = value;
  });

  Object.entries(progress.submissions).forEach(([key, value]) => {
    summary[`submissions.${key}`] = value;
  });

  return Object.keys(summary).length > 0 ? summary : undefined;
};

const normalizeXpSummary = (
  progress: StudentReinforcementProgress,
): XpSummary => {
  const ledgerEntries = progress.xp.recentLedgerEntries;
  const earnedXp = ledgerEntries
    .filter((entry) => typeof entry.amount === "number" && entry.amount > 0)
    .reduce((total, entry) => total + (entry.amount as number), 0);
  const spentXp = Math.abs(
    ledgerEntries
      .filter((entry) => typeof entry.amount === "number" && entry.amount < 0)
      .reduce((total, entry) => total + (entry.amount as number), 0),
  );

  return {
    totalXp: progress.xp.totalXp,
    earnedXp: earnedXp || undefined,
    spentXp: spentXp || undefined,
    balance: progress.xp.totalXp,
    ledgerCount: ledgerEntries.length || undefined,
  };
};

function SummaryGrid({
  summary,
  emptyMessage,
}: {
  summary?: Record<string, unknown>;
  emptyMessage: string;
}) {
  const t = useTranslations("reinforcement");

  if (!isRecord(summary) || Object.keys(summary).length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Object.entries(summary)
        .slice(0, 9)
        .map(([key, value]) => (
          <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
            <div className="text-xs font-medium uppercase text-gray-500">
              {fieldLabel(key, t)}
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {localizedValue(value, t)}
            </div>
          </div>
        ))}
    </div>
  );
}

function XpSummaryBlock({ xpSummary }: { xpSummary?: XpSummary }) {
  const t = useTranslations("reinforcement");
  const xpT = useTranslations("reinforcement.xp");
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
          {xpT("summaryTitle")}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {rows.map(([key, value]) => (
          <div key={key as string} className="rounded-lg bg-gray-50 px-3 py-3">
            <div className="text-xs font-medium uppercase text-gray-500">
              {typeof xpT.has === "function" && xpT.has(`summary.${key as string}`)
                ? xpT(`summary.${key as string}`)
                : fieldLabel(key as string, t)}
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {localizedValue(value, t)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function XpSourceBreakdownBlock({
  progress,
}: {
  progress: StudentReinforcementProgress;
}) {
  const t = useTranslations("reinforcement");
  const sourceRows = progress.xp.bySourceType.filter(
    (row) => Number(row.count ?? 0) > 0 || Number(row.totalXp ?? 0) > 0,
  );

  if (sourceRows.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-gray-900">
          {t("overview.xpEarnedBySource")}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sourceRows.map((row) => {
          const sourceType = row.sourceType || "system";

          return (
            <div key={sourceType} className="rounded-lg bg-gray-50 px-3 py-3">
              <div className="text-xs font-medium uppercase text-gray-500">
                {t.has(`sourceType.${sourceType}`)
                  ? t(`sourceType.${sourceType}`)
                  : toLabel(sourceType)}
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">
                {xpValue(row.totalXp, t)}
              </div>
              <div className="mt-0.5 text-xs text-gray-500">
                {fieldLabel("count", t)}: {localizedValue(row.count, t)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentLedgerEntriesBlock({
  progress,
}: {
  progress: StudentReinforcementProgress;
}) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const entries = progress.xp.recentLedgerEntries;

  if (entries.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-gray-900">
          {t("recentActivity")}
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {entries.slice(0, 5).map((entry, index) => {
          const sourceType = entry.sourceType || "system";
          const occurredAt = entry.occurredAt || entry.createdAt;
          const reason =
            locale === "ar"
              ? entry.reasonAr || entry.reason
              : entry.reason || entry.reasonAr;

          return (
            <div
              key={entry.id || `${sourceType}-${index}`}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {t.has(`sourceType.${sourceType}`)
                    ? t(`sourceType.${sourceType}`)
                    : toLabel(sourceType)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {reason || "-"}
                </div>
              </div>
              <div className="shrink-0 text-start sm:text-end">
                <div className="text-sm font-bold text-emerald-600">
                  {typeof entry.amount === "number" && entry.amount > 0
                    ? "+"
                    : ""}
                  {xpValue(entry.amount, t)}
                </div>
                {occurredAt ? (
                  <div className="mt-0.5 text-xs text-gray-400">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(occurredAt))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export interface StudentProgressCardProps {
  progress: StudentReinforcementProgress;
}

export default function StudentProgressCard({
  progress,
}: StudentProgressCardProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const tasks = progress.tasks;
  const summary = normalizeProgressSummary(progress);
  const xpSummary = normalizeXpSummary(progress);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-900">
            {t("overview.studentProgress")}
          </h2>
        </div>
        <SummaryGrid
          summary={summary}
          emptyMessage={t("emptyStates.studentProgress")}
        />
      </section>

      <XpSummaryBlock xpSummary={xpSummary} />
      <XpSourceBreakdownBlock progress={progress} />
      <RecentLedgerEntriesBlock progress={progress} />

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
            {tasks.slice(0, 10).map((row) => (
              <div
                key={row.assignmentId}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {localizedTaskTitle(row.task, locale)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {translatedStatusLabel(row.status, t) || row.taskId}
                  </div>
                </div>
                {row.task.dueDate ? (
                  <div className="text-xs text-gray-500">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(row.task.dueDate))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
