"use client";

import { useLocale, useTranslations } from "next-intl";
import { PencilLine } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { ReinforcementReward } from "../../types/reinforcement";
import ReinforcementBadge from "../shared/ReinforcementBadge";

interface ReinforcementRewardsTableProps {
  rewards: ReinforcementReward[];
  onEdit: (reward: ReinforcementReward) => void;
}

export default function ReinforcementRewardsTable({
  rewards,
  onEdit,
}: ReinforcementRewardsTableProps) {
  const t = useTranslations("reinforcement.rewardsTable");
  const locale = useLocale();

  const columns: Column<ReinforcementReward>[] = [
    {
      key: "nameEn",
      label: t("name"),
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">
            {locale === "ar" ? row.nameAr : row.nameEn}
          </div>
          <div className="truncate text-xs text-gray-500">{row.id}</div>
        </div>
      ),
    },
    {
      key: "type",
      label: t("type"),
      render: (value) => (
        <ReinforcementBadge
          type="rewardType"
          value={value as ReinforcementReward["type"]}
        />
      ),
    },
    { key: "defaultValue", label: t("defaultValue") },
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
      data={rewards as unknown as Array<{ [key: string]: unknown }>}
      showPagination={false}
    />
  );
}
