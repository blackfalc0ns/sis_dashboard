"use client";

import { useTranslations, useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import type {
  PolicyFormData,
  AttendanceMode,
  DailyComputationStrategy,
} from "../../types";
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
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const needsPeriods =
    formData.mode === "PERIOD" ||
    (formData.mode === "DAILY" &&
      formData.dailyComputationStrategy === "DERIVED_FROM_PERIODS");

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t("fields.attendanceMode")} <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="DAILY"
              checked={formData.mode === "DAILY"}
              onChange={(e) => onFieldChange("mode", e.target.value as AttendanceMode)}
              disabled={isReadOnly}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{t("mode.daily")}</div>
              <div className="text-sm text-gray-600 mt-1">{t("mode.dailyDesc")}</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="PERIOD"
              checked={formData.mode === "PERIOD"}
              onChange={(e) => onFieldChange("mode", e.target.value as AttendanceMode)}
              disabled={isReadOnly}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{t("mode.period")}</div>
              <div className="text-sm text-gray-600 mt-1">{t("mode.periodDesc")}</div>
            </div>
          </label>
        </div>
      </div>

      {/* Daily Computation Strategy */}
      {formData.mode === "DAILY" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t("fields.dailyComputation")}
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="dailyStrategy"
                value="MANUAL"
                checked={formData.dailyComputationStrategy === "MANUAL"}
                onChange={(e) =>
                  onFieldChange(
                    "dailyComputationStrategy",
                    e.target.value as DailyComputationStrategy
                  )
                }
                disabled={isReadOnly}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {t("computation.manual")}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t("computation.manualDesc")}
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="dailyStrategy"
                value="DERIVED_FROM_PERIODS"
                checked={formData.dailyComputationStrategy === "DERIVED_FROM_PERIODS"}
                onChange={(e) =>
                  onFieldChange(
                    "dailyComputationStrategy",
                    e.target.value as DailyComputationStrategy
                  )
                }
                disabled={isReadOnly}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {t("computation.derived")}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t("computation.derivedDesc")}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Period Selection */}
      {needsPeriods && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t("fields.selectPeriods")} <span className="text-red-500">*</span>
          </label>

          {isLoadingPeriods ? (
            <div className="text-sm text-gray-500 py-4">{tCommon("loading")}...</div>
          ) : availablePeriods.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              {t("noPeriods")}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allIds = availablePeriods.map((p) => `period-${p.index}`);
                    onFieldChange("selectedPeriodIds", allIds);
                  }}
                >
                  {t("selectAll")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFieldChange("selectedPeriodIds", [])}
                >
                  {t("clearAll")}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availablePeriods.map((period) => {
                  const periodId = `period-${period.index}`;
                  const isSelected = formData.selectedPeriodIds?.includes(periodId);

                  return (
                    <label
                      key={periodId}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const current = formData.selectedPeriodIds || [];
                          const updated = e.target.checked
                            ? [...current, periodId]
                            : current.filter((id) => id !== periodId);
                          onFieldChange("selectedPeriodIds", updated);
                        }}
                        disabled={isReadOnly}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {locale === "ar" ? period.nameAr : period.nameEn}
                        </div>
                        {period.startTime && period.endTime && (
                          <div className="text-xs text-gray-500">
                            {period.startTime} - {period.endTime}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {errors.selectedPeriodIds && (
                <p className="text-sm text-red-600 mt-2">{errors.selectedPeriodIds}</p>
              )}

              <div className="text-sm text-gray-600 mt-2">
                {t("periodsSelected", {
                  count: formData.selectedPeriodIds?.length || 0,
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
