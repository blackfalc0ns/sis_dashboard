// Utility functions for calculating student statistics

import type { Student } from "@/features/students-guardians/students/types";

export interface StudentStats {
  total: number;
  active: number;
  suspended: number;
  withdrawn: number;
  atRisk: number;
  avgAttendance: number;
  avgGrade: number;
  totalTrend: Array<{ label: string; value: number }>;
  activeTrend: Array<{ label: string; value: number }>;
  atRiskTrend: Array<{ label: string; value: number }>;
  attendanceTrend: Array<{ label: string; value: number }>;
  gradeTrend: Array<{ label: string; value: number }>;
  withdrawnTrend: Array<{ label: string; value: number }>;
}

export interface RiskDistribution {
  attendance: number;
  grades: number;
  behavior: number;
}

function generateTrendData(currentValue: number): Array<{ label: string; value: number }> {
  return [
    { label: "M1", value: Math.max(0, currentValue - 30) },
    { label: "M2", value: Math.max(0, currentValue - 20) },
    { label: "M3", value: Math.max(0, currentValue - 10) },
    { label: "M4", value: currentValue },
  ];
}

function generatePercentageTrend(currentValue: number): Array<{ label: string; value: number }> {
  return [
    { label: "M1", value: Math.max(75, currentValue - 3) },
    { label: "M2", value: Math.max(75, currentValue - 2) },
    { label: "M3", value: Math.max(75, currentValue - 1) },
    { label: "M4", value: currentValue },
  ];
}

export function calculateStudentStats(students: Student[]): StudentStats {
  const total = students.length;
  const active = students.filter((s) => s.status === "Active").length;
  const suspended = students.filter((s) => s.status === "Suspended").length;
  const withdrawn = students.filter((s) => s.status === "Withdrawn").length;

  const atRisk = students.filter(
    (s) => (s as any).ytdPerformance && (s as any).ytdPerformance.riskFlags.length > 0
  ).length;

  // Calculate average attendance
  const studentsWithAttendance = students.filter(
    (s) => (s as any).ytdPerformance?.attendance
  );
  const avgAttendance =
    studentsWithAttendance.length > 0
      ? Math.round(
          studentsWithAttendance.reduce(
            (sum, s) => sum + ((s as any).ytdPerformance?.attendance || 0),
            0
          ) / studentsWithAttendance.length
        )
      : 0;

  // Calculate average grade
  const studentsWithGrades = students.filter(
    (s) => (s as any).ytdPerformance?.gradeAverage
  );
  const avgGrade =
    studentsWithGrades.length > 0
      ? Math.round(
          studentsWithGrades.reduce(
            (sum, s) => sum + ((s as any).ytdPerformance?.gradeAverage || 0),
            0
          ) / studentsWithGrades.length
        )
      : 0;

  return {
    total,
    active,
    suspended,
    withdrawn,
    atRisk,
    avgAttendance,
    avgGrade,
    totalTrend: generateTrendData(total),
    activeTrend: generateTrendData(active),
    atRiskTrend: generateTrendData(atRisk),
    attendanceTrend: generatePercentageTrend(avgAttendance),
    gradeTrend: generatePercentageTrend(avgGrade),
    withdrawnTrend: generateTrendData(withdrawn),
  };
}

export function calculateRiskDistribution(students: Student[]): RiskDistribution {
  const distribution: RiskDistribution = {
    attendance: 0,
    grades: 0,
    behavior: 0,
  };

  students.forEach((student) => {
    if ((student as any).ytdPerformance?.riskFlags) {
      (student as any).ytdPerformance.riskFlags.forEach(
        (flag: "attendance" | "grades" | "behavior") => {
          if (flag === "attendance") distribution.attendance++;
          if (flag === "grades") distribution.grades++;
          if (flag === "behavior") distribution.behavior++;
        }
      );
    }
  });

  return distribution;
}

export function extractFilterOptions(students: Student[]): {
  academicYears: string[];
  terms: string[];
} {
  const years = new Set<string>();
  const termSet = new Set<string>();

  students.forEach((student) => {
    if ((student as any).enrollment?.academicYear) {
      years.add((student as any).enrollment.academicYear);
    }
    if ((student as any).currentTerm?.term) {
      termSet.add((student as any).currentTerm.term);
    }
  });

  return {
    academicYears: Array.from(years).sort(),
    terms: Array.from(termSet).sort(),
  };
}
