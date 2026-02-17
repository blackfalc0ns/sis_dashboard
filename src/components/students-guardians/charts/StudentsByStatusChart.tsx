// FILE: src/components/students-guardians/charts/StudentsByStatusChart.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import ChartFilter, { ChartFilterValues } from "../shared/ChartFilter";
import * as studentsService from "@/services/studentsService";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";

export default function StudentsByStatusChart() {
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

  // Calculate status data
  const statusData = useMemo(() => {
    const activeCount = filteredStudents.filter(
      (s) => s.status === "Active",
    ).length;
    const suspendedCount = filteredStudents.filter(
      (s) => s.status === "Suspended",
    ).length;
    const withdrawnCount = filteredStudents.filter(
      (s) => s.status === "Withdrawn",
    ).length;

    return [
      { status: t("status.active"), count: activeCount },
      { status: t("status.suspended"), count: suspendedCount },
      { status: t("status.withdrawn"), count: withdrawnCount },
    ];
  }, [filteredStudents, t]);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900">
        {t("charts.students_by_status")}
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
            dataset={statusData}
            xAxis={[{ scaleType: "band", dataKey: "status" }]}
            series={[
              {
                dataKey: "count",
                label: t("charts.students_label"),
                color: "#036b80",
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
