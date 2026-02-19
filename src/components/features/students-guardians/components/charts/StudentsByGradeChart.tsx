// FILE: src/components/students-guardians/charts/StudentsByGradeChart.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PieChart } from "@mui/x-charts/PieChart";
import ChartFilter, { ChartFilterValues } from "../shared/ChartFilter";
import * as studentsService from "@/services/studentsService";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

export default function StudentsByGradeChart() {
  const t = useTranslations("students_guardians.overview");
  const { height, width } = useResponsiveChart();

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

  // Calculate grade data
  const gradeData = useMemo(() => {
    const gradeCount: Record<string, number> = {};

    filteredStudents.forEach((student) => {
      const grade = student.enrollment?.grade || student.gradeRequested;
      if (grade) {
        gradeCount[grade] = (gradeCount[grade] || 0) + 1;
      }
    });

    return Object.entries(gradeCount).map(([grade, count]) => ({
      id: grade,
      label: grade,
      value: count,
    }));
  }, [filteredStudents]);

  // Period options for ChartCard
  const periodOptions: DropdownItem[] = [
    { label: t("filters.all_time"), value: "all" },
    { label: t("filters.this_year"), value: "year" },
    { label: t("filters.this_term"), value: "term" },
  ];

  return (
    <ChartCard
      title={t("charts.students_by_grade")}
      description={t("charts.students_by_grade_desc")}
      showPeriodFilter={true}
      periodOptions={periodOptions}
      defaultPeriod="all"
      bgColor="#d1fae5"
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
      <div className="h-64 sm:h-80 w-full flex items-center justify-center overflow-x-auto overflow-y-hidden mt-4">
        {gradeData.length > 0 ? (
          <div className="min-w-[280px]">
            <PieChart
              series={[
                {
                  data: gradeData,
                  highlightScope: { fade: "global", highlight: "item" },
                },
              ]}
              height={height}
              width={width}
              margin={{
                top: 10,
                bottom: 10,
                left: 10,
                right: 10,
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-sm">{t("charts.no_data")}</p>
        )}
      </div>
    </ChartCard>
  );
}
