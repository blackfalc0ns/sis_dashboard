// FILE: src/data/mockEnrollments.ts
// ERP Enrollment mock data

import type {
  EnrollmentMovement,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import {
  getAcademicYearsSnapshot,
  getStructureTreeSnapshot,
  getTermsSnapshotByYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { mockStudents } from "./mockDataLinked";

const academicYears = getAcademicYearsSnapshot().sort((left, right) =>
  left.startDate.localeCompare(right.startDate),
);

const getLegacySectionLabel = (name: string) => {
  const englishMatch = name.match(/section\s+(.+)$/i);
  if (englishMatch?.[1]) return englishMatch[1].trim();

  const arabicMatch = name.match(/شعبة\s+(.+)$/);
  if (arabicMatch?.[1]) return arabicMatch[1].trim();

  return name;
};

const parseGradeNumber = (gradeName: string) => {
  const match = gradeName.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 1;
};

const toGradeName = (gradeNumber: number) => `Grade ${Math.max(1, Math.min(10, gradeNumber))}`;

const buildPlacement = (academicYearId: string, gradeName: string, seedIndex: number) => {
  const yearTerms = getTermsSnapshotByYear(academicYearId);
  const structureTerm = yearTerms[0];
  if (!structureTerm) {
    return {
      grade: gradeName,
      section: ["A", "B", "C"][seedIndex % 3],
    };
  }

  const structure = getStructureTreeSnapshot(academicYearId, structureTerm.id);
  const grade =
    structure.grades.find(
      (item) =>
        item.name === gradeName ||
        item.nameEn === gradeName ||
        item.nameAr === gradeName,
    ) || null;

  if (!grade) {
    return {
      grade: gradeName,
      section: ["A", "B", "C"][seedIndex % 3],
    };
  }

  const sections = structure.sections
    .filter((section) => section.gradeId === grade.id)
    .sort((a, b) => a.order - b.order);
  const section = sections[seedIndex % Math.max(sections.length, 1)] || null;

  if (!section) {
    return {
      grade: grade.nameEn || grade.nameAr || grade.name,
      gradeId: grade.id,
      section: ["A", "B", "C"][seedIndex % 3],
    };
  }

  const classrooms = structure.classrooms
    .filter((classroom) => classroom.sectionId === section.id)
    .sort((a, b) => a.order - b.order);
  const classroom = classrooms[seedIndex % Math.max(classrooms.length, 1)] || null;

  return {
    grade: grade.nameEn || grade.nameAr || grade.name,
    gradeId: grade.id,
    section: getLegacySectionLabel(section.nameEn || section.nameAr || section.name),
    sectionId: section.id,
    classroom: classroom ? classroom.nameEn || classroom.nameAr || classroom.name : undefined,
    classroomId: classroom?.id,
  };
};

const buildHistoricalEnrollments = (
  student: (typeof mockStudents)[number],
  index: number,
): StudentEnrollment[] => {
  const historyDepth = (index % academicYears.length) + 1;
  const startingYearIndex = academicYears.length - historyDepth;
  const latestGradeNumber = parseGradeNumber(student.gradeRequested);

  return academicYears.slice(startingYearIndex).map((academicYear, historyIndex, scopedYears) => {
    const reverseOffset = scopedYears.length - historyIndex - 1;
    const gradeName = toGradeName(Math.max(1, latestGradeNumber - reverseOffset));
    const placement = buildPlacement(academicYear.id, gradeName, index + historyIndex);
    const isLatestEnrollment = historyIndex === scopedYears.length - 1;

    let status: StudentEnrollment["status"] = isLatestEnrollment ? "active" : "completed";
    if (isLatestEnrollment && student.status === "Withdrawn") {
      status = "withdrawn";
    }

    return {
      enrollmentId: `ENR-${student.id}-${academicYear.id}`,
      studentId: student.id,
      academicYearId: academicYear.id,
      academicYear: academicYear.nameEn || academicYear.nameAr || academicYear.name,
      grade: placement.grade,
      section: placement.section,
      classroom: placement.classroom,
      gradeId: placement.gradeId,
      sectionId: placement.sectionId,
      classroomId: placement.classroomId,
      enrollmentDate: academicYear.startDate,
      status,
    };
  });
};

export const mockStudentEnrollments: StudentEnrollment[] = mockStudents.flatMap((student, index) =>
  buildHistoricalEnrollments(student, index),
);

export const mockEnrollmentMovements: EnrollmentMovement[] = mockStudentEnrollments.map(
  (enrollment) => ({
    id: `MOVE-${enrollment.enrollmentId}`,
    studentId: enrollment.studentId,
    academicYear: enrollment.academicYear,
    actionType:
      enrollment.status === "withdrawn" ? "withdrawn" : "enrolled",
    toGradeId: enrollment.gradeId,
    toSectionId: enrollment.sectionId,
    toClassroomId: enrollment.classroomId,
    toGrade: enrollment.grade,
    toSection: enrollment.section,
    toClassroom: enrollment.classroom,
    effectiveDate: enrollment.enrollmentDate,
    createdAt: enrollment.enrollmentDate,
  }),
);

const compareAcademicYears = (left: StudentEnrollment, right: StudentEnrollment) => {
  const leftIndex = academicYears.findIndex((year) => year.id === left.academicYearId);
  const rightIndex = academicYears.findIndex((year) => year.id === right.academicYearId);
  return leftIndex - rightIndex;
};

const sortEnrollmentsForCurrentView = (enrollments: StudentEnrollment[]) =>
  [...enrollments].sort((left, right) => {
    if (left.status === "active" && right.status !== "active") return -1;
    if (left.status !== "active" && right.status === "active") return 1;
    return compareAcademicYears(right, left);
  });

export function getEnrollmentByStudentId(
  studentId: string,
): StudentEnrollment | undefined {
  return sortEnrollmentsForCurrentView(
    mockStudentEnrollments.filter((enrollment) => enrollment.studentId === studentId),
  )[0];
}

export function getEnrollmentByStudentIdAndAcademicYear(
  studentId: string,
  academicYearId: string,
): StudentEnrollment | undefined {
  return mockStudentEnrollments.find(
    (enrollment) =>
      enrollment.studentId === studentId && enrollment.academicYearId === academicYearId,
  );
}

export function getEnrollmentsByStudentId(studentId: string): StudentEnrollment[] {
  return mockStudentEnrollments
    .filter((enrollment) => enrollment.studentId === studentId)
    .sort(compareAcademicYears);
}

export function getEnrollmentMovementsByStudentId(studentId: string): EnrollmentMovement[] {
  return mockEnrollmentMovements
    .filter((movement) => movement.studentId === studentId)
    .sort(
      (left, right) =>
        new Date(right.effectiveDate).getTime() - new Date(left.effectiveDate).getTime(),
    );
}

export function getEnrollmentsByGrade(grade: string): StudentEnrollment[] {
  return mockStudentEnrollments.filter((enrollment) => enrollment.grade === grade);
}

export function getEnrollmentsBySection(
  grade: string,
  section: string,
): StudentEnrollment[] {
  return mockStudentEnrollments.filter(
    (enrollment) => enrollment.grade === grade && enrollment.section === section,
  );
}

export function getEnrollmentsBySectionId(sectionId: string): StudentEnrollment[] {
  return mockStudentEnrollments.filter((enrollment) => enrollment.sectionId === sectionId);
}

export function getEnrollmentsByClassroomId(classroomId: string): StudentEnrollment[] {
  return mockStudentEnrollments.filter((enrollment) => enrollment.classroomId === classroomId);
}

export function getEnrollmentClassroom(studentId: string): StudentEnrollment["classroom"] {
  return getEnrollmentByStudentId(studentId)?.classroom;
}

export function upsertStudentEnrollment(
  payload: Omit<StudentEnrollment, "enrollmentId"> & { enrollmentId?: string },
): StudentEnrollment {
  const existingIndex = mockStudentEnrollments.findIndex(
    (enrollment) =>
      enrollment.studentId === payload.studentId &&
      enrollment.academicYearId === payload.academicYearId,
  );

  const nextEnrollment: StudentEnrollment = {
    enrollmentId:
      payload.enrollmentId ||
      `ENR-${payload.studentId}-${payload.academicYearId || payload.academicYear}`,
    ...payload,
  };

  if (existingIndex >= 0) {
    mockStudentEnrollments[existingIndex] = {
      ...mockStudentEnrollments[existingIndex],
      ...nextEnrollment,
    };
    return mockStudentEnrollments[existingIndex];
  }

  mockStudentEnrollments.push(nextEnrollment);
  return nextEnrollment;
}
