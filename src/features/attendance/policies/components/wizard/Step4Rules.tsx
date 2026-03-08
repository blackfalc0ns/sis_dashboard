"use client";

import { useTranslations } from "next-intl";
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

      {/* Auto Absent Rules */}
      {formData.mode === "DAILY" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("fields.autoAbsentAfter")}
          </label>
          <div className="relative">
            <Input
              type="number"
              value={formData.autoAbsentAfterMinutes || ""}
              onChange={(e) =>
                onFieldChange(
                  "autoAbsentAfterMinutes",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              min={0}
              disabled={isReadOnly}
              error={errors.autoAbsentAfterMinutes}
              placeholder={t("optional")}
            />
            <span className="absolute right-15 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {t("minutes")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t("fields.autoAbsentAfterDesc")}
          </p>
        </div>
      )}

      {formData.mode === "PERIOD" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("fields.absentIfMissed")}
          </label>
          <div className="relative">
            <Input
              type="number"
              value={formData.absentIfMissedPeriodsCount || ""}
              onChange={(e) =>
                onFieldChange(
                  "absentIfMissedPeriodsCount",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              min={0}
              disabled={isReadOnly}
              error={errors.absentIfMissedPeriodsCount}
              placeholder={t("optional")}
            />
            <span className="absolute right-15 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {t("periods")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{t("fields.absentIfMissedDesc")}</p>
        </div>
      )}

      {/* Excuses */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
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
