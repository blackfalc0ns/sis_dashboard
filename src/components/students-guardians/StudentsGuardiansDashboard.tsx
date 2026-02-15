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
import KPICard from "@/components/ui/common/KPICard";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useMemo } from "react";
import * as studentsService from "@/services/studentsService";

export default function StudentsGuardiansDashboard() {
  const t = useTranslations("students_guardians.overview");

  // Calculate KPIs using service
  const stats = studentsService.getStudentStatistics();

  // Students by status
  const statusData = useMemo(() => {
    return [
      {
        status: t("status.active"),
        count: studentsService.getStudentsByStatus("Active").length,
      },
      {
        status: t("status.suspended"),
        count: studentsService.getStudentsByStatus("Suspended").length,
      },
      {
        status: t("status.withdrawn"),
        count: studentsService.getStudentsByStatus("Withdrawn").length,
      },
    ];
  }, [t]);

  // Students by grade using service
  const gradeData = useMemo(() => {
    const distribution = studentsService.getGradeDistribution();
    return Object.entries(distribution).map(([grade, count]) => ({
      id: grade,
      label: grade,
      value: count,
    }));
  }, []);

  // Risk flag distribution using service
  const riskDistribution = studentsService.getRiskFlagDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

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
        {/* Students by Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("charts.students_by_status")}
          </h3>
          <div className="h-80">
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
              height={300}
              margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
            />
          </div>
        </div>

        {/* Students by Grade */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("charts.students_by_grade")}
          </h3>
          <div className="h-80 flex items-center justify-center">
            <PieChart
              series={[
                {
                  data: gradeData,
                  highlightScope: { fade: "global", highlight: "item" },
                },
              ]}
              height={300}
              width={400}
              margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Charts Section 2: Retention and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Retention Cohort */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("charts.retention_cohort")}
          </h3>
          <div className="h-80">
            <BarChart
              dataset={[
                { year: "2023-24", retained: 95, left: 5 },
                { year: "2024-25", retained: 92, left: 8 },
                { year: "2025-26", retained: 94, left: 6 },
              ]}
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
              height={300}
              margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
            />
          </div>
        </div>

        {/* Absence Heatmap */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("charts.absence_heatmap")}
          </h3>
          <div className="h-80 overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Heatmap Header */}
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="text-xs font-medium text-gray-600"></div>
                {[
                  t("days.mon"),
                  t("days.tue"),
                  t("days.wed"),
                  t("days.thu"),
                  t("days.fri"),
                ].map((day) => (
                  <div
                    key={day}
                    className="text-xs font-medium text-gray-600 text-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Heatmap Rows */}
              {[
                { week: t("weeks.week_1"), data: [2, 3, 1, 4, 2] },
                { week: t("weeks.week_2"), data: [3, 2, 5, 3, 4] },
                { week: t("weeks.week_3"), data: [1, 4, 2, 2, 3] },
                { week: t("weeks.week_4"), data: [4, 3, 3, 5, 6] },
                { week: t("weeks.week_5"), data: [2, 1, 4, 3, 2] },
                { week: t("weeks.week_6"), data: [3, 5, 2, 4, 3] },
              ].map((row) => (
                <div key={row.week} className="grid grid-cols-6 gap-2 mb-2">
                  <div className="text-xs font-medium text-gray-600 flex items-center">
                    {row.week}
                  </div>
                  {row.data.map((value, idx) => {
                    const intensity =
                      value <= 2
                        ? "bg-green-100 text-green-800"
                        : value <= 4
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800";
                    return (
                      <div
                        key={idx}
                        className={`h-12 rounded flex items-center justify-center text-sm font-semibold ${intensity}`}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 text-xs">
                <span className="text-gray-600">{t("heatmap.absences")}:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span className="text-gray-600">{t("heatmap.low")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                  <span className="text-gray-600">{t("heatmap.medium")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span className="text-gray-600">{t("heatmap.high")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
