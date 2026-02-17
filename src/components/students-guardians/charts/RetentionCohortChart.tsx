// FILE: src/components/students-guardians/charts/RetentionCohortChart.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import ChartFilter, { ChartFilterValues } from "../shared/ChartFilter";
import * as studentsService from "@/services/studentsService";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";

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

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900">
        {t("charts.retention_cohort")}
      </h3>

      {/* Chart Filter */}
      <ChartFilter
        values={filterValues}
        onChange={setFilterValues}
        academicYears={academicYears}
        terms={terms}
        showAdvancedFilters={true}
      />

      {/* Chart */}
      <div className="h-64 sm:h-80 w-full overflow-x-auto overflow-y-hidden">
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
    </div>
  );
}
