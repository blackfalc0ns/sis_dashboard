// FILE: src/components/students-guardians/shared/ChartFilter.tsx

"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";

export type DateRangeValue = "7" | "30" | "60" | "90" | "all" | "custom";

export interface ChartFilterValues {
  academicYear: string;
  term: string;
  dateRange: DateRangeValue;
  customStartDate: string;
  customEndDate: string;
}

interface ChartFilterProps {
  values: ChartFilterValues;
  onChange: (values: ChartFilterValues) => void;
  academicYears: string[];
  terms: string[];
  showAdvancedFilters?: boolean;
}

export default function ChartFilter({
  values,
  onChange,
  academicYears,
  terms,
  showAdvancedFilters = true,
}: ChartFilterProps) {
  const t = useTranslations("students_guardians.students");

  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    values.academicYear !== "all" || values.term !== "all";

  const clearFilters = () => {
    onChange({
      academicYear: "all",
      term: "all",
      dateRange: "all",
      customStartDate: "",
      customEndDate: "",
    });
  };

  const updateFilter = (key: keyof ChartFilterValues, value: string) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  return (
    <div className="space-y-3 flex items-center justify-between gap-10">
      {/* Filters Toggle */}
      {showAdvancedFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              showFilters
                ? "bg-[#036b80] text-white"
                : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
            }`}
          >
            <Filter className="w-4 h-4" />
            {t("filters")}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
              {t("clear")}
            </button>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showAdvancedFilters && showFilters && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("filter_labels.academic_year")}
            </label>
            <select
              value={values.academicYear}
              onChange={(e) => updateFilter("academicYear", e.target.value)}
              className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
            >
              <option value="all">{t("filter_options.all_years")}</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("filter_labels.term")}
            </label>
            <select
              value={values.term}
              onChange={(e) => updateFilter("term", e.target.value)}
              className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
            >
              <option value="all">{t("filter_options.all_terms")}</option>
              {terms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
