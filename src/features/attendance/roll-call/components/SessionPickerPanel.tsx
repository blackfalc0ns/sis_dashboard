"use client";

import { useTranslations, useLocale } from "next-intl";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { Stage, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import type { AttendanceSessionMode } from "../types";

interface SessionPickerPanelProps {
  // Scope
  scopeType: AttendanceScopeType;
  scopeIds: { stageId?: string; gradeId?: string; sectionId?: string };
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  onScopeTypeChange: (scopeType: AttendanceScopeType) => void;
  onScopeIdsChange: (scopeIds: { stageId?: string; gradeId?: string; sectionId?: string }) => void;

  // Date
  date: string;
  onDateChange: (date: string) => void;
  termStartDate: string;
  termEndDate: string;

  // Mode & Period
  mode: AttendanceSessionMode;
  periods: TimetablePeriod[];
  selectedPeriodIndex: number | null;
  onPeriodChange: (periodIndex: number) => void;

  // Session status
  sessionStatus: "DRAFT" | "SUBMITTED" | null;

  // Disabled
  disabled?: boolean;
}

export default function SessionPickerPanel({
  scopeType,
  scopeIds,
  stages,
  grades,
  sections,
  onScopeTypeChange,
  onScopeIdsChange,
  date,
  onDateChange,
  termStartDate,
  termEndDate,
  mode,
  periods,
  selectedPeriodIndex,
  onPeriodChange,
  sessionStatus,
  disabled = false,
}: SessionPickerPanelProps) {
  const t = useTranslations("attendance.rollCall");
  const tStatus = useTranslations("attendance.rollCall.sessionStatus");
  const locale = useLocale();

  const handlePrevPeriod = () => {
    if (selectedPeriodIndex === null || selectedPeriodIndex <= 1) return;
    onPeriodChange(selectedPeriodIndex - 1);
  };

  const handleNextPeriod = () => {
    if (selectedPeriodIndex === null || selectedPeriodIndex >= periods.length) return;
    onPeriodChange(selectedPeriodIndex + 1);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{t("sessionPicker.title")}</h3>
        <p className="text-sm text-gray-600 mt-1">{t("sessionPicker.subtitle")}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Scope Picker */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">{t("sessionPicker.scope")}</h4>
          <ScopePicker
            scopeType={scopeType}
            scopeIds={scopeIds}
            stages={stages}
            grades={grades}
            sections={sections}
            onScopeTypeChange={onScopeTypeChange}
            onScopeIdsChange={onScopeIdsChange}
            disabled={disabled}
          />
        </div>

        {/* Date Picker */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">{t("sessionPicker.date")}</h4>
          <DatePicker
            value={date ? new Date(date) : null}
            onChange={(newDate) => onDateChange(newDate ? newDate.toISOString().split("T")[0] : "")}
            minDate={termStartDate ? new Date(termStartDate) : undefined}
            maxDate={termEndDate ? new Date(termEndDate) : undefined}
            disabled={disabled}
          />
        </div>

        {/* Mode & Period Selection */}
        {mode === "PERIOD" && periods.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">{t("sessionPicker.period")}</h4>

            {/* Period Navigation */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPeriod}
                disabled={disabled || selectedPeriodIndex === null || selectedPeriodIndex <= 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                {t("sessionPicker.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPeriod}
                disabled={
                  disabled || selectedPeriodIndex === null || selectedPeriodIndex >= periods.length
                }
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                {t("sessionPicker.next")}
              </Button>
            </div>

            {/* Period List */}
            <div className="space-y-2">
              {periods.map((period) => (
                <button
                  key={period.index}
                  onClick={() => onPeriodChange(period.index)}
                  disabled={disabled}
                  className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                    selectedPeriodIndex === period.index
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="font-medium">
                    {locale === "ar" ? period.nameAr : period.nameEn}
                  </div>
                  {period.startTime && period.endTime && (
                    <div className="text-xs mt-1 opacity-80">
                      {period.startTime} - {period.endTime}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Daily Mode Indicator */}
        {mode === "DAILY" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 text-blue-800">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{t("sessionPicker.dailyMode")}</span>
            </div>
          </div>
        )}

        {/* Session Status */}
        {sessionStatus && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("sessionPicker.status")}</h4>
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded ${
                sessionStatus === "SUBMITTED"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {tStatus(sessionStatus.toLowerCase())}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
