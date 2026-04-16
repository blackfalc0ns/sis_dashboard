"use client";

// Utility functions for calculating dashboard statistics

import type { Student } from "@/features/students-guardians/students/types";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

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

export interface DashboardAttendanceBreakdown {
  present: number;
  absent: number;
}

export interface DashboardActivity {
  id: string;
  studentName: string;
  reason: string;
  xp: number;
}

export type DashboardAlertPriority = "high" | "medium" | "low";

export interface DashboardAlertItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  priority: DashboardAlertPriority;
  actionKey: string;
}

export interface DashboardMonitoringItem {
  time: string;
  title: string;
  subtitle: string;
  status: "ongoing" | "upcoming" | "completed";
}

export interface DashboardAcademicPerformanceData {
  positiveRate: number;
  negativeRate: number;
  trends: Record<"today" | "this_week" | "this_term", number[]>;
}

export interface DashboardAttendanceTrendPeriod {
  days: number[];
  attendanceData: number[];
  average: number;
  belowDays: number;
}

export interface DashboardStudentsPerGradeData {
  grades: string[];
  newStudents: number[];
  existingStudents: number[];
}

export interface DashboardAbsenceReasonsData {
  medical: number;
  permission: number;
  noExcuse: number;
}

export interface DashboardExportSummaryRow {
  date: string;
  academicYear: string;
  term: string;
  totalStudents: number;
  attendanceRate: string;
  deliveredClasses: number;
  violations: number;
  lowAttendanceStudents: number;
  nedaaEfficiency: string;
}

export interface DashboardExportAttendanceRow {
  grade: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: string;
}

export interface DashboardExportIncidentRow {
  studentName: string;
  reason: string;
  xp: number;
  priority: DashboardAlertPriority;
}

export interface DashboardSnapshot {
  kpis: DashboardKPIs;
  deliveredClasses: number;
  violations: number;
  lowAttendanceStudents: number;
  nedaaEfficiencyMinutes: number;
  chartData: {
    students: ChartData[];
    attendance: ChartData[];
    classes: ChartData[];
    violations: ChartData[];
    lowAttendance: ChartData[];
    nedaa: ChartData[];
  };
  attendanceBreakdown: DashboardAttendanceBreakdown;
  activities: DashboardActivity[];
  academicPerformance: DashboardAcademicPerformanceData;
  attendanceTrend: Record<
    "days_30" | "week" | "term" | "academic_year",
    DashboardAttendanceTrendPeriod
  >;
  studentsPerGrade: DashboardStudentsPerGradeData;
  absenceReasons: DashboardAbsenceReasonsData;
  alerts: DashboardAlertItem[];
  monitoring: {
    classes: DashboardMonitoringItem[];
    exams: DashboardMonitoringItem[];
  };
  exportData: {
    summary: DashboardExportSummaryRow;
    attendance: DashboardExportAttendanceRow[];
    incidents: DashboardExportIncidentRow[];
  };
}

interface BuildDashboardSnapshotOptions {
  students: Student[];
  academicYear: AcademicYear | null;
  term: Term | null;
}

const MONTH_LABELS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(input: string) {
  return Array.from(input).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
}

function getStudentDisplayName(student: Student) {
  return student.full_name_en || student.name || student.full_name_ar || "Student";
}

function getAttendanceValue(student: Student) {
  return clamp(student.attendance_percentage ?? 92, 70, 100);
}

function getRiskScore(student: Student) {
  const attendancePenalty = getAttendanceValue(student) < 85 ? 1 : 0;
  const riskFlagsPenalty = student.risk_flags?.length ?? 0;
  return attendancePenalty + riskFlagsPenalty;
}

function getGradeSortValue(grade: string) {
  if (/kg/i.test(grade)) {
    return grade.toLowerCase().includes("2") ? -1 : -2;
  }

  const numericPart = Number.parseInt(grade.replace(/\D+/g, ""), 10);
  return Number.isNaN(numericPart) ? 999 : numericPart;
}

function createSeries(
  labels: string[],
  baseline: number,
  variance: number,
  seed: number,
  precision = 0
) {
  return labels.map((label, index) => {
    const wave = Math.sin((seed + index) / 2.2) * variance;
    const drift = ((seed + index * 7) % (variance * 2 + 1)) - variance;
    const value = clamp(baseline + wave + drift / 2, 0, Number.MAX_SAFE_INTEGER);
    return {
      label,
      value:
        precision > 0
          ? Number(value.toFixed(precision))
          : Math.round(value),
    };
  });
}

function createTrendNumbers(
  length: number,
  baseline: number,
  variance: number,
  seed: number,
  precision = 1
) {
  return Array.from({ length }, (_, index) => {
    const wave = Math.sin((seed + index) / 2.8) * variance;
    const drift = ((seed + index * 5) % (variance * 2 + 1)) - variance;
    return Number((baseline + wave + drift / 3).toFixed(precision));
  });
}

function getScopedStudents(
  students: Student[],
  term: Term | null
) {
  if (!term) {
    return students;
  }

  const termEnd = new Date(term.endDate).getTime();
  return students.filter(
    (student) => new Date(student.submittedDate).getTime() <= termEnd
  );
}

function getCurrentYearStudents(
  students: Student[],
  academicYear: AcademicYear | null
) {
  if (!academicYear) {
    return students;
  }

  const start = new Date(academicYear.startDate).getTime();
  const end = new Date(academicYear.endDate).getTime();

  return students.filter((student) => {
    const submittedAt = new Date(student.submittedDate).getTime();
    return submittedAt >= start && submittedAt <= end;
  });
}

function buildStudentsPerGradeData(
  scopedStudents: Student[],
  currentYearStudents: Student[]
): DashboardStudentsPerGradeData {
  const currentYearIds = new Set(currentYearStudents.map((student) => student.id));
  const gradeGroups = scopedStudents.reduce(
    (accumulator, student) => {
      const grade = student.gradeRequested || "Unassigned";
      if (!accumulator[grade]) {
        accumulator[grade] = { new: 0, existing: 0 };
      }

      if (currentYearIds.has(student.id)) {
        accumulator[grade].new += 1;
      } else {
        accumulator[grade].existing += 1;
      }

      return accumulator;
    },
    {} as Record<string, { new: number; existing: number }>
  );

  const grades = Object.keys(gradeGroups).sort(
    (left, right) => getGradeSortValue(left) - getGradeSortValue(right)
  );

  return {
    grades,
    newStudents: grades.map((grade) => gradeGroups[grade].new),
    existingStudents: grades.map((grade) => gradeGroups[grade].existing),
  };
}

function calculateDashboardKPIs(students: Student[]): DashboardKPIs {
  const totalStudents = students.length;
  const activeStudents = students.filter((student) => student.status === "Active").length;
  const attendanceValues = students.map(getAttendanceValue);
  const avgAttendance =
    attendanceValues.length > 0
      ? Number(
          (
            attendanceValues.reduce((total, value) => total + value, 0) /
            attendanceValues.length
          ).toFixed(1)
        )
      : 0;
  const atRiskStudents = students.filter((student) => getRiskScore(student) > 0).length;
  const lowAttendance = students.filter(
    (student) => getAttendanceValue(student) < 90
  ).length;

  return {
    totalStudents,
    activeStudents,
    avgAttendance,
    atRiskStudents,
    lowAttendance,
  };
}

export { calculateDashboardKPIs };

export function buildDashboardSnapshot({
  students,
  academicYear,
  term,
}: BuildDashboardSnapshotOptions): DashboardSnapshot {
  const scopedStudents = getScopedStudents(students, term);
  const currentYearStudents = getCurrentYearStudents(scopedStudents, academicYear);
  const studentsPerGrade = buildStudentsPerGradeData(
    scopedStudents,
    currentYearStudents
  );
  const kpis = calculateDashboardKPIs(scopedStudents);
  const contextSeed = hashString(`${academicYear?.id ?? "all"}:${term?.id ?? "all"}`);
  const attendanceGap = Math.max(0, 100 - kpis.avgAttendance);

  const deliveredClasses = Math.round(kpis.totalStudents / 55) + 18 + (contextSeed % 6);
  const violations = Math.max(1, Math.round(kpis.atRiskStudents / 6) + (contextSeed % 4));
  const lowAttendanceStudents = kpis.lowAttendance;
  const nedaaEfficiencyMinutes = Number(
    clamp(5.2 - (contextSeed % 5) * 0.3, 3.2, 5.2).toFixed(1)
  );

  const attendanceBreakdown = {
    present: Math.round(kpis.avgAttendance),
    absent: Math.max(0, 100 - Math.round(kpis.avgAttendance)),
  };

  const activities = scopedStudents
    .slice(0, 3)
    .map((student, index) => ({
      id: student.id,
      studentName: getStudentDisplayName(student),
      reason:
        index % 2 === 0
          ? "Academic improvement"
          : "Attendance follow-up",
      xp: index % 2 === 0 ? 50 + index * 10 : -25 - index * 5,
    }));

  const positiveRate = clamp(Math.round(kpis.avgAttendance), 70, 99);
  const negativeRate = Math.max(1, 100 - positiveRate);

  const academicPerformance = {
    positiveRate,
    negativeRate,
    trends: {
      today: createTrendNumbers(16, positiveRate, 6, contextSeed),
      this_week: createTrendNumbers(16, positiveRate - 1, 5, contextSeed + 7),
      this_term: createTrendNumbers(16, positiveRate - 2, 4, contextSeed + 13),
    },
  };

  const attendanceTrend = {
    days_30: {
      days: Array.from({ length: 30 }, (_, index) => index + 1),
      attendanceData: createTrendNumbers(30, kpis.avgAttendance, 2.5, contextSeed),
      average: Number(kpis.avgAttendance.toFixed(1)),
      belowDays: Math.max(1, Math.round(attendanceGap / 2)),
    },
    week: {
      days: Array.from({ length: 7 }, (_, index) => index + 1),
      attendanceData: createTrendNumbers(7, kpis.avgAttendance, 2, contextSeed + 5),
      average: Number(kpis.avgAttendance.toFixed(1)),
      belowDays: Math.max(1, Math.round(attendanceGap / 4)),
    },
    term: {
      days: Array.from({ length: 12 }, (_, index) => index + 1),
      attendanceData: createTrendNumbers(12, kpis.avgAttendance, 1.8, contextSeed + 11),
      average: Number(kpis.avgAttendance.toFixed(1)),
      belowDays: Math.max(1, Math.round(attendanceGap / 3)),
    },
    academic_year: {
      days: Array.from({ length: 12 }, (_, index) => index + 1),
      attendanceData: createTrendNumbers(12, kpis.avgAttendance, 1.5, contextSeed + 17),
      average: Number(kpis.avgAttendance.toFixed(1)),
      belowDays: Math.max(1, Math.round(attendanceGap / 3)),
    },
  };

  const absenceReasons = {
    medical: clamp(30 + (contextSeed % 12), 20, 50),
    permission: clamp(25 + ((contextSeed + 7) % 10), 20, 40),
    noExcuse: 0,
  };
  absenceReasons.noExcuse = Math.max(
    10,
    100 - absenceReasons.medical - absenceReasons.permission
  );

  const alerts: DashboardAlertItem[] = [
    {
      id: "alerts-no-teachers",
      titleKey: "alerts.no_teachers.title",
      descriptionKey: "alerts.no_teachers.description",
      priority: "high",
      actionKey: "alerts.no_teachers.action",
    },
    {
      id: "alerts-low-attendance",
      titleKey: "alerts.low_attendance.title",
      descriptionKey: "alerts.low_attendance.description",
      priority: kpis.avgAttendance < 90 ? "high" : "medium",
      actionKey: "alerts.low_attendance.action",
    },
    {
      id: "alerts-overdue-invoices",
      titleKey: "alerts.overdue_invoices.title",
      descriptionKey: "alerts.overdue_invoices.description",
      priority: "medium",
      actionKey: "alerts.overdue_invoices.action",
    },
  ];

  const termName = term?.name ?? "Current term";
  const monitoring = {
    classes: [
      {
        time: "08:00",
        title: `Mathematics · ${termName}`,
        subtitle: "Room 201",
        status: "completed" as const,
      },
      {
        time: "09:30",
        title: `Physics · ${termName}`,
        subtitle: "Lab 3",
        status: "ongoing" as const,
      },
      {
        time: "11:00",
        title: `English · ${termName}`,
        subtitle: "Room 105",
        status: "upcoming" as const,
      },
    ],
    exams: [
      {
        time: "10:00",
        title: `${termName} checkpoint`,
        subtitle: academicYear?.name ?? "Current academic year",
        status: "ongoing" as const,
      },
      {
        time: "14:00",
        title: "Biology quiz",
        subtitle: termName,
        status: "upcoming" as const,
      },
    ],
  };

  const summaryDate = term?.endDate ?? new Date().toISOString().slice(0, 10);
  const exportAttendance = studentsPerGrade.grades.map((grade, index) => {
    const totalStudents =
      studentsPerGrade.newStudents[index] + studentsPerGrade.existingStudents[index];
    const present = Math.round((totalStudents * attendanceBreakdown.present) / 100);
    const absent = totalStudents - present;
    const late = Math.max(0, Math.round(absent / 3));
    const attendanceRate =
      totalStudents === 0
        ? "0.0%"
        : `${((present / totalStudents) * 100).toFixed(1)}%`;

    return {
      grade,
      totalStudents,
      present,
      absent,
      late,
      attendanceRate,
    };
  });

  const exportData = {
    summary: {
      date: summaryDate,
      academicYear: academicYear?.name ?? "N/A",
      term: term?.name ?? "N/A",
      totalStudents: kpis.totalStudents,
      attendanceRate: `${kpis.avgAttendance.toFixed(1)}%`,
      deliveredClasses,
      violations,
      lowAttendanceStudents,
      nedaaEfficiency: `${nedaaEfficiencyMinutes} min`,
    },
    attendance: exportAttendance,
    incidents: activities.map((activity, index) => ({
      studentName: activity.studentName,
      reason: activity.reason,
      xp: activity.xp,
      priority: alerts[index]?.priority ?? "low",
    })),
  };

  return {
    kpis,
    deliveredClasses,
    violations,
    lowAttendanceStudents,
    nedaaEfficiencyMinutes,
    chartData: {
      students: createSeries(MONTH_LABELS, kpis.totalStudents, 18, contextSeed),
      attendance: createSeries(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        kpis.avgAttendance,
        2,
        contextSeed,
        1
      ),
      classes: createSeries(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        deliveredClasses,
        3,
        contextSeed + 3
      ),
      violations: createSeries(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        violations,
        2,
        contextSeed + 5
      ),
      lowAttendance: createSeries(
        ["W1", "W2", "W3", "W4", "W5", "W6"],
        lowAttendanceStudents,
        2,
        contextSeed + 7
      ),
      nedaa: createSeries(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        nedaaEfficiencyMinutes,
        0.5,
        contextSeed + 11,
        1
      ),
    },
    attendanceBreakdown,
    activities,
    academicPerformance,
    attendanceTrend,
    studentsPerGrade,
    absenceReasons,
    alerts,
    monitoring,
    exportData,
  };
}
