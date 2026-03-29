"use client";

import { useLocale, useTranslations } from "next-intl";
import { Eye, Archive, Copy, CheckSquare } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { ReinforcementTask } from "../../types/reinforcement";
import ReinforcementBadge from "../shared/ReinforcementBadge";
import { getProgressLabel } from "../../utils/reinforcementPresentation";

interface ReinforcementTasksTableProps {
  tasks: ReinforcementTask[];
  onRowClick: (task: ReinforcementTask) => void;
  onReview: (task: ReinforcementTask) => void;
  onDuplicate: (task: ReinforcementTask) => void;
  onArchive: (task: ReinforcementTask) => void;
}

export default function ReinforcementTasksTable({
  tasks,
  onRowClick,
  onReview,
  onDuplicate,
  onArchive,
}: ReinforcementTasksTableProps) {
  const t = useTranslations("reinforcement.table");
  const locale = useLocale();

  const columns: Column<ReinforcementTask>[] = [
    {
      key: "titleEn",
      label: t("task"),
      searchable: true,
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">
            {locale === "ar" ? row.titleAr : row.titleEn}
          </div>
          <div className="truncate text-xs text-gray-500">{row.id}</div>
        </div>
      ),
    },
    { key: "studentName", label: t("student"), searchable: true },
    { key: "className", label: t("class") },
    {
      key: "source",
      label: t("source"),
      render: (value) => (
        <ReinforcementBadge
          type="source"
          value={value as ReinforcementTask["source"]}
        />
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (value) => (
        <ReinforcementBadge
          type="status"
          value={value as ReinforcementTask["status"]}
        />
      ),
    },
    {
      key: "rewardType",
      label: t("reward"),
      render: (value, row) => (
        <div className="space-y-1">
          <ReinforcementBadge
            type="rewardType"
            value={value as ReinforcementTask["rewardType"]}
          />
          <div className="text-xs text-gray-500">{row.rewardValue}</div>
        </div>
      ),
    },
    {
      key: "stages",
      label: t("progress"),
      sortable: false,
      render: (_value, row) => (
        <span className="text-sm font-medium text-gray-700">
          {getProgressLabel(
            row.stages.filter((stage) => stage.isCompleted).length,
            row.stages.length,
          )}
        </span>
      ),
    },
    { key: "dueDate", label: t("dueDate") },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_value, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => onRowClick(row)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary"
            title={t("view")}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onReview(row)}
            className="rounded p-1.5 text-amber-600 hover:bg-amber-50"
            title={t("review")}
          >
            <CheckSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDuplicate(row)}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            title={t("duplicate")}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onArchive(row)}
            className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
            title={t("archive")}
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as Column<{ [key: string]: unknown }>[]}
      data={tasks as unknown as Array<{ [key: string]: unknown }>}
      onRowClick={(row) => onRowClick(row as unknown as ReinforcementTask)}
      itemsPerPage={10}
    />
  );
}
