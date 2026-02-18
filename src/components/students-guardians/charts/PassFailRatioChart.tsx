// FILE: src/components/students-guardians/charts/PassFailRatioChart.tsx

"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import ChartFilter, { ChartFilterValues } from "../shared/ChartFilter";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import * as studentsService from "@/services/studentsService";

export default function PassFailRatioChart() {
  const t = useTranslations(
    "students_guardians.overview.charts.pass_fail_ratio",
  );
  const { height } = useResponsiveChart();

  // Filter state
  const [filterValues, setFilterValues] = useState<ChartFilterValues>({
    academicYear: "all",
    term: "all",
    dateRange: "all",
    customStartDate: "",
    customEndDate: "",
  });

  // Get all students with enrollment data
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

  // Filter and calculate pass/fail data
  const chartData = useMemo(() => {
    const filteredStudents = allStudents.filter((student) => {
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

    // Calculate pass/fail based on grade average (passing grade >= 50%)
    const PASSING_GRADE = 50;
    let passCount = 0;
    let failCount = 0;

    filteredStudents.forEach((student) => {
      const gradeAverage = student.ytdPerformance?.gradeAverage;
      if (gradeAverage !== undefined) {
        if (gradeAverage >= PASSING_GRADE) {
          passCount++;
        } else {
          failCount++;
        }
      }
    });

    const total = passCount + failCount;
    const passPercentage =
      total > 0 ? ((passCount / total) * 100).toFixed(1) : "0";

    return {
      data: [
        { id: 0, value: passCount, label: t("pass"), color: "#10b981" },
        { id: 1, value: failCount, label: t("fail"), color: "#ef4444" },
      ],
      total,
      passCount,
      failCount,
      passPercentage,
    };
  }, [allStudents, filterValues, t]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-(--main-box-shadow)">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{t("title")}</h3>
        <p className="text-xs text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <ChartFilter
          values={filterValues}
          onChange={setFilterValues}
          academicYears={academicYears}
          terms={terms}
          showAdvancedFilters={false}
        />
      </div>

      {/* Chart */}
      {chartData.total > 0 ? (
        <>
          <div className="flex justify-center">
            <PieChart
              series={[
                {
                  data: chartData.data,
                },
              ]}
              height={height}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {t("total_students")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {chartData.total}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("pass_rate")}</p>
              <p className="text-2xl font-bold text-green-600">
                {chartData.passPercentage}%
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      )}
    </div>
  );
}
