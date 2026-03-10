"use client";

import { useTranslations, useLocale } from "next-intl";
import { Search, X, Download } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import type { AbsencesFilters, AttendanceIncidentType, AttendanceGranularity } from "../types";

interface AbsencesFiltersBarProps {
  filters: AbsencesFilters;
  onFiltersChange: (filters: Partial<AbsencesFilters>) => void;
  onClearFilters: () => void;
  onExport: () => void;
  isReadOnly: boolean;
}

export default function AbsencesFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  onExport,
}: AbsencesFiltersBarProps) {
  const t = useTranslations("attendance.absences.filters");
  const tCommon = useTranslations("common");

  const statusOptions: { value: AttendanceIncidentType; label: string }[] = [
    { value: "ABSENT", label: t("absent") },
    { value: "LATE", label: t("late") },
    { value: "EARLY_LEAVE", label: t("earlyLeave") },
    { value: "EXCUSED", label: t("excused") },
    { value: "UNMARKED", label: t("unmarked") },
  ];

  const granularityOptions: { value: AttendanceGranularity; label: string }[] = [
    { value: "PERIOD", label: t("period") },
    { value: "DAILY_DERIVED", label: t("dailyDerived") },
  ];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Date From */}
        <DatePicker
          value={filters.dateFrom ? new Date(filters.dateFrom) : null}
          onChange={(value) => onFiltersChange({ dateFrom: value ? value.toISOString().split('T')[0] : undefined })}
          placeholder={t("dateFrom")}
        />

        {/* Date To */}
        <DatePicker
          value={filters.dateTo ? new Date(filters.dateTo) : null}
          onChange={(value) => onFiltersChange({ dateTo: value ? value.toISOString().split('T')[0] : undefined })}
          placeholder={t("dateTo")}
        />

        {/* Status Multi-Select */}
        <Select
          value={filters.statuses.length > 0 ? filters.statuses[0] : ""}
          onChange={(value) => {
            if (value) {
              const newStatuses = filters.statuses.includes(value as AttendanceIncidentType)
                ? filters.statuses.filter((s) => s !== value)
                : [...filters.statuses, value as AttendanceIncidentType];
              onFiltersChange({ statuses: newStatuses });
            }
          }}
          options={[
            { value: "", label: t("allStatuses") },
            ...statusOptions,
          ]}
          selectSize="sm"
        />

         {/* Granularity Filter */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">{t("granularity")}</label>
          <div className="flex flex-col gap-2">
            {granularityOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.granularities.includes(option.value)}
                  onChange={(e) => {
                    const newGranularities = e.target.checked
                      ? [...filters.granularities, option.value]
                      : filters.granularities.filter((g) => g !== option.value);
                    onFiltersChange({ granularities: newGranularities });
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Only Unexcused Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyUnexcused}
            onChange={(e) => onFiltersChange({ onlyUnexcused: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">{t("onlyUnexcused")}</span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<X className="w-4 h-4" />}
            onClick={onClearFilters}
          >
            {tCommon("reset")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={onExport}
          >
            {t("export")}
          </Button>
        </div>
      </div>
    </div>
  );
}
