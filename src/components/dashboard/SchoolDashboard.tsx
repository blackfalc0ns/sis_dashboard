"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AlertTriangle, BookOpen, MapPin, UserX, Users } from "lucide-react";

import { mockStudents } from "@/data/mockStudents";

import AcademicPerformanceCard from "../charts/AcademicPerformanceCard";
import KPICard from "../ui/common/KPICard";
import PassFailRatioChart from "../students-guardians/charts/PassFailRatioChart";

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

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <FilterBar />

      {/* KPI Cards - 3 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
          <div className="h-full">
            <StudentsPerGradeChart />
          </div>
          <div className="h-full">
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
