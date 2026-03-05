// Container component for School Dashboard
// Handles data fetching, state management, and business logic

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { mockStudents } from "@/data/mockStudents";
import {
  calculateDashboardKPIs,
  generateStudentsChartData,
  generateAttendanceChartData,
  generateClassesChartData,
  generateViolationsChartData,
  generateStaffAbsenceChartData,
  generateNedaaChartData,
} from "@/features/dashboard/utils/dashboardStatsCalculator";
import SchoolDashboardView from "../views/SchoolDashboardView";

export default function SchoolDashboardContainer() {
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
    [t_kpi]
  );

  // Calculate KPIs
  const kpis = useMemo(() => calculateDashboardKPIs(mockStudents), []);

  // Generate chart data
  const chartData = useMemo(
    () => ({
      students: generateStudentsChartData(),
      attendance: generateAttendanceChartData(),
      classes: generateClassesChartData(),
      violations: generateViolationsChartData(),
      staffAbsence: generateStaffAbsenceChartData(),
      nedaa: generateNedaaChartData(),
    }),
    []
  );

  // Event handlers
  const handlePeriodChange = (period: string) => {
    console.log("Period changed:", period);
  };

  // Pass everything to presenter
  return (
    <SchoolDashboardView
      kpis={kpis}
      chartData={chartData}
      periodOptions={periodOptions}
      onPeriodChange={handlePeriodChange}
    />
  );
}
