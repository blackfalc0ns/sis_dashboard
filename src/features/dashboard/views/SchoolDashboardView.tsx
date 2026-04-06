// Presenter component for School Dashboard
// Pure presentation - receives data via props, no business logic

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { getReinforcementSummaryCard } from "@/features/reinforcement/services/reinforcementService";

import type {
  DashboardKPIs,
  ChartData,
} from "@/features/dashboard/utils/dashboardStatsCalculator";

const AbsenceReasonsChart = dynamic(
  () => import("../components/charts/AbsenceReasonsChart"),
  { ssr: false },
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
    lowAttendance: ChartData[];
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
  const locale = useLocale();
  const tKpi = useTranslations("kpi");
  const tNedaa = useTranslations("nedaa");
  const [reinforcementSummary, setReinforcementSummary] = useState<{
    inProgress: number;
    notCompleted: number;
    completionRate: number;
  } | null>(null);

  useEffect(() => {
    getReinforcementSummaryCard().then(setReinforcementSummary);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <FilterBar />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICardV2
          title={tKpi("total_students")}
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
          title={tKpi("today_attendance_rate")}
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
          title={tKpi("delivered_classes")}
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
          title={tKpi("today_violations")}
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
          title={tKpi("students_below_threshold")}
          value={14}
          icon={TrendingDown}
          iconColor="#f97316"
          iconBgColor="#ffedd5"
          chartData={chartData.lowAttendance}
          chartColor="#f97316"
          change={{
            value: -3,
            percentage: -17.6,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={onPeriodChange}
        />

        <div className="flex h-full flex-col gap-2">
          <KPICardV2
            title={tKpi("nedaa_efficiency")}
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
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-5 w-full flex-col gap-4">
            <div className="flex w-full flex-1 flex-wrap gap-4">
              <div className="w-full flex-1">
                <AttendanceCard />
              </div>
              <div className="w-full flex-1">
                <ActivitiesCard />
              </div>
            </div>

            <div className="w-full flex-1">
              <AcademicPerformanceCard />
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
            <StudentsPerGradeChart />
          </div>
          <div>
            <AbsenceReasonsChart />
          </div>
          <div className="h-full">
            <AttendanceTrendChart />
          </div>
          <div>
            <CriticalAlerts />
          </div>
          <div>
            <PassFailRatioChart />
          </div>
          <div>
            <TodayMonitoring />
          </div>
        </div>
      </div>
    </div>
  );
}
