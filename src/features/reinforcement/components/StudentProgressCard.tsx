"use client";

import { BookOpen, Coins, ListChecks } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ReinforcementTask,
  StudentReinforcementProgress,
  XpSummary,
} from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  isRecord(value) ? value : undefined;

const asRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

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
  t.has(`progressFields.${key}`) ? t(`progressFields.${key}`) : toLabel(key);

const xpValue = (value: unknown, t: Translator): string =>
  `${toValue(value)} ${t("xp.unit")}`;

const localizedTaskTitle = (
  task: ReinforcementTask,
  locale: string,
): string =>
  locale === "ar"
    ? task.titleAr || task.titleEn || task.id
    : task.titleEn || task.titleAr || task.id;

const translatedStatusLabel = (status: unknown, t: Translator): string => {
  const value = typeof status === "string" ? status : "";
  return value && t.has(`status.${value}`) ? t(`status.${value}`) : value ? toLabel(value) : "";
};

const localizedName = (
  record: Record<string, unknown> | undefined,
  locale: string,
): string | undefined => {
  if (!record) return undefined;

  return locale === "ar"
    ? asString(record.nameAr) ||
        asString(record.full_name_ar) ||
        asString(record.name) ||
        asString(record.nameEn) ||
        asString(record.id)
    : asString(record.name) ||
        asString(record.nameEn) ||
        asString(record.full_name_en) ||
        asString(record.nameAr) ||
        asString(record.id);
};

const normalizeProgressSummary = (
  progress: StudentReinforcementProgress,
): Record<string, unknown> | undefined => {
  if (isRecord(progress.summary) && Object.keys(progress.summary).length > 0) {
    return progress.summary;
  }

  const assignments = asRecord(progress.assignments);
  const submissions = asRecord(progress.submissions);
  const summary: Record<string, unknown> = {};

  Object.entries(assignments ?? {}).forEach(([key, value]) => {
    summary[key] = value;
  });

  Object.entries(submissions ?? {}).forEach(([key, value]) => {
    summary[`submissions.${key}`] = value;
  });

  return Object.keys(summary).length > 0 ? summary : undefined;
};

const normalizeTasks = (
  progress: StudentReinforcementProgress,
): ReinforcementTask[] => {
  if (!Array.isArray(progress.tasks)) return [];

  return progress.tasks
    .map((item) => {
      const row = asRecord(item);
      if (!row) return undefined;

      const nestedTask = asRecord(row.task);
      const taskRecord = nestedTask ?? row;
      const taskId = asString(taskRecord.id) || asString(row.taskId);

      if (!taskId) return undefined;

      return {
        ...taskRecord,
        id: taskId,
        titleEn:
          asString(taskRecord.titleEn) ||
          asString(taskRecord.title) ||
          taskId,
        titleAr:
          asString(taskRecord.titleAr) ||
          asString(taskRecord.titleEn) ||
          asString(taskRecord.title) ||
          taskId,
        source: asString(taskRecord.source) || "system",
        rewardType: asString(taskRecord.rewardType) || "xp",
        status: asString(row.status) || asString(taskRecord.status),
        dueDate: asString(taskRecord.dueDate),
        assignmentId: asString(row.assignmentId),
        progress: typeof row.progress === "number" ? row.progress : undefined,
        assignedAt: asString(row.assignedAt),
        startedAt: asString(row.startedAt),
        completedAt: asString(row.completedAt),
        cancelledAt: asString(row.cancelledAt),
      } as ReinforcementTask;
    })
    .filter((task): task is ReinforcementTask => Boolean(task));
};

const normalizeXpSummary = (
  progress: StudentReinforcementProgress,
): XpSummary | undefined => {
  if (isRecord(progress.xpSummary) && Object.keys(progress.xpSummary).length > 0) {
    return progress.xpSummary as XpSummary;
  }

  const xp = asRecord(progress.xp);
  if (!xp) return undefined;

  const ledgerEntries = asRecordArray(xp.recentLedgerEntries);
  const earnedXp = ledgerEntries
    .filter((entry) => typeof entry.amount === "number" && entry.amount > 0)
    .reduce((total, entry) => total + (entry.amount as number), 0);
  const spentXp = Math.abs(
    ledgerEntries
      .filter((entry) => typeof entry.amount === "number" && entry.amount < 0)
      .reduce((total, entry) => total + (entry.amount as number), 0),
  );

  return {
    totalXp: typeof xp.totalXp === "number" ? xp.totalXp : undefined,
    earnedXp: earnedXp || undefined,
    spentXp: spentXp || undefined,
    balance: typeof xp.totalXp === "number" ? xp.totalXp : undefined,
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
      {Object.entries(summary).slice(0, 9).map(([key, value]) => (
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
              {xpT.has(`summary.${key as string}`)
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

function StudentIdentityBlock({
  progress,
}: {
  progress: StudentReinforcementProgress;
}) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const student = asRecord(progress.student);
  const enrollment = asRecord(progress.enrollment);
  const studentName = localizedName(student, locale);

  if (!studentName && !enrollment) return null;

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-gray-900">
          {studentName || toValue(progress.studentId)}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {student?.code ? (
          <div className="rounded-lg bg-gray-50 px-3 py-3">
            <div className="text-xs font-medium uppercase text-gray-500">
              {fieldLabel("code", t)}
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {localizedValue(student.code, t)}
            </div>
          </div>
        ) : null}
        {student?.admissionNo ? (
          <div className="rounded-lg bg-gray-50 px-3 py-3">
            <div className="text-xs font-medium uppercase text-gray-500">
              {fieldLabel("admissionNo", t)}
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {localizedValue(student.admissionNo, t)}
            </div>
          </div>
        ) : null}
        {enrollment
          ? Object.entries(enrollment).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {fieldLabel(key, t)}
                </div>
                <div className="mt-1 truncate text-base font-semibold text-gray-900">
                  {localizedValue(value, t)}
                </div>
              </div>
            ))
          : null}
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
  const xp = asRecord(progress.xp);
  const sourceRows = asRecordArray(xp?.bySourceType).filter(
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
          const sourceType = asString(row.sourceType) || "system";

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
  const xp = asRecord(progress.xp);
  const entries = asRecordArray(xp?.recentLedgerEntries);

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
          const sourceType = asString(entry.sourceType) || "system";
          const occurredAt = asString(entry.occurredAt) || asString(entry.createdAt);
          const reason =
            locale === "ar"
              ? asString(entry.reasonAr) || asString(entry.reason)
              : asString(entry.reason) || asString(entry.reasonAr);

          return (
            <div
              key={asString(entry.id) || `${sourceType}-${index}`}
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
                  {typeof entry.amount === "number" && entry.amount > 0 ? "+" : ""}
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
  const tasks = normalizeTasks(progress);
  const summary = normalizeProgressSummary(progress);
  const xpSummary = normalizeXpSummary(progress);

  return (
    <div className="space-y-4">
      <StudentIdentityBlock progress={progress} />

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
            {tasks.slice(0, 10).map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {localizedTaskTitle(task, locale)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {translatedStatusLabel(task.status, t) || task.id}
                  </div>
                </div>
                {task.dueDate ? (
                  <div className="text-xs text-gray-500">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(task.dueDate))}
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
