"use client";

import { useTranslations, useLocale } from "next-intl";
import { Info } from "lucide-react";
import Button from "@/components/ui/button/Button";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { PolicyFormData } from "../../types";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";

interface Step3ModeComputationProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  availablePeriods: TimetablePeriod[];
  isLoadingPeriods: boolean;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}

export default function Step3ModeComputation({
  formData,
  errors,
  isReadOnly,
  availablePeriods,
  isLoadingPeriods,
  onFieldChange,
}: Step3ModeComputationProps) {
  const t = useTranslations("attendance.policies.wizard");
  const locale = useLocale();


  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div
        className="rounded-lg border p-4 flex items-start gap-3"
        style={{
          backgroundColor: "var(--color-primary-50)",
          borderColor: "var(--color-primary-200)",
        }}
      >
        <Info
          className="w-5 h-5 shrink-0 mt-0.5"
          style={{ color: "var(--color-primary-700)" }}
        />
        <div>
          <h4
            className="font-semibold text-sm mb-1"
            style={{ color: "var(--color-primary-900)" }}
          >
            {t("periodOnlyInfo.title")}
          </h4>
          <p className="text-sm" style={{ color: "var(--color-primary-800)" }}>
            {t("periodOnlyInfo.description")}
          </p>
        </div>
      </div>

      {/* Period Selection */}
      <div>
        <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-3">
          {t("fields.selectPeriodsForDaily")} <span className="text-red-500">*</span>
        </label>
        <p style={{ color: "var(--color-gray-600)" }} className="text-sm mb-3">
          {t("selectPeriodsForDailyHelper")}
        </p>

        {isLoadingPeriods ? (
          <div className="flex justify-center py-4">
            <PartialLoader />
          </div>
        ) : availablePeriods.length === 0 ? (
          <div
            className="rounded-lg border p-4 text-sm"
            style={{
              backgroundColor: "var(--color-accent-50)",
              borderColor: "var(--color-accent-200)",
              color: "var(--color-accent-800)",
            }}
          >
            {t("noPeriods")}
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allIds = availablePeriods.map((p) => p.id);
                  onFieldChange("selectedPeriodIds", allIds);
                  // Auto-adjust threshold
                  if (
                    formData.absentIfMissedPeriodsCount &&
                    formData.absentIfMissedPeriodsCount > allIds.length
                  ) {
                    onFieldChange("absentIfMissedPeriodsCount", allIds.length);
                  }
                }}
                disabled={isReadOnly}
              >
                {t("selectAll")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFieldChange("selectedPeriodIds", [])}
                disabled={isReadOnly}
              >
                {t("clearAll")}
              </Button>

             
            </div>

            {/* Period Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3" style={{ borderColor: "var(--color-neutral-200)" }}>
              {availablePeriods.map((period) => {
                const isSelected = formData.selectedPeriodIds?.includes(period.id);

                return (
                  <label
                    key={period.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      borderColor: isSelected
                        ? "var(--primary-color)"
                        : "var(--color-neutral-200)",
                      backgroundColor: isSelected
                        ? "var(--color-primary-50)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const current = formData.selectedPeriodIds || [];
                        const updated = e.target.checked
                          ? [...current, period.id]
                          : current.filter((id) => id !== period.id);
                        onFieldChange("selectedPeriodIds", updated);
                        
                        // Auto-adjust threshold if needed
                        if (
                          formData.absentIfMissedPeriodsCount &&
                          formData.absentIfMissedPeriodsCount > updated.length
                        ) {
                          onFieldChange("absentIfMissedPeriodsCount", updated.length);
                        }
                      }}
                      disabled={isReadOnly}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium">
                        {locale === "ar" ? period.nameAr : period.nameEn}
                      </div>
                      {period.startTime && period.endTime && (
                        <div style={{ color: "var(--color-neutral-500)" }} className="text-xs">
                          {period.startTime} - {period.endTime}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {errors.selectedPeriodIds && (
              <p className="text-sm mt-2" style={{ color: "var(--color-accent-700)" }}>
                {errors.selectedPeriodIds}
              </p>
            )}

            <div style={{ color: "var(--color-gray-600)" }} className="text-sm mt-2">
              {t("periodsSelected", {
                count: formData.selectedPeriodIds?.length || 0,
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
