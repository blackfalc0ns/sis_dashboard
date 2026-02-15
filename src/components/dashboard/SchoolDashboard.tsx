"use client";

import { Users, MapPin, BookOpen, AlertTriangle, UserX } from "lucide-react";
import FilterBar from "./FilterBar";
import KPICard from "../ui/common/KPICard";
import AttendanceCard from "./AttendanceCard";
import IncidentsCard from "./IncidentsCard";
import QuickActionPanel from "./QuickActionPanel";
import AcademicPerformanceCard from "../charts/AcademicPerformanceCard";
import { useState, useMemo } from "react";
import AttendanceTrendChart from "./charts/AttendanceTrendChart";
import StudentsPerGradeChart from "./charts/StudentsPerGradeChart";
import AbsenceReasonsChart from "./charts/AbsenceReasonsChart";
import CriticalAlerts from "./alerts/CriticalAlerts";
import TodayMonitoring from "./monitoring/TodayMonitoring";
import { useTranslations } from "next-intl";
import { mockStudents } from "@/data/mockStudents";

export default function SchoolDashboard() {
  const t_kpi = useTranslations("kpi");

  // Calculate real KPIs from mock data
  const kpis = useMemo(() => {
    const totalStudents = mockStudents.length;
    const activeStudents = mockStudents.filter(
      (s) => s.status === "Active",
    ).length;
    // Since we don't have attendance data in admissions, use placeholder
    const avgAttendance = 92;
    // Since we don't have risk flags in admissions, use placeholder
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

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <FilterBar />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <KPICard
          title={t_kpi("total_students")}
          value={kpis.totalStudents.toString()}
          icon={Users}
          trendData={[12, 13, 14, 14, 15, kpis.totalStudents]}
          iconBgColor="bg-(--primary-color)"
          variant="gradient"
        />
        <KPICard
          title={t_kpi("today_attendance_rate")}
          value={`${kpis.avgAttendance}%`}
          icon={Users}
          numbers={kpis.avgAttendance >= 90 ? "+Good" : "Needs Attention"}
        />
        <KPICard
          title={t_kpi("delivered_classes")}
          value="48"
          icon={BookOpen}
          numbers="+5"
        />
        <KPICard
          title={t_kpi("today_violations")}
          value={kpis.atRiskStudents.toString()}
          icon={AlertTriangle}
          numbers={`${kpis.lowAttendance} low attendance`}
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
