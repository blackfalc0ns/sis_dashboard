"use client";

import { useTranslations } from "next-intl";
import { Tooltip } from "@mui/material";
import type { AttendanceStatus } from "../types";

interface RollCallQuickPresetsProps {
  selectedStatus: "ALL" | AttendanceStatus | "UNMARKED";
  onSelect: (status: "ALL" | AttendanceStatus | "UNMARKED") => void;
  allowExcuses: boolean;
}

export default function RollCallQuickPresets({
  selectedStatus,
  onSelect,
  allowExcuses,
}: RollCallQuickPresetsProps) {
  const t = useTranslations("attendance.rollCall.filters");

  const presets: Array<{
    value: "ALL" | AttendanceStatus | "UNMARKED";
    label: string;
    disabled?: boolean;
    tooltip?: string;
  }> = [
    { value: "ALL", label: t("preset.all") },
    { value: "UNMARKED", label: t("preset.unmarked") },
    { value: "ABSENT", label: t("preset.absent") },
    { value: "LATE", label: t("preset.late") },
    {
      value: "EXCUSED",
      label: t("preset.excused"),
      disabled: !allowExcuses,
      tooltip: !allowExcuses ? t("excusesDisabledTooltip") : undefined,
    },
    { value: "EARLY_LEAVE", label: t("preset.earlyLeave") },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-gray-700">{t("presetsTitle")}:</span>
      {presets.map((preset) => {
        const isSelected = selectedStatus === preset.value;
        const button = (
          <button
            key={preset.value}
            onClick={() => !preset.disabled && onSelect(preset.value)}
            disabled={preset.disabled}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              isSelected
                ? "bg-primary text-white border-primary"
                : preset.disabled
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            {preset.label}
          </button>
        );

        if (preset.tooltip) {
          return (
            <Tooltip key={preset.value} title={preset.tooltip} arrow>
              <span>{button}</span>
            </Tooltip>
          );
        }

        return button;
      })}
    </div>
  );
}
