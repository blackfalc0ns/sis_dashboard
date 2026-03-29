"use client";

import { useLocale, useTranslations } from "next-intl";
import { PencilLine } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { ReinforcementTemplate } from "../../types/reinforcement";
import ReinforcementBadge from "../shared/ReinforcementBadge";

interface ReinforcementTemplatesTableProps {
  templates: ReinforcementTemplate[];
  onEdit: (template: ReinforcementTemplate) => void;
}

export default function ReinforcementTemplatesTable({
  templates,
  onEdit,
}: ReinforcementTemplatesTableProps) {
  const t = useTranslations("reinforcement.templatesTable");
  const locale = useLocale();

  const columns: Column<ReinforcementTemplate>[] = [
    {
      key: "titleEn",
      label: t("title"),
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">
            {locale === "ar" ? row.titleAr : row.titleEn}
          </div>
          <div className="truncate text-xs text-gray-500">
            {locale === "ar" ? row.descriptionAr : row.descriptionEn}
          </div>
        </div>
      ),
    },
    {
      key: "stages",
      label: t("stages"),
      render: (_value, row) => <span>{row.stages.length}</span>,
    },
    {
      key: "rewardType",
      label: t("rewardType"),
      render: (value, row) => (
        <div className="space-y-1">
          <ReinforcementBadge
            type="rewardType"
            value={value as ReinforcementTemplate["rewardType"]}
          />
          <div className="text-xs text-gray-500">{row.rewardValue}</div>
        </div>
      ),
    },
    {
      key: "isActive",
      label: t("status"),
      render: (value) => (
        <ReinforcementBadge
          type="active"
          value={value ? "active" : "inactive"}
        />
      ),
    },
    { key: "createdAt", label: t("createdAt") },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_value, row) => (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onEdit(row);
          }}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary"
          title={t("edit")}
        >
          <PencilLine className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as Column<{ [key: string]: unknown }>[]}
      data={templates as unknown as Array<{ [key: string]: unknown }>}
      showPagination={false}
    />
  );
}
