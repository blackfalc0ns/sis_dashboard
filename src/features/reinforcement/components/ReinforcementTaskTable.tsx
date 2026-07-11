"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import type { ReinforcementRewardType, ReinforcementTask } from "../types";

interface ReinforcementTaskTableProps {
  tasks: ReinforcementTask[];
  loading?: boolean;
  canManage?: boolean;
  onDuplicate: (task: ReinforcementTask) => void;
  onCancel: (task: ReinforcementTask) => void;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const taskTitle = (task: ReinforcementTask, locale: string) =>
  locale === "ar"
    ? task.titleAr || task.titleEn || task.id
    : task.titleEn || task.titleAr || task.id;

const VALID_REWARD_TYPES = new Set<ReinforcementRewardType>([
  "xp",
  "badge",
  "moral",
  "financial",
]);

const VALID_SOURCES = new Set(["teacher", "parent", "system"]);

type Translator = ReturnType<typeof useTranslations>;

const toLabel = (key: string): string =>
  key
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

const hasMessage = (t: Translator, key: string): boolean =>
  typeof t.has === "function" ? t.has(key) : true;

const statusLabel = (status: unknown, t: Translator) => {
  const value = typeof status === "string" ? status : "";
  const key = `status.${value}`;
  if (!value) return "-";
  if (typeof t.has !== "function") return toLabel(value);
  return t.has(key) ? t(key) : toLabel(value);
};

const sourceLabel = (source: unknown, t: Translator) => {
  const value = typeof source === "string" ? source : "";
  const key = `source.${value}`;
  return value && VALID_SOURCES.has(value) && hasMessage(t, key)
    ? t(key)
    : value
      ? toLabel(value)
      : "-";
};

const rewardLabel = (task: ReinforcementTask, t: Translator) => {
  const rewardType =
    typeof task.rewardType === "string" && VALID_REWARD_TYPES.has(task.rewardType)
      ? task.rewardType
      : undefined;
  const typeLabel = rewardType
    ? t(`rewardType.${rewardType}`)
    : t("tasks.table.reward", { defaultValue: "-" });

  return `${typeLabel}${task.rewardValue ? ` / ${task.rewardValue}` : ""}`;
};

export default function ReinforcementTaskTable({
  tasks,
  loading = false,
  canManage = false,
  onDuplicate,
  onCancel,
  total,
  currentPage = 1,
  pageSize = 25,
  onPageChange,
}: ReinforcementTaskTableProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");

  const columns: Column<ReinforcementTask>[] = [
    {
      key: "titleEn",
      label: t("tasks.table.task"),
      searchable: true,
      render: (_value, task) => (
        <div className="max-w-sm">
          <div className="font-semibold text-gray-900">{taskTitle(task, locale)}</div>
          <div className="mt-1 line-clamp-2 text-sm text-gray-500">
            {locale === "ar" ? task.descriptionAr || task.descriptionEn : task.descriptionEn || task.descriptionAr}
          </div>
        </div>
      ),
    },
    { key: "source", label: t("tasks.table.source"), render: (value) => sourceLabel(value, t) },
    { key: "status", label: t("tasks.table.status"), render: (value) => statusLabel(value, t) },
    { key: "rewardType", label: t("tasks.table.reward"), render: (_value, task) => rewardLabel(task, t) },
    {
      key: "dueDate",
      label: t("tasks.table.dueDate"),
      render: (value) => value
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(String(value)))
        : "-",
    },
    {
      key: "actions",
      label: t("tasks.table.actions"),
      sortable: false,
      render: (_value, task) => {
        const isCancelled = task.status === "cancelled";
        return (
          <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
            <Link href={`/${locale}/reinforcement/tasks/${task.id}`}>
              <Button type="button" variant="secondary" size="sm">{t("tasks.table.view")}</Button>
            </Link>
            {canManage ? <Button type="button" variant="secondary" size="sm" onClick={() => onDuplicate(task)}>{t("actions.duplicate")}</Button> : null}
            {canManage && !isCancelled ? <Button type="button" variant="danger" size="sm" onClick={() => onCancel(task)}>{t("actions.cancel")}</Button> : null}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tasks}
      isLoading={loading}
      showPagination
      itemsPerPage={pageSize}
      emptyTitle={t("emptyStates.tasks")}
      serverPagination={onPageChange ? {
        enabled: true,
        currentPage,
        pageSize,
        totalItems: total ?? tasks.length,
        onPageChange,
        onPageSizeChange: () => undefined,
      } : undefined}
    />
  );
}
