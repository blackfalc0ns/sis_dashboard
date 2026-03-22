// Presenter component for Students & Guardians Dashboard
// Pure presentation - receives data via props, no business logic

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
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import AbsenceHeatmap from "../components/charts/AbsenceHeatmap";
import StudentsByStatusChart from "../components/charts/StudentsByStatusChart";
import StudentsByGradeChart from "../components/charts/StudentsByGradeChart";
import RetentionCohortChart from "../components/charts/RetentionCohortChart";
import PassFailRatioChart from "../components/charts/PassFailRatioChart";
import type { StudentStats, RiskDistribution } from "@/features/students-guardians/dashboard/utils/studentStatsCalculator";

interface StudentsGuardiansDashboardViewProps {
  stats: StudentStats;
  riskDistribution: RiskDistribution;
}

export default function StudentsGuardiansDashboardView({
  stats,
  riskDistribution,
}: StudentsGuardiansDashboardViewProps) {
  const t = useTranslations("students_guardians.overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={t("kpis.total_students")}
          value={stats.total}
          subtitle={t("kpis.active_count", { count: stats.active })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={stats.totalTrend}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("kpis.active_students")}
          value={stats.active}
          subtitle={t("kpis.currently_enrolled")}
          icon={UserCheck}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={stats.activeTrend}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("kpis.at_risk_students")}
          value={stats.atRisk}
          subtitle={t("kpis.need_attention")}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={stats.atRiskTrend}
          chartColor="#ef4444"
        />
        <KPICardV2
          title={t("kpis.avg_attendance")}
          value={`${stats.avgAttendance}%`}
          subtitle={
            stats.avgAttendance >= 90 ? t("kpis.good") : t("kpis.below_target")
          }
          icon={TrendingUp}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={stats.attendanceTrend}
          chartColor="#8b5cf6"
        />
        <KPICardV2
          title={t("kpis.avg_grade")}
          value={`${stats.avgGrade}%`}
          subtitle={t("kpis.overall_performance")}
          icon={GraduationCap}
          iconColor="#6366f1"
          iconBgColor="#e0e7ff"
          chartData={stats.gradeTrend}
          chartColor="#6366f1"
        />
        <KPICardV2
          title={t("kpis.withdrawn")}
          value={stats.withdrawn}
          subtitle={t("kpis.this_year")}
          icon={UserX}
          iconColor="#6b7280"
          iconBgColor="#f3f4f6"
          chartData={stats.withdrawnTrend}
          chartColor="#6b7280"
        />
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

      {/* Charts Section 1: Status and Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentsByStatusChart />
        <StudentsByGradeChart />
      </div>

      {/* Charts Section 2: Pass/Fail and Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PassFailRatioChart />
        <RetentionCohortChart />
      </div>

      {/* Charts Section 3: Attendance */}
      <div className="grid grid-cols-1 gap-6">
        <AbsenceHeatmap />
      </div>
    </div>
  );
}
