"use client";

import { useTranslations, useLocale } from "next-intl";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { Stage, Grade, Section, Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import { getSessionStatusStyle } from "@/features/attendance/shared/statusStyles";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

import type { AttendanceSessionMode } from "../types";

interface SessionPickerPanelProps {
  // Scope
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  onScopeTypeChange: (scopeType: AttendanceScopeType) => void;
  onScopeIdsChange: (scopeIds: AttendanceScopeIds) => void;

  // Date
  date: string;
  onDateChange: (date: string) => void;
  termStartDate: string;
  termEndDate: string;

  // Mode & Period
  mode: AttendanceSessionMode;
  periods: TimetablePeriod[];
  selectedPeriodId: string | null;
  onPeriodChange: (periodId: string) => void;

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
  classrooms,
  onScopeTypeChange,
  onScopeIdsChange,
  date,
  onDateChange,
  termStartDate,
  termEndDate,
  mode,
  periods,
  selectedPeriodId,
  onPeriodChange,
  sessionStatus,
}: SessionPickerPanelProps) {
  const t = useTranslations("attendance.rollCall");
  const tStatus = useTranslations("attendance.rollCall.sessionStatus");
  const locale = useLocale();

  const handlePrevPeriod = () => {
    if (!selectedPeriodId) return;
    const currentIdx = periods.findIndex((p) => p.id === selectedPeriodId);
    if (currentIdx <= 0) return;
    onPeriodChange(periods[currentIdx - 1].id);
  };

  const handleNextPeriod = () => {
    if (!selectedPeriodId) return;
    const currentIdx = periods.findIndex((p) => p.id === selectedPeriodId);
    if (currentIdx < 0 || currentIdx >= periods.length - 1) return;
    onPeriodChange(periods[currentIdx + 1].id);
  };

  return (
    <div style={{ backgroundColor: "var(--background)", borderRight: "1px solid var(--color-border)", borderLeft: "1px solid var(--color-border)" }} className="w-80 flex flex-col">
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--color-border)" }} className="p-4">
        <h3 style={{ color: "var(--color-gray-900)" }} className="text-lg font-semibold">{t("sessionPicker.title")}</h3>
        <p style={{ color: "var(--color-gray-600)" }} className="text-sm mt-1">{t("sessionPicker.subtitle")}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Scope Picker */}
        <div>
          <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium mb-3">{t("sessionPicker.scope")}</h4>
          <ScopePicker
            scopeType={scopeType}
            scopeIds={scopeIds}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            onScopeTypeChange={onScopeTypeChange}
            onScopeIdsChange={onScopeIdsChange}
          />
        </div>

        {/* Date Picker */}
        <div>
          <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium mb-3">{t("sessionPicker.date")}</h4>
          <DatePicker
            value={date ? new Date(date) : null}
            onChange={(newDate) => onDateChange(newDate ? newDate.toISOString().split("T")[0] : "")}
            minDate={termStartDate ? new Date(termStartDate) : undefined}
            maxDate={termEndDate ? new Date(termEndDate) : undefined}
          />
        </div>

        {/* Mode & Period Selection */}
        {mode === "PERIOD" && periods.length > 0 && (
          <div>
            <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium mb-3">{t("sessionPicker.period")}</h4>

            {/* Period Navigation */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPeriod}
                disabled={ !selectedPeriodId || periods.findIndex((p) => p.id === selectedPeriodId) <= 0}
                leftIcon={locale === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              >
                {t("sessionPicker.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPeriod}
                disabled={
                   !selectedPeriodId || periods.findIndex((p) => p.id === selectedPeriodId) >= periods.length - 1
                }
                rightIcon={locale === "ar" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              >
                {t("sessionPicker.next")}
              </Button>
            </div>

            {/* Period List */}
            <div className="space-y-2">
              {periods.map((period) => {
                const isSelected = selectedPeriodId === period.id;
                return (
                  <button
                    key={period.id}
                    onClick={() => onPeriodChange(period.id)}
                    style={{
                      backgroundColor: isSelected ? "var(--color-primary)" : "var(--background)",
                      color: isSelected ? "var(--color-white)" : "var(--color-gray-700)",
                      borderColor: isSelected ? "var(--color-primary)" : "var(--color-neutral-300)",
                    }}
                    className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                      isSelected ? "" : "hover:bg-[var(--color-neutral-50)]"
                    } ${"cursor-pointer"}`}
                  >
                    <div className={`font-medium ${locale === "ar" ? "text-right" : "text-left"}`}>
                      {locale === "ar" ? period.nameAr : period.nameEn}
                    </div>
                    {period.startTime && period.endTime && (
                      <div className="text-xs mt-1 opacity-80">
                        {period.startTime} - {period.endTime}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Mode Indicator */}
        {mode === "DAILY" && (
          <div style={{ backgroundColor: "var(--color-primary-50)", borderColor: "var(--color-primary-200)" }} className="p-3 border rounded">
            <div style={{ color: "var(--color-primary-800)" }} className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{t("sessionPicker.dailyMode")}</span>
            </div>
          </div>
        )}

        {/* Session Status */}
        {sessionStatus && (
          <div>
            <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium mb-2">{t("sessionPicker.status")}</h4>
            <span
              style={{
                backgroundColor: getSessionStatusStyle(sessionStatus).bg,
                color: getSessionStatusStyle(sessionStatus).fg,
              }}
              className="inline-flex px-3 py-1 text-sm font-medium rounded"
            >
              {tStatus(sessionStatus.toLowerCase())}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
