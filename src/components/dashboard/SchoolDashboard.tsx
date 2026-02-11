"use client";

import { Users, MapPin, BookOpen, AlertTriangle, UserX } from "lucide-react";
import FilterBar from "./FilterBar";
import KPICard from "../ui/common/KPICard";
import AttendanceCard from "./AttendanceCard";
import IncidentsCard from "./IncidentsCard";
import QuickActionPanel from "./QuickActionPanel";
import AcademicPerformanceCard from "../charts/AcademicPerformanceCard";
import { useState } from "react";
import AttendanceTrendChart from "./charts/AttendanceTrendChart";
import StudentsPerGradeChart from "./charts/StudentsPerGradeChart";
import AbsenceReasonsChart from "./charts/AbsenceReasonsChart";
import CriticalAlerts from "./alerts/CriticalAlerts";
import TodayMonitoring from "./monitoring/TodayMonitoring";
import { useTranslations } from "next-intl";

export default function SchoolDashboard() {
  const t_kpi = useTranslations("kpi");
  const t_comparison = useTranslations("comparison");

  const [comparisonMode, setComparisonMode] = useState<
    "yesterday" | "week" | "term"
  >("yesterday");

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <FilterBar />

      {/* Comparison Tabs */}
      <div className="w-full sm:w-fit bg-white p-1 rounded-lg shadow-sm mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setComparisonMode("yesterday")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              comparisonMode === "yesterday"
                ? "bg-(--primary-color) text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t_comparison("vs_yesterday")}
          </button>

          <button
            onClick={() => setComparisonMode("week")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              comparisonMode === "week"
                ? "bg-(--primary-color) text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t_comparison("vs_week")}
          </button>

          <button
            onClick={() => setComparisonMode("term")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              comparisonMode === "term"
                ? "bg-(--primary-color) text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t_comparison("vs_term")}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <KPICard
          title={t_kpi("total_students")}
          value="2,847"
          icon={Users}
          trendData={[2650, 2700, 2680, 2750, 2800, 2847]}
          iconBgColor="bg-(--primary-color)"
          variant="gradient"
        />
        <KPICard
          title={t_kpi("today_attendance_rate")}
          value="94.5%"
          icon={Users}
          numbers="+2.3%"
        />
        <KPICard
          title={t_kpi("delivered_classes")}
          value="48"
          icon={BookOpen}
          numbers="+5"
        />
        <KPICard
          title={t_kpi("today_violations")}
          value="12"
          icon={AlertTriangle}
          numbers="+5"
        />
        <KPICard
          title={t_kpi("staff_absenteeism")}
          value="3.2%"
          icon={UserX}
          numbers="-0.5%"
        />
        <KPICard
          title={t_kpi("nedaa_efficiency")}
          value="4 min"
          icon={MapPin}
          iconBgColor="bg-(--primary-color)"
          variant="gradient"
        />
      </div>

      {/* ✅ ONE PAGE LAYOUT: Left content + Right sticky QuickActionPanel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* LEFT (everything) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top cards + Academic performance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AttendanceCard />
            <IncidentsCard />
            <div className="sm:col-span-2">
              <AcademicPerformanceCard />
            </div>
          </div>

          {/* Charts */}
          <AttendanceTrendChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StudentsPerGradeChart />
            <AbsenceReasonsChart />
          </div>

          {/* Alerts + Monitoring (stay on the left with the rest) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CriticalAlerts />
            <TodayMonitoring />
          </div>
        </div>

        {/* RIGHT (only QuickActionPanel sticky) */}
        <div className="lg:col-span-1 h-full">
          <div className="lg:sticky lg:top-[100px] h-[calc(100vh-100px)]">
            <QuickActionPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
