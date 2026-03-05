// Presenter component for School Dashboard
// Pure presentation - receives data via props, no business logic

"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AlertTriangle, BookOpen, MapPin, UserX, Users } from "lucide-react";

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

import type { DashboardKPIs, ChartData } from "@/features/dashboard/utils/dashboardStatsCalculator";

// Dynamically import AbsenceReasonsChart with SSR disabled to prevent MUI Charts hydration issues
const AbsenceReasonsChart = dynamic(
  () => import("../components/charts/AbsenceReasonsChart"),
  { ssr: false }
);

interface PeriodOption {
  label: string;
  value: string;
}

interface SchoolDashboardViewProps {
  kpis: DashboardKPIs;
  chartData: {
    students: ChartData[];
    attendance: ChartData[];
    classes: ChartData[];
    violations: ChartData[];
    staffAbsence: ChartData[];
    nedaa: ChartData[];
  };
  periodOptions: PeriodOption[];
  onPeriodChange: (period: string) => void;
}

export default function SchoolDashboardView({
  kpis,
  chartData,
  periodOptions,
  onPeriodChange,
}: SchoolDashboardViewProps) {
  const t_kpi = useTranslations("kpi");

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <FilterBar />

      {/* KPI Cards - 3 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KPICardV2
          title={t_kpi("total_students")}
          value={kpis.totalStudents}
          icon={Users}
          iconColor="#036b80"
          iconBgColor="#e0f2f5"
          chartData={chartData.students}
          chartColor="#036b80"
          change={{
            value: 148,
            percentage: 34.3,
            isPositive: true,
          }}
        />

        <KPICardV2
          title={t_kpi("today_attendance_rate")}
          value={kpis.avgAttendance}
          valueSuffix="%"
          icon={Users}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={chartData.attendance}
          chartColor="#10b981"
          change={{
            value: 2,
            percentage: 2.2,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={onPeriodChange}
        />

        <KPICardV2
          title={t_kpi("delivered_classes")}
          value={48}
          icon={BookOpen}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={chartData.classes}
          chartColor="#3b82f6"
          change={{
            value: 3,
            percentage: 6.7,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={onPeriodChange}
        />

        <KPICardV2
          title={t_kpi("today_violations")}
          value={kpis.atRiskStudents}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={chartData.violations}
          chartColor="#ef4444"
          change={{
            value: -4,
            percentage: -80,
            isPositive: true,
          }}
        />

        <KPICardV2
          title={t_kpi("staff_absenteeism")}
          value="3.2"
          valueSuffix="%"
          icon={UserX}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={chartData.staffAbsence}
          chartColor="#f59e0b"
          change={{
            value: -0.3,
            percentage: -8.6,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={onPeriodChange}
        />

        <KPICardV2
          title={t_kpi("nedaa_efficiency")}
          value={4}
          valueSuffix=" min"
          icon={MapPin}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={chartData.nedaa}
          chartColor="#8b5cf6"
          change={{
            value: -1,
            percentage: -20,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={onPeriodChange}
        />
      </div>

      {/* Main Layout */}
      <div className="space-y-6">
        {/* Row 1: Attendance, Activities, and Quick Actions */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-4 flex-5 w-full">
            <div className="flex gap-4 flex-1 w-full flex-wrap">
              <div className="flex-1 w-full">
                <AttendanceCard />
              </div>
              <div className="flex-1 w-full">
                <ActivitiesCard />
              </div>
            </div>

            <div className="flex-1 w-full">
              <AcademicPerformanceCard />
            </div>
          </div>
          <div className="flex-2">
            <QuickActionPanel />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-fr">
          <div className="">
            <StudentsPerGradeChart />
          </div>
          <div className="">
            <AbsenceReasonsChart />
          </div>
          <div className="h-full">
            <AttendanceTrendChart />
          </div>
          <div className="">
            <CriticalAlerts />
          </div>
          <div className="">
            <PassFailRatioChart />
          </div>
          <div className="">
            <TodayMonitoring />
          </div>
        </div>
      </div>
    </div>
  );
}
