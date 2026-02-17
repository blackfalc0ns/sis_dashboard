// FILE: src/components/students-guardians/StudentsGuardiansDashboard.tsx

"use client";

import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import KPICard from "@/components/ui/common/KPICard";
import AbsenceHeatmap from "./charts/AbsenceHeatmap";
import StudentsByStatusChart from "./charts/StudentsByStatusChart";
import StudentsByGradeChart from "./charts/StudentsByGradeChart";
import RetentionCohortChart from "./charts/RetentionCohortChart";
import ChartFilter, { ChartFilterValues } from "./shared/ChartFilter";
import * as studentsService from "@/services/studentsService";

export default function StudentsGuardiansDashboard() {
  const t = useTranslations("students_guardians.overview");

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

  // Get unique academic years and terms for filter dropdowns
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

  // Filter students based on current filter values
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const academicYear = student.enrollment?.academicYear;
      const term = student.currentTerm?.term;

      // Apply academic year filter
      if (
        filterValues.academicYear !== "all" &&
        academicYear !== filterValues.academicYear
      ) {
        return false;
      }

      // Apply term filter
      if (filterValues.term !== "all" && term !== filterValues.term) {
        return false;
      }

      return true;
    });
  }, [allStudents, filterValues]);

  // Calculate KPIs from filtered data
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const active = filteredStudents.filter((s) => s.status === "Active").length;
    const suspended = filteredStudents.filter(
      (s) => s.status === "Suspended",
    ).length;
    const withdrawn = filteredStudents.filter(
      (s) => s.status === "Withdrawn",
    ).length;

    const atRisk = filteredStudents.filter(
      (s) => s.ytdPerformance && s.ytdPerformance.riskFlags.length > 0,
    ).length;

    // Calculate average attendance
    const studentsWithAttendance = filteredStudents.filter(
      (s) => s.ytdPerformance?.attendance,
    );
    const avgAttendance =
      studentsWithAttendance.length > 0
        ? Math.round(
            studentsWithAttendance.reduce(
              (sum, s) => sum + (s.ytdPerformance?.attendance || 0),
              0,
            ) / studentsWithAttendance.length,
          )
        : 0;

    // Calculate average grade
    const studentsWithGrades = filteredStudents.filter(
      (s) => s.ytdPerformance?.gradeAverage,
    );
    const avgGrade =
      studentsWithGrades.length > 0
        ? Math.round(
            studentsWithGrades.reduce(
              (sum, s) => sum + (s.ytdPerformance?.gradeAverage || 0),
              0,
            ) / studentsWithGrades.length,
          )
        : 0;

    return {
      total,
      active,
      suspended,
      withdrawn,
      atRisk,
      avgAttendance,
      avgGrade,
    };
  }, [filteredStudents]);

  // Risk flag distribution - filtered
  const riskDistribution = useMemo(() => {
    const distribution = {
      attendance: 0,
      grades: 0,
      behavior: 0,
    };

    filteredStudents.forEach((student) => {
      if (student.ytdPerformance?.riskFlags) {
        student.ytdPerformance.riskFlags.forEach(
          (flag: "attendance" | "grades" | "behavior") => {
            if (flag === "attendance") distribution.attendance++;
            if (flag === "grades") distribution.grades++;
            if (flag === "behavior") distribution.behavior++;
          },
        );
      }
    });

    return distribution;
  }, [filteredStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* Chart Filter */}
      <ChartFilter
        values={filterValues}
        onChange={setFilterValues}
        academicYears={academicYears}
        terms={terms}
        showAdvancedFilters={true}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title={t("kpis.total_students")}
          value={stats.total}
          icon={Users}
          numbers={t("kpis.active_count", { count: stats.active })}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("kpis.active_students")}
          value={stats.active}
          icon={UserCheck}
          numbers={t("kpis.currently_enrolled")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("kpis.at_risk_students")}
          value={stats.atRisk}
          icon={AlertTriangle}
          numbers={t("kpis.need_attention")}
          iconBgColor="bg-red-500"
        />
        <KPICard
          title={t("kpis.avg_attendance")}
          value={`${stats.avgAttendance}%`}
          icon={TrendingUp}
          numbers={
            stats.avgAttendance >= 90 ? t("kpis.good") : t("kpis.below_target")
          }
          iconBgColor="bg-purple-500"
        />
        <KPICard
          title={t("kpis.avg_grade")}
          value={`${stats.avgGrade}%`}
          icon={GraduationCap}
          numbers={t("kpis.overall_performance")}
          iconBgColor="bg-indigo-500"
        />
        <KPICard
          title={t("kpis.withdrawn")}
          value={stats.withdrawn}
          icon={UserX}
          numbers={t("kpis.this_year")}
          iconBgColor="bg-gray-500"
        />
      </div>

      {/* Charts Section 1: Status and Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentsByStatusChart />
        <StudentsByGradeChart />
      </div>

      {/* Charts Section 2: Retention and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RetentionCohortChart />
        <AbsenceHeatmap />
      </div>

      {/* Risk Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t("risk.title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">
                  {t("risk.attendance_risk")}
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {riskDistribution.attendance}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  {t("risk.low_grades")}
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {riskDistribution.grades}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">
                  {t("risk.behavior_issues")}
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {riskDistribution.behavior}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
