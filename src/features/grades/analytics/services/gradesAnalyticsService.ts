import { fetchOverviewGradebook, fetchScopeGradeRule } from "../../overview/services/gradesOverviewService";
import type { GradesScopeFilters } from "../../shared/types";
import type { GradesAnalyticsReport, GradesDistributionBucket, GradesStudentAnalyticsRow } from "../types";

const round1 = (value: number) => Math.round(value * 10) / 10;

const buildDistribution = (averages: number[]): GradesDistributionBucket[] => {
  const buckets = [
    { label: "90-100", min: 90, max: 100, count: 0 },
    { label: "80-89", min: 80, max: 89.99, count: 0 },
    { label: "70-79", min: 70, max: 79.99, count: 0 },
    { label: "60-69", min: 60, max: 69.99, count: 0 },
    { label: "0-59", min: 0, max: 59.99, count: 0 },
  ];

  averages.forEach((average) => {
    const bucket = buckets.find((item) => average >= item.min && average <= item.max);
    if (bucket) {
      bucket.count += 1;
    }
  });

  return buckets.map(({ label, count }) => ({ label, count }));
};

export async function fetchGradesAnalytics(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters,
): Promise<GradesAnalyticsReport> {
  const [gradebook, rule] = await Promise.all([
    fetchOverviewGradebook(academicYearId, termId, filters),
    filters.scopeType && filters.scopeId
      ? fetchScopeGradeRule(academicYearId, termId, filters.scopeType, filters.scopeId)
      : Promise.resolve(null),
  ]);

  const passMark = rule?.passMark ?? 50;
  const rows: GradesStudentAnalyticsRow[] = gradebook.rows.map((row) => {
    const completionRate = row.totalItems > 0 ? round1((row.completedItems / row.totalItems) * 100) : 0;
    return {
      studentId: row.studentId,
      studentNameEn: row.studentNameEn,
      studentNameAr: row.studentNameAr,
      classroomName: row.classroomName,
      average: row.average,
      completionRate,
      completedItems: row.completedItems,
      totalItems: row.totalItems,
      status: row.average >= passMark ? "passing" : "failing",
    };
  });

  const meaningfulAverages = rows.map((row) => row.average).filter((value) => value > 0);
  const failingStudents = rows.filter((row) => row.average > 0 && row.average < passMark).length;

  return {
    kpis: {
      classAverage: gradebook.summary.classAverage,
      passRate: rows.length > 0 ? round1(((rows.length - failingStudents) / rows.length) * 100) : 0,
      completionRate: gradebook.summary.completionRate,
      failingStudents,
    },
    distribution: buildDistribution(meaningfulAverages),
    assessmentPerformance: gradebook.trend.map((point) => ({
      assessmentId: point.assessmentId,
      label: point.label,
      average: point.average,
      enteredCount: point.enteredCount,
      maxScore: point.maxScore,
    })),
    topStudents: rows.slice().sort((left, right) => right.average - left.average).slice(0, 5),
    lowestStudents: rows.filter((row) => row.average > 0).slice().sort((left, right) => left.average - right.average).slice(0, 5),
  };
}
