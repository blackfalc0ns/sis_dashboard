"use client";

import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Select from "@/components/ui/input/Select";
import type { PolicyFormData, AttendanceScopeType } from "../../types";
import type {
  Stage,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface Step2ScopeProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  stages: Stage[];
  filteredGrades: Grade[];
  filteredSections: Section[];
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}

export default function Step2Scope({
  formData,
  errors,
  isReadOnly,
  stages,
  filteredGrades,
  filteredSections,
  onFieldChange,
}: Step2ScopeProps) {
  const t = useTranslations("attendance.policies.wizard");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <div className="font-semibold mb-1">{t("steps.scope.priorityTitle")}</div>
          <div>{t("steps.scope.priorityDesc")}</div>
        </div>
      </div>

      {/* Scope Selection Cards */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t("fields.scope")} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(["SCHOOL", "STAGE", "GRADE", "SECTION"] as AttendanceScopeType[]).map(
            (scopeType) => (
              <div
                key={scopeType}
                onClick={() => {
                  onFieldChange("scopeType", scopeType);
                  onFieldChange("scopeIds", {});
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.scopeType === scopeType
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.scopeType === scopeType
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.scopeType === scopeType && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="font-semibold text-sm">
                    {t(`scope.${scopeType.toLowerCase()}`)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {t(`scope.${scopeType.toLowerCase()}Desc`)}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Stage Selector */}
      {(formData.scopeType === "STAGE" ||
        formData.scopeType === "GRADE" ||
        formData.scopeType === "SECTION") && (
        <Select
          label={t("fields.selectStage")}
          value={formData.scopeIds?.stageId || ""}
          onChange={(value) => {
            onFieldChange("scopeIds", {
              ...formData.scopeIds,
              stageId: value,
              gradeId: undefined,
              sectionId: undefined,
            });
          }}
          options={stages.map((stage) => ({
            value: stage.id,
            label: locale === "ar" ? stage.nameAr : stage.nameEn,
          }))}
          placeholder={t("fields.selectStage")}
          error={errors.stageId}
          fullWidth
          disabled={isReadOnly}
        />
      )}

      {/* Grade Selector */}
      {(formData.scopeType === "GRADE" || formData.scopeType === "SECTION") &&
        formData.scopeIds?.stageId && (
          <Select
            label={t("fields.selectGrade")}
            value={formData.scopeIds?.gradeId || ""}
            onChange={(value) => {
              onFieldChange("scopeIds", {
                ...formData.scopeIds,
                gradeId: value,
                sectionId: undefined,
              });
            }}
            options={filteredGrades.map((grade) => ({
              value: grade.id,
              label: locale === "ar" ? grade.nameAr : grade.nameEn,
            }))}
            placeholder={t("fields.selectGrade")}
            error={errors.gradeId}
            fullWidth
            disabled={isReadOnly}
          />
        )}

      {/* Section Selector */}
      {formData.scopeType === "SECTION" && formData.scopeIds?.gradeId && (
        <Select
          label={t("fields.selectSection")}
          value={formData.scopeIds?.sectionId || ""}
          onChange={(value) => {
            onFieldChange("scopeIds", {
              ...formData.scopeIds,
              sectionId: value,
            });
          }}
          options={filteredSections.map((section) => ({
            value: section.id,
            label: locale === "ar" ? section.nameAr : section.nameEn,
          }))}
          placeholder={t("fields.selectSection")}
          error={errors.sectionId}
          fullWidth
          disabled={isReadOnly}
        />
      )}
    </div>
  );
}
