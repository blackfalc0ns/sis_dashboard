// Presenter component for School Dashboard
// Pure presentation - receives data via props, no business logic

"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BookOpen,
  MapPin,
  TrendingDown,
  Users,
} from "lucide-react";

import AcademicPerformanceCard from "../components/charts/AcademicPerformanceCard";
import { KPICardV2 } from "@/components/ui/kpi-card";
import PassFailRatioChart from "@/features/students-guardians/dashboard/components/charts/PassFailRatioChart";

import ActivitiesCard from "../components/ActivitiesCard";
import AttendanceCard from "../components/AttendanceCard";
import FilterBar from "../components/FilterBar";
import QuickActionPanel from "../components/QuickActionPanel";

import CriticalAlerts from "../components/alerts/CriticalAlerts";
import TodayMonitoring from "../components/monitoring/TodayMonitoring";

import AttendanceTrendChart from "../components/charts/AttendanceTrendChart";
import StudentsPerGradeChart from "../components/charts/StudentsPerGradeChart";
import ReinforcementSummaryWidget from "@/features/reinforcement/views/ReinforcementSummaryWidget";

import type { DashboardSnapshot } from "@/features/dashboard/utils/dashboardStatsCalculator";

const AbsenceReasonsChart = dynamic(
  () => import("../components/charts/AbsenceReasonsChart"),
  { ssr: false }
);

interface SchoolDashboardViewProps {
  dashboardSnapshot: DashboardSnapshot;
  reinforcementSummary: {
    inProgress: number;
    notCompleted: number;
    completionRate: number;
  } | null;
}

export default function SchoolDashboardView({
  dashboardSnapshot,
  reinforcementSummary,
}: SchoolDashboardViewProps) {
  const tKpi = useTranslations("kpi");

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <FilterBar
        exportData={dashboardSnapshot.exportData}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICardV2
          title={tKpi("total_students")}
          value={dashboardSnapshot.kpis.totalStudents}
          icon={Users}
          iconColor="#036b80"
          iconBgColor="#e0f2f5"
          chartData={dashboardSnapshot.chartData.students}
          chartColor="#036b80"
          change={{
            value: dashboardSnapshot.kpis.activeStudents,
            percentage: Math.max(
              1,
              (dashboardSnapshot.kpis.activeStudents /
                Math.max(dashboardSnapshot.kpis.totalStudents, 1)) *
                100
            ),
            isPositive: true,
          }}
        />

        <KPICardV2
          title={tKpi("today_attendance_rate")}
          value={dashboardSnapshot.kpis.avgAttendance}
          valueSuffix="%"
          icon={Users}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={dashboardSnapshot.chartData.attendance}
          chartColor="#10b981"
          change={{
            value: dashboardSnapshot.attendanceBreakdown.present,
            percentage: dashboardSnapshot.kpis.avgAttendance,
            isPositive: true,
          }}
          showPeriodFilter
          periodOptions={[
            { label: tKpi("period.today"), value: "today" },
            { label: tKpi("period.this_week"), value: "this_week" },
            { label: tKpi("period.this_term"), value: "this_term" },
            { label: tKpi("period.this_year"), value: "this_year" },
          ]}
          defaultPeriod="today"
        />

        <KPICardV2
          title={tKpi("delivered_classes")}
          value={dashboardSnapshot.deliveredClasses}
          icon={BookOpen}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={dashboardSnapshot.chartData.classes}
          chartColor="#3b82f6"
          change={{
            value: dashboardSnapshot.deliveredClasses,
            percentage: Math.max(1, dashboardSnapshot.deliveredClasses / 6),
            isPositive: true,
          }}
        />

        <KPICardV2
          title={tKpi("today_violations")}
          value={dashboardSnapshot.violations}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={dashboardSnapshot.chartData.violations}
          chartColor="#ef4444"
          change={{
            value: dashboardSnapshot.violations,
            percentage: Math.max(1, dashboardSnapshot.violations * 6),
            isPositive: dashboardSnapshot.violations <= 3,
          }}
        />

        <KPICardV2
          title={tKpi("students_below_threshold")}
          value={dashboardSnapshot.lowAttendanceStudents}
          icon={TrendingDown}
          iconColor="#f97316"
          iconBgColor="#ffedd5"
          chartData={dashboardSnapshot.chartData.lowAttendance}
          chartColor="#f97316"
          change={{
            value: dashboardSnapshot.lowAttendanceStudents,
            percentage: Math.max(
              1,
              (dashboardSnapshot.lowAttendanceStudents /
                Math.max(dashboardSnapshot.kpis.totalStudents, 1)) *
                100
            ),
            isPositive: dashboardSnapshot.lowAttendanceStudents <= 10,
          }}
        />

        <div className="flex h-full flex-col gap-2">
          <KPICardV2
            title={tKpi("nedaa_efficiency")}
            value={dashboardSnapshot.nedaaEfficiencyMinutes}
            valueSuffix=" min"
            icon={MapPin}
            iconColor="#8b5cf6"
            iconBgColor="#ede9fe"
            chartData={dashboardSnapshot.chartData.nedaa}
            chartColor="#8b5cf6"
            change={{
              value: Math.round(dashboardSnapshot.nedaaEfficiencyMinutes),
              percentage: dashboardSnapshot.nedaaEfficiencyMinutes * 10,
              isPositive: true,
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-5 w-full flex-col gap-4">
            <div className="flex w-full flex-1 flex-wrap gap-4">
              <div className="w-full flex-1">
                <AttendanceCard
                  presentRate={dashboardSnapshot.attendanceBreakdown.present}
                  absentRate={dashboardSnapshot.attendanceBreakdown.absent}
                />
              </div>
              <div className="w-full flex-1">
                <ActivitiesCard activities={dashboardSnapshot.activities} />
              </div>
            </div>

            <div className="w-full flex-1">
              <AcademicPerformanceCard
                performance={dashboardSnapshot.academicPerformance}
              />
            </div>

            {reinforcementSummary ? (
              <div className="w-full flex-1">
                <ReinforcementSummaryWidget
                  inProgress={reinforcementSummary.inProgress}
                  notCompleted={reinforcementSummary.notCompleted}
                  completionRate={reinforcementSummary.completionRate}
                />
              </div>
            ) : null}
          </div>
          <div className="flex-2">
            <QuickActionPanel />
          </div>
        </div>
        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <div>
            <StudentsPerGradeChart data={dashboardSnapshot.studentsPerGrade} />
          </div>
          <div>
            <AbsenceReasonsChart reasons={dashboardSnapshot.absenceReasons} />
          </div>
          <div className="h-full">
            <AttendanceTrendChart trendByPeriod={dashboardSnapshot.attendanceTrend} />
          </div>
          <div>
            <CriticalAlerts alerts={dashboardSnapshot.alerts} />
          </div>
          <div>
            <PassFailRatioChart />
          </div>
          <div>
            <TodayMonitoring
              classes={dashboardSnapshot.monitoring.classes}
              exams={dashboardSnapshot.monitoring.exams}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
