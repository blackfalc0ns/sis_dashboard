"use client";

import { useTranslations, useLocale } from "next-intl";
import { Search, X, Download } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import type { AbsencesFilters, AttendanceIncidentType } from "../types";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";

interface AbsencesFiltersBarProps {
  filters: AbsencesFilters;
  onFiltersChange: (filters: Partial<AbsencesFilters>) => void;
  onClearFilters: () => void;
  onExport: () => void;
  isReadOnly: boolean;
  structureTree: StructureTree | null;
}

export default function AbsencesFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  onExport,
  structureTree,
}: AbsencesFiltersBarProps) {
  const t = useTranslations("attendance.absences.filters");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const statusOptions: { value: "ALL" | AttendanceIncidentType; label: string }[] = [
    { value: "ALL", label: t("allStatuses") },
    { value: "ABSENT", label: t("absent") },
    { value: "LATE", label: t("late") },
    { value: "EARLY_LEAVE", label: t("earlyLeave") },
    { value: "EXCUSED", label: t("excused") },
    { value: "UNMARKED", label: t("unmarked") },
  ];

  const scopeTypeOptions = [
    { value: "SCHOOL", label: t("scopeTypes.school") },
    { value: "STAGE", label: t("scopeTypes.stage") },
    { value: "GRADE", label: t("scopeTypes.grade") },
    { value: "SECTION", label: t("scopeTypes.section") },
  ];

  // Get available stages, grades, sections based on current selection
  const availableStages = structureTree?.stages || [];
  const availableGrades = filters.scopeIds?.stageId 
    ? structureTree?.grades.filter(g => g.stageId === filters.scopeIds?.stageId) || []
    : [];
  const availableSections = filters.scopeIds?.gradeId
    ? structureTree?.sections.filter(s => s.gradeId === filters.scopeIds?.gradeId) || []
    : [];

  const handleScopeTypeChange = (scopeType: string) => {
    onFiltersChange({ 
      scopeType: scopeType as "SCHOOL" | "STAGE" | "GRADE" | "SECTION",
      scopeIds: {} // Reset scope IDs when type changes
    });
  };

  const handleScopeIdChange = (level: "stageId" | "gradeId" | "sectionId", value: string) => {
    const newScopeIds = { ...filters.scopeIds };
    
    if (level === "stageId") {
      newScopeIds.stageId = value;
      // Reset dependent selections
      delete newScopeIds.gradeId;
      delete newScopeIds.sectionId;
    } else if (level === "gradeId") {
      newScopeIds.gradeId = value;
      // Reset dependent selections
      delete newScopeIds.sectionId;
    } else {
      newScopeIds.sectionId = value;
    }

    onFiltersChange({ scopeIds: newScopeIds });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
          style={{ color: "var(--text-muted)" }} 
        />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Scope Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {t("scope")}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Scope Type */}
          <Select
            label={t("scopeType")}
            value={filters.scopeType}
            onChange={handleScopeTypeChange}
            options={scopeTypeOptions}
            selectSize="sm"
          />

          {/* Stage Selection */}
          {(filters.scopeType === "STAGE" || filters.scopeType === "GRADE" || filters.scopeType === "SECTION") && (
            <Select
              label={t("stage")}
              value={filters.scopeIds?.stageId || ""}
              onChange={(value) => handleScopeIdChange("stageId", value)}
              options={[
                { value: "", label: t("selectStage") },
                ...availableStages.map(stage => ({
                  value: stage.id,
                  label: locale === "ar" ? stage.nameAr : stage.nameEn
                }))
              ]}
              selectSize="sm"
              required
            />
          )}

          {/* Grade Selection */}
          {(filters.scopeType === "GRADE" || filters.scopeType === "SECTION") && (
            <Select
              label={t("grade")}
              value={filters.scopeIds?.gradeId || ""}
              onChange={(value) => handleScopeIdChange("gradeId", value)}
              options={[
                { value: "", label: t("selectGrade") },
                ...availableGrades.map(grade => ({
                  value: grade.id,
                  label: locale === "ar" ? grade.nameAr : grade.nameEn
                }))
              ]}
              selectSize="sm"
              disabled={!filters.scopeIds?.stageId}
              required
            />
          )}

          {/* Section Selection */}
          {filters.scopeType === "SECTION" && (
            <Select
              label={t("section")}
              value={filters.scopeIds?.sectionId || ""}
              onChange={(value) => handleScopeIdChange("sectionId", value)}
              options={[
                { value: "", label: t("selectSection") },
                ...availableSections.map(section => ({
                  value: section.id,
                  label: locale === "ar" ? section.nameAr : section.nameEn
                }))
              ]}
              selectSize="sm"
              disabled={!filters.scopeIds?.gradeId}
              required
            />
          )}
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Date From */}
        <DatePicker
          label={t("dateFrom")}
          value={filters.dateFrom ? new Date(filters.dateFrom) : null}
          onChange={(value) => onFiltersChange({ dateFrom: value ? value.toISOString().split('T')[0] : undefined })}
          placeholder={t("dateFrom")}
        />

        {/* Date To */}
        <DatePicker
          label={t("dateTo")}
          value={filters.dateTo ? new Date(filters.dateTo) : null}
          onChange={(value) => onFiltersChange({ dateTo: value ? value.toISOString().split('T')[0] : undefined })}
          placeholder={t("dateTo")}
        />

        {/* Status Single-Select */}
        <Select
          label={t("status")}
          value={filters.status}
          onChange={(value) => onFiltersChange({ status: value as "ALL" | AttendanceIncidentType })}
          options={statusOptions}
          selectSize="sm"
        />
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Only Unexcused Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyUnexcused}
            onChange={(e) => onFiltersChange({ onlyUnexcused: e.target.checked })}
            className="w-4 h-4 rounded text-primary focus:ring-primary"
            style={{ borderColor: "var(--color-neutral-300)" }}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("onlyUnexcused")}
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<X className="w-4 h-4" />}
            onClick={onClearFilters}
          >
            {tCommon("reset")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={onExport}
          >
            {t("export")}
          </Button>
        </div>
      </div>
    </div>
  );
}