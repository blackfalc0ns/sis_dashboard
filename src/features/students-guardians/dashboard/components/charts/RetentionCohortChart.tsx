// FILE: src/components/students-guardians/charts/RetentionCohortChart.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import ChartFilter, { ChartFilterValues } from "../../../shared/ChartFilter";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

export default function RetentionCohortChart() {
  const t = useTranslations("students_guardians.overview");
  const { height, leftMargin } = useResponsiveChart();

  // Filter state
  const [filterValues, setFilterValues] = useState<ChartFilterValues>({
    academicYear: "all",
    term: "all",
    dateRange: "all",
    customStartDate: "",
    customEndDate: "",
  });

  // Get all students
  const allStudents = useMemo(
    () => studentsService.getStudentsWithEnrollment(),
    [],
  );

  // Get unique academic years and terms
  const { academicYears, terms } = useMemo(() => {
    const years = new Set<string>();
    const termSet = new Set<string>();

    allStudents.forEach((student) => {
      if (student.enrollment?.academicYear) {
        years.add(student.enrollment.academicYear);
      }
      if (student.currentTerm?.term) {
        termSet.add(student.currentTerm.term);
      }
    });

    return {
      academicYears: Array.from(years).sort(),
      terms: Array.from(termSet).sort(),
    };
  }, [allStudents]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const academicYear = student.enrollment?.academicYear;
      const term = student.currentTerm?.term;

      if (
        filterValues.academicYear !== "all" &&
        academicYear !== filterValues.academicYear
      ) {
        return false;
      }

      if (filterValues.term !== "all" && term !== filterValues.term) {
        return false;
      }

      return true;
    });
  }, [allStudents, filterValues]);

  // Calculate retention data by academic year
  const retentionData = useMemo(() => {
    // Group students by academic year
    const yearGroups: Record<string, { total: number; retained: number }> = {};

    filteredStudents.forEach((student) => {
      const year = student.enrollment?.academicYear;
      if (year) {
        if (!yearGroups[year]) {
          yearGroups[year] = { total: 0, retained: 0 };
        }
        yearGroups[year].total++;
        if (student.status === "Active") {
          yearGroups[year].retained++;
        }
      }
    });

    // Convert to chart format
    return Object.entries(yearGroups)
      .map(([year, data]) => ({
        year,
        retained: Math.round((data.retained / data.total) * 100),
        left: Math.round(((data.total - data.retained) / data.total) * 100),
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [filteredStudents]);

  // Fallback to mock data if no filtered data
  const chartData =
    retentionData.length > 0
      ? retentionData
      : [
          { year: "2023-24", retained: 95, left: 5 },
          { year: "2024-25", retained: 92, left: 8 },
          { year: "2025-26", retained: 94, left: 6 },
        ];

  // Period options for ChartCard
  const periodOptions: DropdownItem[] = [
    { label: t("filters.all_time"), value: "all" },
    { label: t("filters.this_year"), value: "year" },
    { label: t("filters.this_term"), value: "term" },
  ];

  return (
    <ChartCard
      title={t("charts.retention_cohort")}
      description={t("charts.retention_cohort_desc")}
      showPeriodFilter={true}
      periodOptions={periodOptions}
      defaultPeriod="all"
      bgColor="#ede9fe"
    >
      {/* Chart Filter */}
      <ChartFilter
        values={filterValues}
        onChange={setFilterValues}
        academicYears={academicYears}
        terms={terms}
        showAdvancedFilters={true}
      />

      {/* Chart */}
      <div className="h-64 sm:h-80 w-full overflow-x-auto overflow-y-hidden mt-4">
        <div className="min-w-[300px]">
          <BarChart
            dataset={chartData}
            xAxis={[{ scaleType: "band", dataKey: "year" }]}
            series={[
              {
                dataKey: "retained",
                label: t("charts.retained"),
                color: "#10b981",
                stack: "total",
              },
              {
                dataKey: "left",
                label: t("charts.left"),
                color: "#ef4444",
                stack: "total",
              },
            ]}
            height={height}
            margin={{
              top: 20,
              bottom: 40,
              left: leftMargin,
              right: 20,
            }}
          />
        </div>
      </div>
    </ChartCard>
  );
}
