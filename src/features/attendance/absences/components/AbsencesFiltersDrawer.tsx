"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import { X, Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import type { AbsencesFilters, AttendanceIncidentType } from "../types";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";

interface AbsencesFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AbsencesFilters;
  onFiltersChange: (filters: Partial<AbsencesFilters>) => void;
  onClearFilters: () => void;
  onExport: () => void;
  structureTree: StructureTree | null;
}

export default function AbsencesFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  onExport,
  structureTree,
}: AbsencesFiltersDrawerProps) {
  const t = useTranslations("attendance.absences.filters");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  // Local draft state for mobile - only apply on "Apply" button
  const [draftFilters, setDraftFilters] = useState<AbsencesFilters>(filters);

  // Update draft when filters change externally
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

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
  const availableGrades = draftFilters.scopeIds?.stageId 
    ? structureTree?.grades.filter(g => g.stageId === draftFilters.scopeIds?.stageId) || []
    : [];
  const availableSections = draftFilters.scopeIds?.gradeId
    ? structureTree?.sections.filter(s => s.gradeId === draftFilters.scopeIds?.gradeId) || []
    : [];

  const handleDraftChange = (changes: Partial<AbsencesFilters>) => {
    setDraftFilters(prev => ({ ...prev, ...changes }));
  };

  const handleScopeTypeChange = (scopeType: string) => {
    handleDraftChange({ 
      scopeType: scopeType as "SCHOOL" | "STAGE" | "GRADE" | "SECTION",
      scopeIds: {} // Reset scope IDs when type changes
    });
  };

  const handleScopeIdChange = (level: "stageId" | "gradeId" | "sectionId", value: string) => {
    const newScopeIds = { ...draftFilters.scopeIds };
    
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

    handleDraftChange({ scopeIds: newScopeIds });
  };

  const handleApply = () => {
    onFiltersChange(draftFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: AbsencesFilters = {
      scopeType: "SCHOOL",
      status: "ALL",
      granularities: ["PERIOD"],
      onlyUnexcused: false,
      search: "",
    };
    setDraftFilters(resetFilters);
    onClearFilters();
  };

  const handleExport = () => {
    onExport();
    onClose();
  };

  return (
    <Drawer anchor="bottom" open={isOpen} onClose={onClose}>
      <div className="h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <div
          className="flex items-center justify-between p-4 border-b shrink-0"
          style={{
            backgroundColor: "var(--card-background)",
            borderColor: "var(--border-color)",
          }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("filters")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("search")}
              </label>
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={draftFilters.search}
                onChange={(e) => handleDraftChange({ search: e.target.value })}
              />
            </div>

            {/* Scope Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {t("scope")}
              </h4>
              
              {/* Scope Type */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                  {t("scopeType")}
                </label>
                <Select
                  value={draftFilters.scopeType}
                  onChange={handleScopeTypeChange}
                  options={scopeTypeOptions}
                  selectSize="sm"
                />
              </div>

              {/* Stage Selection */}
              {(draftFilters.scopeType === "STAGE" || draftFilters.scopeType === "GRADE" || draftFilters.scopeType === "SECTION") && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    {t("stage")}
                  </label>
                  <Select
                    value={draftFilters.scopeIds?.stageId || ""}
                    onChange={(value) => handleScopeIdChange("stageId", value)}
                    options={[
                      { value: "", label: t("selectStage") },
                      ...availableStages.map(stage => ({
                        value: stage.id,
                        label: locale === "ar" ? stage.nameAr : stage.nameEn
                      }))
                    ]}
                    selectSize="sm"
                  />
                </div>
              )}

              {/* Grade Selection */}
              {(draftFilters.scopeType === "GRADE" || draftFilters.scopeType === "SECTION") && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    {t("grade")}
                  </label>
                  <Select
                    value={draftFilters.scopeIds?.gradeId || ""}
                    onChange={(value) => handleScopeIdChange("gradeId", value)}
                    options={[
                      { value: "", label: t("selectGrade") },
                      ...availableGrades.map(grade => ({
                        value: grade.id,
                        label: locale === "ar" ? grade.nameAr : grade.nameEn
                      }))
                    ]}
                    selectSize="sm"
                    disabled={!draftFilters.scopeIds?.stageId}
                  />
                </div>
              )}

              {/* Section Selection */}
              {draftFilters.scopeType === "SECTION" && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    {t("section")}
                  </label>
                  <Select
                    value={draftFilters.scopeIds?.sectionId || ""}
                    onChange={(value) => handleScopeIdChange("sectionId", value)}
                    options={[
                      { value: "", label: t("selectSection") },
                      ...availableSections.map(section => ({
                        value: section.id,
                        label: locale === "ar" ? section.nameAr : section.nameEn
                      }))
                    ]}
                    selectSize="sm"
                    disabled={!draftFilters.scopeIds?.gradeId}
                  />
                </div>
              )}
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("dateFrom")}
              </label>
              <DatePicker
                value={draftFilters.dateFrom ? new Date(draftFilters.dateFrom) : null}
                onChange={(value) => handleDraftChange({ dateFrom: value ? value.toISOString().split('T')[0] : undefined })}
                placeholder={t("dateFrom")}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("dateTo")}
              </label>
              <DatePicker
                value={draftFilters.dateTo ? new Date(draftFilters.dateTo) : null}
                onChange={(value) => handleDraftChange({ dateTo: value ? value.toISOString().split('T')[0] : undefined })}
                placeholder={t("dateTo")}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("status")}
              </label>
              <Select
                value={draftFilters.status}
                onChange={(value) => handleDraftChange({ status: value as "ALL" | AttendanceIncidentType })}
                options={statusOptions}
                selectSize="sm"
              />
            </div>

            {/* Only Unexcused */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={draftFilters.onlyUnexcused}
                onChange={(e) => handleDraftChange({ onlyUnexcused: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {t("onlyUnexcused")}
              </span>
            </label>
          </div>
        </div>

        {/* Fixed Footer */}
        <div
          className="flex items-center gap-3 p-4 border-t shrink-0"
          style={{
            backgroundColor: "var(--card-background)",
            borderColor: "var(--border-color)",
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1"
          >
            {tCommon("reset")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
            className="flex-1"
          >
            {t("export")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="flex-1"
          >
            {tCommon("apply")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}