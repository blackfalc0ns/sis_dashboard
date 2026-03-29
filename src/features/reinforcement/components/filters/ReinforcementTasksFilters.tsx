"use client";

import { Search } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import { useTranslations } from "next-intl";
import type { ReinforcementTaskFilters } from "../../types/reinforcement";

export interface SelectOption {
  value: string;
  label: string;
}

interface ReinforcementTasksFiltersProps {
  filters: ReinforcementTaskFilters;
  onChange: (next: ReinforcementTaskFilters) => void;
  studentOptions: SelectOption[];
  classOptions: SelectOption[];
}

export default function ReinforcementTasksFilters({
  filters,
  onChange,
  studentOptions,
  classOptions,
}: ReinforcementTasksFiltersProps) {
  const t = useTranslations("reinforcement");

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Input
          label={t("filters.search")}
          value={filters.search || ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          leftIcon={<Search className="h-4 w-4" />}
          placeholder={t("filters.searchPlaceholder")}
        />

        <Select
          label={t("filters.student")}
          value={filters.student || ""}
          options={[{ value: "", label: t("filters.allStudents") }, ...studentOptions]}
          onChange={(value) =>
            onChange({ ...filters, student: value || undefined })
          }
          searchable
          searchPlaceholder={t("filters.searchPlaceholder")}
        />

        <Select
          label={t("filters.class")}
          value={filters.className || ""}
          options={[{ value: "", label: t("filters.allClasses") }, ...classOptions]}
          onChange={(value) =>
            onChange({ ...filters, className: value || undefined })
          }
        />

        <Select
          label={t("filters.source")}
          value={filters.source || "all"}
          options={[
            { value: "all", label: t("filters.allSources") },
            { value: "teacher", label: t("source.teacher") },
            { value: "parent", label: t("source.parent") },
            { value: "system", label: t("source.system") },
          ]}
          onChange={(value) =>
            onChange({
              ...filters,
              source: value as ReinforcementTaskFilters["source"],
            })
          }
        />

        <Select
          label={t("filters.status")}
          value={filters.status || "all"}
          options={[
            { value: "all", label: t("filters.allStatuses") },
            { value: "draft", label: t("status.draft") },
            { value: "active", label: t("status.active") },
            { value: "in_progress", label: t("status.in_progress") },
            { value: "under_review", label: t("status.under_review") },
            { value: "completed", label: t("status.completed") },
            { value: "rejected", label: t("status.rejected") },
            { value: "archived", label: t("status.archived") },
          ]}
          onChange={(value) =>
            onChange({
              ...filters,
              status: value as ReinforcementTaskFilters["status"],
            })
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t("filters.rewardType")}
            value={filters.rewardType || "all"}
            options={[
              { value: "all", label: t("filters.allRewardTypes") },
              { value: "moral", label: t("rewardType.moral") },
              { value: "financial", label: t("rewardType.financial") },
              { value: "xp", label: t("rewardType.xp") },
              { value: "badge", label: t("rewardType.badge") },
            ]}
            onChange={(value) =>
              onChange({
                ...filters,
                rewardType: value as ReinforcementTaskFilters["rewardType"],
              })
            }
          />
          <DatePicker
            label={t("filters.dueDate")}
            value={filters.dueDate ? new Date(filters.dueDate) : null}
            onChange={(value) =>
              onChange({
                ...filters,
                dueDate: value ? value.toISOString().split("T")[0] : undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
