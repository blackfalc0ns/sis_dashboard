"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import Input from "@/components/ui/input/Input";
import type { PolicyFormData } from "../../types";

interface Step4RulesProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}

export default function Step4Rules({
  formData,
  errors,
  isReadOnly,
  onFieldChange,
}: Step4RulesProps) {
  const t = useTranslations("attendance.policies.wizard");

  const selectedPeriodsCount = formData.selectedPeriodIds?.length || 0;
  const threshold = formData.absentIfMissedPeriodsCount || 0;
  const showThresholdWarning = threshold > selectedPeriodsCount;

  return (
    <div className="space-y-6">
      {/* Late & Early Leave Thresholds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("fields.lateThreshold")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              value={formData.lateThresholdMinutes}
              onChange={(e) =>
                onFieldChange("lateThresholdMinutes", parseInt(e.target.value) || 0)
              }
              min={0}
              disabled={isReadOnly}
              error={errors.lateThresholdMinutes}
            />
            <span className="absolute right-15 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {t("minutes")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{t("fields.lateThresholdDesc")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("fields.earlyThreshold")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              value={formData.earlyLeaveThresholdMinutes}
              onChange={(e) =>
                onFieldChange(
                  "earlyLeaveThresholdMinutes",
                  parseInt(e.target.value) || 0
                )
              }
              min={0}
              disabled={isReadOnly}
              error={errors.earlyLeaveThresholdMinutes}
            />
            <span className="absolute right-15 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {t("minutes")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{t("fields.earlyThresholdDesc")}</p>
        </div>
      </div>

      {/* Daily Absent Threshold (from periods) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("fields.dailyAbsentThreshold")} <span className="text-red-500">*</span>
        </label>
        <div className="relative max-w-xs">
          <Input
            type="number"
            value={formData.absentIfMissedPeriodsCount || ""}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : undefined;
              // Clamp to valid range
              if (value !== undefined && selectedPeriodsCount > 0) {
                const clamped = Math.min(Math.max(1, value), selectedPeriodsCount);
                onFieldChange("absentIfMissedPeriodsCount", clamped);
              } else {
                onFieldChange("absentIfMissedPeriodsCount", value);
              }
            }}
            min={1}
            max={selectedPeriodsCount}
            disabled={isReadOnly}
            error={errors.absentIfMissedPeriodsCount}
          />
          <span className="absolute right-15 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {t("periods")}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t("fields.dailyAbsentThresholdDesc", { max: selectedPeriodsCount })}
        </p>
        
        {/* Warning if threshold exceeds selected periods */}
        {showThresholdWarning && (
          <div
            className="flex items-start gap-2 mt-2 p-3 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--color-accent-50)",
              borderColor: "var(--color-accent-200)",
              color: "var(--color-accent-800)",
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t("thresholdExceedsSelected")}</span>
          </div>
        )}
      </div>

      {/* Excuses */}
      <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: "var(--color-neutral-200)" }}>
        <h4 className="font-semibold text-sm text-gray-900">
          {t("fields.excuseSettings")}
        </h4>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.allowExcuses}
            onChange={(e) => onFieldChange("allowExcuses", e.target.checked)}
            disabled={isReadOnly}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            {t("fields.allowExcuses")}
          </span>
        </label>

        {formData.allowExcuses && (
          <>
            <label className="flex items-center gap-3 ml-7">
              <input
                type="checkbox"
                checked={formData.requireExcuseReason}
                onChange={(e) => onFieldChange("requireExcuseReason", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">{t("fields.requireReason")}</span>
            </label>

            <label className="flex items-center gap-3 ml-7">
              <input
                type="checkbox"
                checked={formData.requireAttachmentForExcuse}
                onChange={(e) =>
                  onFieldChange("requireAttachmentForExcuse", e.target.checked)
                }
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                {t("fields.requireAttachment")}
              </span>
            </label>

            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.maxDaysToSubmit")}
              </label>
              <div className="relative max-w-xs">
                <Input
                  type="number"
                  value={formData.maxDaysToSubmitExcuse || ""}
                  onChange={(e) =>
                    onFieldChange(
                      "maxDaysToSubmitExcuse",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  min={0}
                  disabled={isReadOnly}
                  error={errors.maxDaysToSubmitExcuse}
                  placeholder={t("optional")}
                />
                <span className="absolute right-15 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {t("days")}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("fields.maxDaysToSubmitDesc")}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
