"use client";

import { useTranslations } from "next-intl";
import { Search, Filter, X } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import RollCallQuickPresets from "./RollCallQuickPresets";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceStatus } from "../types";

export interface RosterFilters {
  search: string;
  status: "ALL" | "UNMARKED" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "EARLY_LEAVE";
  excuseCompleteness?: "ALL" | "COMPLETE" | "MISSING";
  lateMin?: number;
  earlyLeaveMin?: number;
}

interface RosterFiltersBarProps {
  filters: RosterFilters;
  onFiltersChange: (filters: RosterFilters) => void;
  policy: AttendancePolicy | null;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export default function RosterFiltersBar({
  filters,
  onFiltersChange,
  policy,
  showFilters,
  onToggleFilters,
}: RosterFiltersBarProps) {
  const t = useTranslations("attendance.rollCall.filters");
  const tStatus = useTranslations("attendance.rollCall.filters.status");

  const allowExcuses = policy?.allowExcuses ?? false;

  const statusOptions = [
    { value: "ALL", label: tStatus("all") },
    { value: "UNMARKED", label: tStatus("unmarked") },
    { value: "PRESENT", label: tStatus("present") },
    { value: "ABSENT", label: tStatus("absent") },
    { value: "LATE", label: tStatus("late") },
    ...(allowExcuses ? [{ value: "EXCUSED", label: tStatus("excused") }] : []),
    { value: "EARLY_LEAVE", label: tStatus("earlyLeave") },
  ];

  const excuseCompletenessOptions = [
    { value: "ALL", label: t("excuseAll") },
    { value: "COMPLETE", label: t("excuseComplete") },
    { value: "MISSING", label: t("excuseMissing") },
  ];

  const handleReset = () => {
    onFiltersChange({
      search: "",
      status: "ALL",
      excuseCompleteness: "ALL",
      lateMin: undefined,
      earlyLeaveMin: undefined,
    });
  };

  const handlePresetSelect = (status: "ALL" | AttendanceStatus | "UNMARKED") => {
    onFiltersChange({
      ...filters,
      status,
      // Clear numeric filters unless it's LATE or EARLY_LEAVE
      lateMin: status === "LATE" ? filters.lateMin : undefined,
      earlyLeaveMin: status === "EARLY_LEAVE" ? filters.earlyLeaveMin : undefined,
    });
  };

  return (
    <div style={{ backgroundColor: "var(--background)", borderBottom: "1px solid var(--color-border)" }} className="px-4 py-3">
      {/* Search Bar with Filter Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search style={{ color: "var(--color-neutral-400)" }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <button
          onClick={onToggleFilters}
          style={{
            backgroundColor: showFilters ? "var(--color-primary)" : "var(--background)",
            color: showFilters ? "var(--color-white)" : "var(--color-gray-600)",
            borderColor: showFilters ? "var(--color-primary)" : "var(--color-neutral-300)",
          }}
          className={`p-2 rounded-lg border transition-colors ${
            showFilters ? "" : "hover:bg-[var(--color-neutral-50)]"
          }`}
          title={showFilters ? t("hideFilters") : t("showFilters")}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Presets - Always Visible */}
      <div className="mb-3">
        <RollCallQuickPresets
          selectedStatus={filters.status}
          onSelect={handlePresetSelect}
          allowExcuses={allowExcuses}
        />
      </div>

      {/* Filter Dropdowns (Collapsible) */}
      {showFilters && (
        <div className="space-y-3">
          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status Filter */}
            <Select
              value={filters.status}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value as RosterFilters["status"],
                })
              }
              options={statusOptions}
              selectSize="sm"
              label={t("statusLabel")}
            />

            {/* Excuse Completeness (only if excuses allowed) */}
            {allowExcuses && (
              <Select
                value={filters.excuseCompleteness || "ALL"}
                onChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    excuseCompleteness: value as RosterFilters["excuseCompleteness"],
                  })
                }
                options={excuseCompletenessOptions}
                selectSize="sm"
                label={t("excuseLabel")}
              />
            )}

            {/* Late Minutes Filter */}
            <div>
              <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
                {t("lateMinLabel")}
              </label>
              <Input
                type="number"
                value={filters.lateMin?.toString() || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    lateMin: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="0"
                min="0"
                className="text-sm"
              />
            </div>

            {/* Early Leave Minutes Filter */}
            <div>
              <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
                {t("earlyLeaveMinLabel")}
              </label>
              <Input
                type="number"
                value={filters.earlyLeaveMin?.toString() || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    earlyLeaveMin: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="0"
                min="0"
                className="text-sm"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<X className="w-4 h-4" />}
            >
              {t("reset")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
