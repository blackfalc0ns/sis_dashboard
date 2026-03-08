"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import type { PolicyFormData } from "../../types";

interface Step1BasicInfoProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}

export default function Step1BasicInfo({
  formData,
  errors,
  isReadOnly,
  onFieldChange,
}: Step1BasicInfoProps) {
  const t = useTranslations("attendance.policies.wizard");

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          {t("steps.basicInfo.description")}
        </div>
      </div>

      {/* Policy Name */}
      <BilingualTextField
        label={t("fields.policyName")}
        value={{ ar: formData.nameAr, en: formData.nameEn }}
        onChange={(value) => {
          onFieldChange("nameAr", value.ar);
          onFieldChange("nameEn", value.en);
        }}
        requiredAr
        requiredEn
        disabled={isReadOnly}
        errors={{
          ar: errors.nameAr,
          en: errors.nameEn,
        }}
      />

      {/* Description */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t("fields.description")}
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {t("fields.description")} (عربي)
            </label>
            <textarea
              value={formData.descriptionAr || ""}
              onChange={(e) => onFieldChange("descriptionAr", e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {t("fields.description")} (English)
            </label>
            <textarea
              value={formData.descriptionEn || ""}
              onChange={(e) => onFieldChange("descriptionEn", e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t("fields.notes")}
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {t("fields.notes")} (عربي)
            </label>
            <textarea
              value={formData.notesAr || ""}
              onChange={(e) => onFieldChange("notesAr", e.target.value)}
              disabled={isReadOnly}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {t("fields.notes")} (English)
            </label>
            <textarea
              value={formData.notesEn || ""}
              onChange={(e) => onFieldChange("notesEn", e.target.value)}
              disabled={isReadOnly}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Active Status */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => onFieldChange("isActive", e.target.checked)}
          disabled={isReadOnly}
          className="w-4 h-4"
        />
        <span className="text-sm font-medium text-gray-700">
          {t("fields.isActive")}
        </span>
      </label>
    </div>
  );
}
