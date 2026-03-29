"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Eye, RotateCcw, X } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { ReinforcementReviewItem } from "../../types/reinforcement";
import ReinforcementBadge from "../shared/ReinforcementBadge";

interface ReinforcementReviewQueueTableProps {
  items: ReinforcementReviewItem[];
  onView: (item: ReinforcementReviewItem) => void;
  onApprove: (item: ReinforcementReviewItem) => void;
  onReject: (item: ReinforcementReviewItem) => void;
  onResubmit: (item: ReinforcementReviewItem) => void;
}

export default function ReinforcementReviewQueueTable({
  items,
  onView,
  onApprove,
  onReject,
  onResubmit,
}: ReinforcementReviewQueueTableProps) {
  const t = useTranslations("reinforcement.reviewTable");
  const locale = useLocale();

  const columns: Column<ReinforcementReviewItem>[] = [
    {
      key: "taskTitleEn",
      label: t("task"),
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">
            {locale === "ar" ? row.taskTitleAr : row.taskTitleEn}
          </div>
          <div className="truncate text-xs text-gray-500">{row.taskId}</div>
        </div>
      ),
    },
    { key: "studentName", label: t("student") },
    { key: "submittedAt", label: t("submittedAt") },
    { key: "stageCountCompleted", label: t("stageCountCompleted") },
    {
      key: "proofType",
      label: t("proofType"),
      render: (value) => (
        <ReinforcementBadge
          type="proofType"
          value={value as ReinforcementReviewItem["proofType"]}
        />
      ),
    },
    {
      key: "source",
      label: t("source"),
      render: (value) => (
        <ReinforcementBadge
          type="source"
          value={value as ReinforcementReviewItem["source"]}
        />
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (value) => (
        <ReinforcementBadge
          type="status"
          value={value as ReinforcementReviewItem["status"]}
        />
      ),
    },
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
            onClick={() => onView(row)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            title={t("view")}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onApprove(row)}
            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
            title={t("approve")}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => onReject(row)}
            className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
            title={t("reject")}
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => onResubmit(row)}
            className="rounded p-1.5 text-amber-600 hover:bg-amber-50"
            title={t("resubmit")}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as Column<{ [key: string]: unknown }>[]}
      data={items as unknown as Array<{ [key: string]: unknown }>}
      showPagination={false}
    />
  );
}
