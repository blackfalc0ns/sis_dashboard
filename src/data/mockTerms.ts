// FILE: src/data/mockTerms.ts
// ERP Term performance mock data

import type { EnrollmentTerm } from "@/features/students-guardians/students/types";
import { getTermsSnapshotByYear } from "@/features/academics/academic-structure-tree/services/structureService";
import { mockStudentEnrollments } from "./mockEnrollments";
import { seededNumber } from "@/utils/seeded";

const getTermPerformance = (studentId: string, termName: EnrollmentTerm["term"]) => {
  const termIndex = Number.parseInt(termName.replace("Term ", ""), 10);
  const attendanceBase = 82 + termIndex * 4;
  const averageBase = 68 + termIndex * 6;

  return {
    attendance: seededNumber(`${studentId}-${termName}-attendance`, attendanceBase, attendanceBase + 10),
    gradeAverage: seededNumber(`${studentId}-${termName}-average`, averageBase, averageBase + 12),
    behaviorSeed: seededNumber(`${studentId}-${termName}-behavior`, 0, 100),
  };
};

export const mockEnrollmentTerms: EnrollmentTerm[] = mockStudentEnrollments.flatMap((enrollment) => {
  const yearTerms = enrollment.academicYearId
    ? getTermsSnapshotByYear(enrollment.academicYearId)
    : [];

  return yearTerms.map((termRecord) => {
    const termName = (termRecord.nameEn || termRecord.name || "Term 1") as EnrollmentTerm["term"];
    const performance = getTermPerformance(enrollment.studentId, termName);
    const riskFlags: EnrollmentTerm["riskFlags"] = [];

    if (performance.attendance < 90) riskFlags.push("attendance");
    if (performance.gradeAverage < 75) riskFlags.push("grades");
    if (performance.behaviorSeed < 15) riskFlags.push("behavior");

    return {
      termId: `${enrollment.enrollmentId}-${termRecord.id}`,
      enrollmentId: enrollment.enrollmentId,
      termRecordId: termRecord.id,
      academicYearId: enrollment.academicYearId,
      term: termName,
      startDate: termRecord.startDate,
      endDate: termRecord.endDate,
      attendancePercentage: performance.attendance,
      gradeAverage: performance.gradeAverage,
      riskFlags,
    };
  });
});

export function getTermsByEnrollmentId(enrollmentId: string): EnrollmentTerm[] {
  return mockEnrollmentTerms.filter((term) => term.enrollmentId === enrollmentId);
}

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
  );
}

export function getLatestTerm(
  enrollmentId: string,
): EnrollmentTerm | undefined {
  const terms = getTermsByEnrollmentId(enrollmentId);
  return terms[terms.length - 1];
}

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
    (sum, term) => sum + term.attendancePercentage,
    0,
  );
  const totalGrades = terms.reduce((sum, term) => sum + term.gradeAverage, 0);

  const allRiskFlags = new Set<EnrollmentTerm["riskFlags"][number]>();
  terms.forEach((term) => {
    term.riskFlags.forEach((flag) => allRiskFlags.add(flag));
  });

  return {
    attendance: Math.round(totalAttendance / terms.length),
    gradeAverage: Math.round(totalGrades / terms.length),
    riskFlags: Array.from(allRiskFlags),
  };
}
