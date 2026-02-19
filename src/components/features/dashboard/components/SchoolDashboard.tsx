"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AlertTriangle, BookOpen, MapPin, UserX, Users } from "lucide-react";

import { mockStudents } from "@/data/mockStudents";

import AcademicPerformanceCard from "@/components/features/dashboard/components/charts/AcademicPerformanceCard";
import { KPICardV2 } from "@/components/ui/kpi-card";
import PassFailRatioChart from "@/components/features/students-guardians/components/charts/PassFailRatioChart";

import ActivitiesCard from "./ActivitiesCard";
import AttendanceCard from "./AttendanceCard";
import FilterBar from "./FilterBar";
import QuickActionPanel from "./QuickActionPanel";

import CriticalAlerts from "./alerts/CriticalAlerts";
import TodayMonitoring from "./monitoring/TodayMonitoring";

import AttendanceTrendChart from "./charts/AttendanceTrendChart";
import StudentsPerGradeChart from "./charts/StudentsPerGradeChart";

// Dynamically import AbsenceReasonsChart with SSR disabled to prevent MUI Charts hydration issues
const AbsenceReasonsChart = dynamic(
  () => import("./charts/AbsenceReasonsChart"),
  { ssr: false },
);

export default function SchoolDashboard() {
  const t_kpi = useTranslations("kpi");

  // Period options for KPI cards
  const periodOptions = useMemo(
    () => [
      { label: t_kpi("period.today"), value: "today" },
      { label: t_kpi("period.7d"), value: "7d" },
      { label: t_kpi("period.30d"), value: "30d" },
      { label: t_kpi("period.this_week"), value: "this_week" },
      { label: t_kpi("period.this_month"), value: "this_month" },
      { label: t_kpi("period.this_term"), value: "this_term" },
      { label: t_kpi("period.this_year"), value: "this_year" },
    ],
    [t_kpi],
  );

  const kpis = useMemo(() => {
    const totalStudents = mockStudents.length;
    const activeStudents = mockStudents.filter(
      (s) => s.status === "Active",
    ).length;

    // Placeholders (no attendance/risk data in mockStudents)
    const avgAttendance = 92;
    const atRiskStudents = 0;
    const lowAttendance = 0;

    return {
      totalStudents,
      activeStudents,
      avgAttendance,
      atRiskStudents,
      lowAttendance,
    };
  }, []);

  // Sample chart data for KPI cards
  const studentsChartData = [
    { label: "Jan", value: 234 },
    { label: "Feb", value: 431 },
    { label: "Mar", value: 543 },
    { label: "Apr", value: 489 },
    { label: "May", value: 391 },
    { label: "Jun", value: 582 },
  ];

  const attendanceChartData = [
    { label: "Mon", value: 95 },
    { label: "Tue", value: 92 },
    { label: "Wed", value: 94 },
    { label: "Thu", value: 91 },
    { label: "Fri", value: 93 },
    { label: "Sat", value: 92 },
  ];

  const classesChartData = [
    { label: "Mon", value: 45 },
    { label: "Tue", value: 47 },
    { label: "Wed", value: 46 },
    { label: "Thu", value: 48 },
    { label: "Fri", value: 49 },
    { label: "Sat", value: 48 },
  ];

  const violationsChartData = [
    { label: "Mon", value: 5 },
    { label: "Tue", value: 3 },
    { label: "Wed", value: 4 },
    { label: "Thu", value: 2 },
    { label: "Fri", value: 1 },
    { label: "Sat", value: 0 },
  ];

  const staffAbsenceChartData = [
    { label: "Week 1", value: 3.5 },
    { label: "Week 2", value: 3.8 },
    { label: "Week 3", value: 3.2 },
    { label: "Week 4", value: 3.0 },
    { label: "Week 5", value: 3.2 },
    { label: "Week 6", value: 3.2 },
  ];

  const nedaaChartData = [
    { label: "Mon", value: 5 },
    { label: "Tue", value: 4.5 },
    { label: "Wed", value: 4.2 },
    { label: "Thu", value: 4.0 },
    { label: "Fri", value: 3.8 },
    { label: "Sat", value: 4 },
  ];

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
          chartData={studentsChartData}
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
          chartData={attendanceChartData}
          chartColor="#10b981"
          change={{
            value: 2,
            percentage: 2.2,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={(period) => console.log("Period changed:", period)}
        />

        <KPICardV2
          title={t_kpi("delivered_classes")}
          value={48}
          icon={BookOpen}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={classesChartData}
          chartColor="#3b82f6"
          change={{
            value: 3,
            percentage: 6.7,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={(period) => console.log("Period changed:", period)}
        />

        <KPICardV2
          title={t_kpi("today_violations")}
          value={kpis.atRiskStudents}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={violationsChartData}
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
          chartData={staffAbsenceChartData}
          chartColor="#f59e0b"
          change={{
            value: -0.3,
            percentage: -8.6,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={(period) => console.log("Period changed:", period)}
        />

        <KPICardV2
          title={t_kpi("nedaa_efficiency")}
          value={4}
          valueSuffix=" min"
          icon={MapPin}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={nedaaChartData}
          chartColor="#8b5cf6"
          change={{
            value: -1,
            percentage: -20,
            isPositive: true,
          }}
          showPeriodFilter={true}
          periodOptions={periodOptions}
          defaultPeriod="today"
          onPeriodChange={(period) => console.log("Period changed:", period)}
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
            <PassFailRatioChart />{" "}
          </div>
          <div className="">
            <TodayMonitoring />
          </div>
        </div>
      </div>
    </div>
  );
}
