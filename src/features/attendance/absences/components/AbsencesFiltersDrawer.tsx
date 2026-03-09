"use client";

import { useTranslations } from "next-intl";
import { Drawer } from "@mui/material";
import { X, Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import type { AbsencesFilters, AttendanceIncidentType, AttendanceGranularity } from "../types";

interface AbsencesFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AbsencesFilters;
  onFiltersChange: (filters: Partial<AbsencesFilters>) => void;
  onClearFilters: () => void;
  onExport: () => void;
}

export default function AbsencesFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  onExport,
}: AbsencesFiltersDrawerProps) {
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
    <Drawer anchor="bottom" open={isOpen} onClose={onClose}>
      <div className="h-[80vh] flex flex-col">
        {/* Fixed Header */}
        <div
          className="flex items-center justify-between p-4 border-b shrink-0"
          style={{
            backgroundColor: "var(--card-background)",
            borderColor: "var(--border-color)",
          }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("filters")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("search")}
              </label>
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("dateFrom")}
              </label>
              <DatePicker
                value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                onChange={(value) => onFiltersChange({ dateFrom: value ? value.toISOString().split('T')[0] : undefined })}
                placeholder={t("dateFrom")}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("dateTo")}
              </label>
              <DatePicker
                value={filters.dateTo ? new Date(filters.dateTo) : null}
                onChange={(value) => onFiltersChange({ dateTo: value ? value.toISOString().split('T')[0] : undefined })}
                placeholder={t("dateTo")}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("status")}
              </label>
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
            </div>

            {/* Granularity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("granularity")}
              </label>
              <Select
                value={filters.granularities.length > 0 ? filters.granularities[0] : ""}
                onChange={(value) => {
                  if (value) {
                    const newGranularities = filters.granularities.includes(value as AttendanceGranularity)
                      ? filters.granularities.filter((g) => g !== value)
                      : [...filters.granularities, value as AttendanceGranularity];
                    onFiltersChange({ granularities: newGranularities });
                  }
                }}
                options={[
                  { value: "", label: t("allGranularities") },
                  ...granularityOptions,
                ]}
                selectSize="sm"
              />
            </div>

            {/* Only Unexcused */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onlyUnexcused}
                onChange={(e) => onFiltersChange({ onlyUnexcused: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t("onlyUnexcused")}</span>
            </label>
          </div>
        </div>

        {/* Fixed Footer */}
        <div
          className="flex items-center gap-3 p-4 border-t shrink-0"
          style={{
            backgroundColor: "var(--card-background)",
            borderColor: "var(--border-color)",
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex-1"
          >
            {tCommon("reset")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => {
              onExport();
              onClose();
            }}
            className="flex-1"
          >
            {t("export")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            {tCommon("common.apply") || "Apply"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
