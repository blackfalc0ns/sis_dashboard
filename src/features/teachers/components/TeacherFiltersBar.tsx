"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, FilterPanel, Input, Select } from "@/components/ui";
import type { TeacherFilters, TeacherReferenceData } from "@/features/teachers/types";
import { getLocalizedReferenceLabel } from "@/features/teachers/utils/teacherMappers";

interface TeacherFiltersBarProps {
  filters: TeacherFilters;
  referenceData: TeacherReferenceData;
  showFilters: boolean;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  onToggleFilters: () => void;
  onFilterChange: (key: keyof TeacherFilters, value: string) => void;
  onClearFilters: () => void;
}

export default function TeacherFiltersBar({
  filters,
  referenceData,
  showFilters,
  hasActiveFilters,
  filteredCount,
  totalCount,
  onToggleFilters,
  onFilterChange,
  onClearFilters,
}: TeacherFiltersBarProps) {
  const t = useTranslations("teachers");
  const locale = useLocale();
  const displayLocale = locale === "ar" ? "ar" : "en";

  const filteredGrades = filters.stageId
    ? referenceData.grades.filter((grade) => grade.stageId === filters.stageId)
    : referenceData.grades;

  return (
    <FilterPanel
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      hasActiveFilters={hasActiveFilters}
      toggleTitle={t("filters.title")}
      toggleAriaLabel={t("filters.title")}
      clearAction={null}
      className="bg-transparent p-0 shadow-none"
      searchSlot={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
              placeholder={t("filters.search_placeholder")}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="text-sm text-gray-500">
            {t("filters.results", { filteredCount, totalCount })}
          </div>
          {hasActiveFilters ? (
            <Button
              variant="outline"
              leftIcon={<X className="h-4 w-4" />}
              onClick={onClearFilters}
            >
              {t("filters.clear")}
            </Button>
          ) : null}
        </div>
      }
      filtersSlot={
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label={t("filters.status")}
            value={filters.status}
            onChange={(value) => onFilterChange("status", value)}
            options={[
              { value: "ALL", label: t("filters.all_statuses") },
              { value: "ACTIVE", label: t("status.active") },
              { value: "INACTIVE", label: t("status.inactive") },
            ]}
          />
          <Select
            label={t("filters.gender")}
            value={filters.gender}
            onChange={(value) => onFilterChange("gender", value)}
            options={[
              { value: "ALL", label: t("filters.all_genders") },
              { value: "MALE", label: t("gender.male") },
              { value: "FEMALE", label: t("gender.female") },
            ]}
          />
          <Select
            label={t("filters.subject")}
            value={filters.subjectId}
            onChange={(value) => onFilterChange("subjectId", value)}
            options={[
              { value: "", label: t("filters.all_subjects") },
              ...referenceData.subjects.map((subject) => ({
                value: subject.id,
                label: getLocalizedReferenceLabel(subject, displayLocale),
              })),
            ]}
          />
          <Select
            label={t("filters.stage")}
            value={filters.stageId}
            onChange={(value) => onFilterChange("stageId", value)}
            options={[
              { value: "", label: t("filters.all_stages") },
              ...referenceData.stages.map((stage) => ({
                value: stage.id,
                label: getLocalizedReferenceLabel(stage, displayLocale),
              })),
            ]}
          />
          <Select
            label={t("filters.grade")}
            value={filters.gradeId}
            onChange={(value) => onFilterChange("gradeId", value)}
            options={[
              { value: "", label: t("filters.all_grades") },
              ...filteredGrades.map((grade) => ({
                value: grade.id,
                label: getLocalizedReferenceLabel(grade, displayLocale),
              })),
            ]}
            disabled={Boolean(filters.stageId) && filteredGrades.length === 0}
          />
        </div>
      }
    />
  );
}
