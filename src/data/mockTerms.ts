// FILE: src/data/mockTerms.ts
// ERP Term performance mock data

import type { EnrollmentTerm } from "@/types/students";
import { mockStudentEnrollments } from "./mockEnrollments";
import { seededNumber, seededFloat } from "@/utils/seeded";

/**
 * Generate term data for all enrollments
 * Each enrollment gets 3 terms with deterministic performance data
 */
export const mockEnrollmentTerms: EnrollmentTerm[] =
  mockStudentEnrollments.flatMap((enrollment) => {
    const terms: EnrollmentTerm[] = [];

    // Term 1: September - December
    const term1Seed = `${enrollment.studentId}-T1`;
    const term1Attendance = seededNumber(term1Seed, 85, 100);
    const term1Average = seededNumber(`${term1Seed}-avg`, 70, 100);
    const term1RiskFlags: EnrollmentTerm["riskFlags"] = [];
    if (term1Attendance < 90) term1RiskFlags.push("attendance");
    if (term1Average < 75) term1RiskFlags.push("grades");
    // Add behavior risk for some students deterministically
    if (seededNumber(`${term1Seed}-behavior`, 0, 100) < 10) {
      term1RiskFlags.push("behavior");
    }

    terms.push({
      termId: `${enrollment.enrollmentId}-T1`,
      enrollmentId: enrollment.enrollmentId,
      term: "Term 1",
      startDate: "2026-09-01",
      endDate: "2026-12-15",
      attendancePercentage: term1Attendance,
      gradeAverage: term1Average,
      riskFlags: term1RiskFlags,
    });

    // Term 2: January - March
    const term2Seed = `${enrollment.studentId}-T2`;
    const term2Attendance = seededNumber(term2Seed, 85, 100);
    const term2Average = seededNumber(`${term2Seed}-avg`, 70, 100);
    const term2RiskFlags: EnrollmentTerm["riskFlags"] = [];
    if (term2Attendance < 90) term2RiskFlags.push("attendance");
    if (term2Average < 75) term2RiskFlags.push("grades");
    if (seededNumber(`${term2Seed}-behavior`, 0, 100) < 10) {
      term2RiskFlags.push("behavior");
    }

    terms.push({
      termId: `${enrollment.enrollmentId}-T2`,
      enrollmentId: enrollment.enrollmentId,
      term: "Term 2",
      startDate: "2027-01-05",
      endDate: "2027-03-20",
      attendancePercentage: term2Attendance,
      gradeAverage: term2Average,
      riskFlags: term2RiskFlags,
    });

    // Term 3: April - June
    const term3Seed = `${enrollment.studentId}-T3`;
    const term3Attendance = seededNumber(term3Seed, 85, 100);
    const term3Average = seededNumber(`${term3Seed}-avg`, 70, 100);
    const term3RiskFlags: EnrollmentTerm["riskFlags"] = [];
    if (term3Attendance < 90) term3RiskFlags.push("attendance");
    if (term3Average < 75) term3RiskFlags.push("grades");
    if (seededNumber(`${term3Seed}-behavior`, 0, 100) < 10) {
      term3RiskFlags.push("behavior");
    }

    terms.push({
      termId: `${enrollment.enrollmentId}-T3`,
      enrollmentId: enrollment.enrollmentId,
      term: "Term 3",
      startDate: "2027-04-01",
      endDate: "2027-06-20",
      attendancePercentage: term3Attendance,
      gradeAverage: term3Average,
      riskFlags: term3RiskFlags,
    });

    return terms;
  });

/**
 * Get terms for a specific enrollment
 */
export function getTermsByEnrollmentId(enrollmentId: string): EnrollmentTerm[] {
  return mockEnrollmentTerms.filter((t) => t.enrollmentId === enrollmentId);
}

/**
 * Get current term for an enrollment (based on current date)
 */
export function getCurrentTerm(
  enrollmentId: string,
): EnrollmentTerm | undefined {
  const now = new Date();
  const terms = getTermsByEnrollmentId(enrollmentId);

  return (
    terms.find((term) => {
      const start = new Date(term.startDate);
      const end = new Date(term.endDate);
      return now >= start && now <= end;
    }) || terms[0]
  ); // Default to Term 1 if no match
}

/**
 * Get latest term for an enrollment
 */
export function getLatestTerm(
  enrollmentId: string,
): EnrollmentTerm | undefined {
  const terms = getTermsByEnrollmentId(enrollmentId);
  return terms[terms.length - 1];
}

/**
 * Calculate year-to-date averages for an enrollment
 */
export function getYearToDateAverages(enrollmentId: string): {
  attendance: number;
  gradeAverage: number;
  riskFlags: EnrollmentTerm["riskFlags"];
} {
  const terms = getTermsByEnrollmentId(enrollmentId);

  if (terms.length === 0) {
    return { attendance: 0, gradeAverage: 0, riskFlags: [] };
  }

  const totalAttendance = terms.reduce(
    (sum, t) => sum + t.attendancePercentage,
    0,
  );
  const totalGrades = terms.reduce((sum, t) => sum + t.gradeAverage, 0);

  const avgAttendance = Math.round(totalAttendance / terms.length);
  const avgGrades = Math.round(totalGrades / terms.length);

  // Aggregate risk flags
  const allRiskFlags = new Set<EnrollmentTerm["riskFlags"][number]>();
  terms.forEach((term) => {
    term.riskFlags.forEach((flag) => allRiskFlags.add(flag));
  });

  return {
    attendance: avgAttendance,
    gradeAverage: avgGrades,
    riskFlags: Array.from(allRiskFlags),
  };
}
