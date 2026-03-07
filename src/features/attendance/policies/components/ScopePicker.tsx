"use client";

import { useTranslations, useLocale } from "next-intl";
import Select from "@/components/ui/input/Select";
import type { AttendanceScopeType } from "../types";
import type { Stage, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";

interface ScopePickerProps {
  scopeType: AttendanceScopeType;
  scopeIds: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
  };
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  onScopeTypeChange: (scopeType: AttendanceScopeType) => void;
  onScopeIdsChange: (scopeIds: { stageId?: string; gradeId?: string; sectionId?: string }) => void;
  disabled?: boolean;
  errors?: {
    scopeType?: string;
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
  };
}

export default function ScopePicker({
  scopeType,
  scopeIds,
  stages,
  grades,
  sections,
  onScopeTypeChange,
  onScopeIdsChange,
  disabled = false,
  errors = {},
}: ScopePickerProps) {
  const tForm = useTranslations("attendance.policies.form");
  const tScope = useTranslations("attendance.policies.scopeType");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const scopeTypeOptions = [
    { value: "SCHOOL", label: tScope("school") },
    { value: "STAGE", label: tScope("stage") },
    { value: "GRADE", label: tScope("grade") },
    { value: "SECTION", label: tScope("section") },
  ];

  const handleScopeTypeChange = (value: string) => {
    onScopeTypeChange(value as AttendanceScopeType);
    // Reset scope IDs when changing type
    onScopeIdsChange({});
  };

  const handleStageChange = (stageId: string) => {
    onScopeIdsChange({ stageId });
  };

  const handleGradeChange = (gradeId: string) => {
    onScopeIdsChange({ ...scopeIds, gradeId, sectionId: undefined });
  };

  const handleSectionChange = (sectionId: string) => {
    onScopeIdsChange({ ...scopeIds, sectionId });
  };

  // Filter grades by selected stage
  const filteredGrades = scopeIds.stageId
    ? grades.filter((g) => g.stageId === scopeIds.stageId)
    : [];

  // Filter sections by selected grade
  const filteredSections = scopeIds.gradeId
    ? sections.filter((s) => s.gradeId === scopeIds.gradeId)
    : [];

  return (
    <div className="space-y-4">
      {/* Scope Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {tForm("scopeType")} <span className="text-red-500">*</span>
        </label>
        <Select
          value={scopeType}
          onChange={handleScopeTypeChange}
          options={scopeTypeOptions}
          disabled={disabled}
          error={errors.scopeType}
        />
      </div>

      {/* Stage Select (for STAGE, GRADE, SECTION) */}
      {(scopeType === "STAGE" || scopeType === "GRADE" || scopeType === "SECTION") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {tForm("stage")} <span className="text-red-500">*</span>
          </label>
          <Select
            value={scopeIds.stageId || ""}
            onChange={handleStageChange}
            options={stages.map((s) => ({
              value: s.id,
              label: locale === "ar" ? s.nameAr : s.nameEn,
            }))}
            placeholder={`${tCommon("select")} ${tForm("stage")}`}
            disabled={disabled}
            error={errors.stageId}
          />
        </div>
      )}

      {/* Grade Select (for GRADE, SECTION) */}
      {(scopeType === "GRADE" || scopeType === "SECTION") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {tForm("grade")} <span className="text-red-500">*</span>
          </label>
          <Select
            value={scopeIds.gradeId || ""}
            onChange={handleGradeChange}
            options={filteredGrades.map((g) => ({
              value: g.id,
              label: locale === "ar" ? g.nameAr : g.nameEn,
            }))}
            placeholder={`${tCommon("select")} ${tForm("grade")}`}
            disabled={disabled || !scopeIds.stageId}
            error={errors.gradeId}
          />
        </div>
      )}

      {/* Section Select (for SECTION) */}
      {scopeType === "SECTION" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {tForm("section")} <span className="text-red-500">*</span>
          </label>
          <Select
            value={scopeIds.sectionId || ""}
            onChange={handleSectionChange}
            options={filteredSections.map((s) => {
              const grade = grades.find((g) => g.id === s.gradeId);
              const gradeName = grade ? (locale === "ar" ? grade.nameAr : grade.nameEn) : "";
              const sectionName = locale === "ar" ? s.nameAr : s.nameEn;
              return {
                value: s.id,
                label: `${sectionName} — ${gradeName}`,
              };
            })}
            placeholder={`${tCommon("select")} ${tForm("section")}`}
            disabled={disabled || !scopeIds.gradeId}
            error={errors.sectionId}
          />
        </div>
      )}
    </div>
  );
}
