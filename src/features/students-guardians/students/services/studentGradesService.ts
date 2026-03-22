"use client";

import {
  fetchAcademicYears,
  fetchTermsByYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchStudentGradesSnapshot } from "@/features/grades/overview/services/gradesOverviewService";
import type { StudentGradesSnapshot } from "@/features/grades/overview/types";
import type {
  EnrollmentTerm,
  RiskFlag,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import {
  getStudentClassTeacher,
  getStudentEnrollment,
  getStudentEnrollmentByAcademicYear,
  getStudentSubjectTeacher,
  getStudentTermByName,
  getStudentTermByNameForAcademicYear,
  getStudentTerms,
  getStudentTermsByAcademicYear,
  getStudentYTDPerformance,
  getStudentYTDPerformanceByAcademicYear,
} from "./studentsService";

export type StudentGradesViewMode =
  | "current"
  | "term_1"
  | "term_2"
  | "term_3"
  | "ytd";

type SelectedTermSource = "active" | "latest_completed" | "upcoming" | "explicit";

export interface StudentGradesContextItem {
  id: string;
  labelKey: string;
  value: string;
}

export interface StudentGradesKpi {
  id: string;
  titleKey: string;
  value: string | number;
  subtitleKey: string;
  subtitleValues?: Record<string, string | number>;
  trend?: Array<{ label: string; value: number }>;
}

export interface StudentGradesSummaryRow {
  id: string;
  metricKey: string;
  value: string;
  detail: string;
}

export interface StudentGradesSubjectRow {
  id: string;
  subject: string;
  subjectAr: string;
  teacher: string;
  teacherAr?: string;
  average: number;
  lastAssessmentScore: number | null;
  assessmentsCount: number;
  trend: "up" | "down" | "stable";
}

export interface StudentGradesViewModel {
  enrollment: StudentEnrollment;
  availableTerms: EnrollmentTerm[];
  selectedMode: StudentGradesViewMode;
  selectedTerm?: EnrollmentTerm;
  selectedModeLabelKey: string;
  selectedTermSource?: SelectedTermSource;
  currentTermLabelKey: string;
  academicYearId?: string;
  structureTermId?: string;
  currentAverage: number;
  attendance: number;
  riskFlags: RiskFlag[];
  contextItems: StudentGradesContextItem[];
  homeroomTeacher?: string;
  kpis: StudentGradesKpi[];
  performanceTrend: Array<{ label: string; value: number }>;
  subjectRows: StudentGradesSubjectRow[];
  summaryRows: StudentGradesSummaryRow[];
  totalAssessments?: number;
}

interface StudentGradesViewOptions {
  academicYearId?: string;
  termId?: string;
}

const TERM_NAME_BY_MODE: Record<
  Exclude<StudentGradesViewMode, "current" | "ytd">,
  EnrollmentTerm["term"]
> = {
  term_1: "Term 1",
  term_2: "Term 2",
  term_3: "Term 3",
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getModeLabelKey(mode: StudentGradesViewMode) {
  switch (mode) {
    case "current":
      return "term_selector.current";
    case "term_1":
      return "term_selector.term_1";
    case "term_2":
      return "term_selector.term_2";
    case "term_3":
      return "term_selector.term_3";
    case "ytd":
      return "term_selector.ytd";
    default:
      return "term_selector.current";
  }
}

function getRiskFlagsForMode(
  mode: StudentGradesViewMode,
  selectedTerm: EnrollmentTerm | undefined,
  ytdPerformance: ReturnType<typeof getStudentYTDPerformance>,
) {
  if (mode === "ytd") {
    return ytdPerformance?.riskFlags || [];
  }

  return selectedTerm?.riskFlags || [];
}

function getTermMetricFallback(
  terms: EnrollmentTerm[],
  direction: "highest" | "lowest",
) {
  if (terms.length === 0) {
    return { value: 0, label: "Term -" };
  }

  const sorted = [...terms].sort((left, right) =>
    direction === "highest"
      ? right.gradeAverage - left.gradeAverage
      : left.gradeAverage - right.gradeAverage,
  );

  return {
    value: sorted[0]?.gradeAverage || 0,
    label: sorted[0]?.term || "Term -",
  };
}

async function resolveAcademicYearAndTermIds(
  enrollment: StudentEnrollment,
  selectedTerm: EnrollmentTerm | undefined,
) {
  const years = await fetchAcademicYears();
  const academicYear =
    years.find((year) => year.name === enrollment.academicYear) || undefined;

  if (!academicYear || !selectedTerm) {
    return { academicYearId: academicYear?.id, structureTermId: undefined };
  }

  const structureTerms = await fetchTermsByYear(academicYear.id);
  const mappedTerm =
    structureTerms.find(
      (term) =>
        term.name === selectedTerm.term ||
        term.nameEn === selectedTerm.term ||
        term.nameAr === selectedTerm.term,
    ) ||
    structureTerms.find((term, index) => index === Number(selectedTerm.term.split(" ")[1]) - 1);

  return {
    academicYearId: academicYear.id,
    structureTermId: mappedTerm?.id,
  };
}

async function fetchSelectedTermSnapshot(
  studentId: string,
  enrollment: StudentEnrollment,
  selectedTerm: EnrollmentTerm | undefined,
): Promise<StudentGradesSnapshot | null> {
  if (!selectedTerm) {
    return null;
  }

  const { academicYearId, structureTermId } = await resolveAcademicYearAndTermIds(
    enrollment,
    selectedTerm,
  );

  if (!academicYearId || !structureTermId) {
    return null;
  }

  return fetchStudentGradesSnapshot(studentId, {
    academicYearId,
    termId: structureTermId,
  });
}

function resolveCurrentModeTerm(
  availableTerms: EnrollmentTerm[],
  selectedStructureTermId?: string,
): {
  selectedTerm?: EnrollmentTerm;
  source?: SelectedTermSource;
} {
  if (selectedStructureTermId) {
    const explicitTerm = availableTerms.find((term, index) => {
      const numericTerm = Number(term.term.split(" ")[1]);
      return (
        selectedStructureTermId.endsWith(`-${numericTerm}`) ||
        selectedStructureTermId.endsWith(`-${index + 1}`)
      );
    });

    if (explicitTerm) {
      return { selectedTerm: explicitTerm, source: "explicit" };
    }
  }

  const now = new Date();
  const activeOrCompleted =
    availableTerms.find((term) => {
      const start = new Date(term.startDate);
      const end = new Date(term.endDate);
      return now >= start && now <= end;
    }) ||
    availableTerms
      .filter((term) => new Date(term.endDate).getTime() <= now.getTime())
      .at(-1);

  if (activeOrCompleted) {
    const end = new Date(activeOrCompleted.endDate);
    const start = new Date(activeOrCompleted.startDate);
    return {
      selectedTerm: activeOrCompleted,
      source:
        now >= start && now <= end ? "active" : "latest_completed",
    };
  }

  const upcoming = availableTerms.find(
    (term) => new Date(term.startDate).getTime() > now.getTime(),
  );
  if (upcoming) {
    return { selectedTerm: upcoming, source: "upcoming" };
  }

  return {};
}

export async function fetchStudentGradesViewModel(
  studentId: string,
  mode: StudentGradesViewMode,
  options?: StudentGradesViewOptions,
): Promise<StudentGradesViewModel | null> {
  const years = await fetchAcademicYears();
  const selectedAcademicYearName =
    years.find((year) => year.id === options?.academicYearId)?.name;
  const enrollment =
    (selectedAcademicYearName
      ? getStudentEnrollmentByAcademicYear(studentId, selectedAcademicYearName)
      : undefined) || getStudentEnrollment(studentId);
  if (!enrollment) {
    return null;
  }

  const availableTerms = selectedAcademicYearName
    ? getStudentTermsByAcademicYear(studentId, selectedAcademicYearName)
    : getStudentTerms(studentId);
  const ytdPerformance = selectedAcademicYearName
    ? getStudentYTDPerformanceByAcademicYear(studentId, selectedAcademicYearName)
    : getStudentYTDPerformance(studentId);

  let selectedTerm: EnrollmentTerm | undefined;
  let selectedTermSource: SelectedTermSource | undefined;

  if (mode === "current") {
    const currentResolution = resolveCurrentModeTerm(
      availableTerms,
      options?.termId,
    );
    selectedTerm = currentResolution.selectedTerm;
    selectedTermSource = currentResolution.source;
  } else if (mode !== "ytd") {
    selectedTerm = selectedAcademicYearName
      ? getStudentTermByNameForAcademicYear(
          studentId,
          selectedAcademicYearName,
          TERM_NAME_BY_MODE[mode],
        )
      : getStudentTermByName(studentId, TERM_NAME_BY_MODE[mode]);
    selectedTermSource = selectedTerm ? "explicit" : undefined;
  }

  const { academicYearId, structureTermId } = await resolveAcademicYearAndTermIds(
    enrollment,
    selectedTerm,
  );
  const selectedSnapshot =
    mode === "ytd"
      ? null
      : await fetchSelectedTermSnapshot(studentId, enrollment, selectedTerm);

  const homeroomTeacherAssignment = getStudentClassTeacher(
    studentId,
    selectedAcademicYearName,
  );
  const homeroomTeacher =
    homeroomTeacherAssignment?.teacherNameArabic ||
    homeroomTeacherAssignment?.teacherName;

  const selectedAverage =
    mode === "ytd"
      ? ytdPerformance?.gradeAverage || 0
      : selectedTerm?.gradeAverage || 0;
  const selectedAttendance =
    mode === "ytd"
      ? ytdPerformance?.attendance || 0
      : selectedTerm?.attendancePercentage || 0;
  const riskFlags = getRiskFlagsForMode(mode, selectedTerm, ytdPerformance);

  const subjectRows: StudentGradesSubjectRow[] =
    selectedSnapshot?.subjectRows.map((row) => {
      const teacherAssignment = getStudentSubjectTeacher(
        studentId,
        row.subjectName,
        selectedAcademicYearName,
      );
      return {
        id: row.subjectId,
        subject: row.subjectName,
        subjectAr: row.subjectNameAr,
        teacher:
          teacherAssignment?.teacherName || "-",
        teacherAr: teacherAssignment?.teacherNameArabic,
        average: row.average,
        lastAssessmentScore: row.lastAssessmentScore,
        assessmentsCount: row.assessmentsCount,
        trend: row.trend,
      };
    }) || [];

  const highestFallback = getTermMetricFallback(availableTerms, "highest");
  const lowestFallback = getTermMetricFallback(availableTerms, "lowest");

  const highestValue =
    subjectRows.length > 0
      ? Math.max(...subjectRows.map((row) => row.average))
      : highestFallback.value;
  const lowestValue =
    subjectRows.length > 0
      ? Math.min(...subjectRows.map((row) => row.average))
      : lowestFallback.value;

  const kpis: StudentGradesKpi[] = [
    {
      id: "average",
      titleKey: mode === "ytd" ? "kpis.ytd_average" : "kpis.term_average",
      value: formatPercent(selectedAverage),
      subtitleKey: mode === "ytd" ? "kpis.ytd_subtitle" : "kpis.selected_term_subtitle",
      subtitleValues:
        mode === "ytd"
          ? undefined
          : {
              term:
                selectedTerm?.term ||
                "",
            },
      trend: availableTerms.map((term) => ({
        label: term.term,
        value: term.gradeAverage,
      })),
    },
    {
      id: "attendance",
      titleKey: "kpis.attendance",
      value: formatPercent(selectedAttendance),
      subtitleKey: mode === "ytd" ? "kpis.ytd_subtitle" : "kpis.selected_term_subtitle",
      subtitleValues:
        mode === "ytd"
          ? undefined
          : {
              term: selectedTerm?.term || "",
            },
      trend: availableTerms.map((term) => ({
        label: term.term,
        value: term.attendancePercentage,
      })),
    },
    {
      id: "highest",
      titleKey:
        subjectRows.length > 0 ? "kpis.highest_grade" : "kpis.best_term_average",
      value: formatPercent(highestValue),
      subtitleKey:
        subjectRows.length > 0
          ? "kpis.subject_data_subtitle"
          : "kpis.term_data_subtitle",
      subtitleValues: {
        label:
          subjectRows.find((row) => row.average === highestValue)?.subject ||
          highestFallback.label,
      },
    },
    {
      id: "lowest",
      titleKey:
        subjectRows.length > 0 ? "kpis.lowest_grade" : "kpis.lowest_term_average",
      value: formatPercent(lowestValue),
      subtitleKey:
        subjectRows.length > 0
          ? "kpis.subject_data_subtitle"
          : "kpis.term_data_subtitle",
      subtitleValues: {
        label:
          subjectRows.find((row) => row.average === lowestValue)?.subject ||
          lowestFallback.label,
      },
    },
    {
      id: "risk",
      titleKey: "kpis.risk_flags",
      value: riskFlags.length,
      subtitleKey: "kpis.risk_flags_subtitle",
    },
  ];

  const summaryRows: StudentGradesSummaryRow[] = [
    {
      id: "average",
      metricKey: "summary.term_average",
      value: formatPercent(selectedAverage),
      detail:
        mode === "ytd"
          ? "YTD"
          : selectedTerm?.term || "-",
    },
    {
      id: "attendance",
      metricKey: "summary.attendance",
      value: formatPercent(selectedAttendance),
      detail:
        mode === "ytd"
          ? "YTD"
          : selectedTerm?.term || "-",
    },
    {
      id: "risk",
      metricKey: "summary.risk_flags",
      value: String(riskFlags.length),
      detail: riskFlags.join(", ") || "-",
    },
    {
      id: "teacher",
      metricKey: "summary.homeroom_teacher",
      value: homeroomTeacher || "-",
      detail: enrollment.section,
    },
  ];

  const contextItems: StudentGradesContextItem[] = [
    { id: "year", labelKey: "context.academic_year", value: enrollment.academicYear },
    { id: "grade", labelKey: "context.grade", value: enrollment.grade },
    { id: "section", labelKey: "context.section", value: enrollment.section },
    {
      id: "classroom",
      labelKey: "context.classroom",
      value: enrollment.classroom || "-",
    },
  ];

  return {
    enrollment,
    availableTerms,
    selectedMode: mode,
    selectedTerm,
    selectedModeLabelKey: getModeLabelKey(mode),
    selectedTermSource,
    currentTermLabelKey:
      selectedTermSource === "upcoming"
        ? "current_term_fallback.upcoming"
        : selectedTermSource === "latest_completed"
          ? "current_term_fallback.latest_completed"
          : "current_term_fallback.active",
    academicYearId,
    structureTermId,
    currentAverage: selectedAverage,
    attendance: selectedAttendance,
    riskFlags,
    contextItems,
    homeroomTeacher,
    kpis,
    performanceTrend: availableTerms.map((term) => ({
      label: term.term,
      value: term.gradeAverage,
    })),
    subjectRows,
    summaryRows,
    totalAssessments: selectedSnapshot?.totalAssessments,
  };
}
