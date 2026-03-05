// Utility functions for calculating dashboard statistics

import type { Student } from "@/features/students-guardians/students/types";

export interface DashboardKPIs {
  totalStudents: number;
  activeStudents: number;
  avgAttendance: number;
  atRiskStudents: number;
  lowAttendance: number;
}

export interface ChartData {
  label: string;
  value: number;
}

export function calculateDashboardKPIs(students: Student[]): DashboardKPIs {
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "Active").length;

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
}

export function generateStudentsChartData(): ChartData[] {
  return [
    { label: "Jan", value: 234 },
    { label: "Feb", value: 431 },
    { label: "Mar", value: 543 },
    { label: "Apr", value: 489 },
    { label: "May", value: 391 },
    { label: "Jun", value: 582 },
  ];
}

export function generateAttendanceChartData(): ChartData[] {
  return [
    { label: "Mon", value: 95 },
    { label: "Tue", value: 92 },
    { label: "Wed", value: 94 },
    { label: "Thu", value: 91 },
    { label: "Fri", value: 93 },
    { label: "Sat", value: 92 },
  ];
}

export function generateClassesChartData(): ChartData[] {
  return [
    { label: "Mon", value: 45 },
    { label: "Tue", value: 47 },
    { label: "Wed", value: 46 },
    { label: "Thu", value: 48 },
    { label: "Fri", value: 49 },
    { label: "Sat", value: 48 },
  ];
}

export function generateViolationsChartData(): ChartData[] {
  return [
    { label: "Mon", value: 5 },
    { label: "Tue", value: 3 },
    { label: "Wed", value: 4 },
    { label: "Thu", value: 2 },
    { label: "Fri", value: 1 },
    { label: "Sat", value: 0 },
  ];
}

export function generateStaffAbsenceChartData(): ChartData[] {
  return [
    { label: "Week 1", value: 3.5 },
    { label: "Week 2", value: 3.8 },
    { label: "Week 3", value: 3.2 },
    { label: "Week 4", value: 3.0 },
    { label: "Week 5", value: 3.2 },
    { label: "Week 6", value: 3.2 },
  ];
}

export function generateNedaaChartData(): ChartData[] {
  return [
    { label: "Mon", value: 5 },
    { label: "Tue", value: 4.5 },
    { label: "Wed", value: 4.2 },
    { label: "Thu", value: 4.0 },
    { label: "Fri", value: 3.8 },
    { label: "Sat", value: 4 },
  ];
}
