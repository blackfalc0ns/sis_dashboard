// FILE: src/data/mockEnrollments.ts
// ERP Enrollment mock data

import type {
  EnrollmentMovement,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import {
  getStructureTreeSnapshot,
  resolveStructureContextForAcademicYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { mockStudents } from "./mockDataLinked";

const deriveAcademicYear = (studentId: string) => {
  if (studentId.startsWith("2024-")) return "2024-2025";
  if (studentId.startsWith("2025-")) return "2025-2026";
  if (studentId.startsWith("STU-APP-2024") || studentId.startsWith("STU-APP-2026")) {
    return "2026-2027";
  }
  return "2026-2027";
};

const getLegacySectionLabel = (name: string) => {
  const englishMatch = name.match(/section\s+(.+)$/i);
  if (englishMatch?.[1]) return englishMatch[1].trim();

  const arabicMatch = name.match(/شعبة\s+(.+)$/);
  if (arabicMatch?.[1]) return arabicMatch[1].trim();

  return name;
};

const buildPlacement = (academicYear: string, gradeName: string, seedIndex: number) => {
  const structureContext = resolveStructureContextForAcademicYear(academicYear);
  if (!structureContext) {
    return {
      grade: gradeName,
      section: ["A", "B", "C"][seedIndex % 3],
    };
  }

  const structure = getStructureTreeSnapshot(
    structureContext.academicYearId,
    structureContext.termId,
  );
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

const buildEnrollment = (
  student: (typeof mockStudents)[number],
  index: number,
): StudentEnrollment => {
  const academicYear = deriveAcademicYear(student.id);
  const placement = buildPlacement(academicYear, student.gradeRequested, index);
  const enrollmentDate = student.submittedDate || "2026-09-01";

  let status: StudentEnrollment["status"] = "active";
  if (student.status === "Withdrawn") {
    status = "withdrawn";
  }

  return {
    enrollmentId: `ENR-${student.id}`,
    studentId: student.id,
    academicYear,
    grade: placement.grade,
    section: placement.section,
    classroom: placement.classroom,
    gradeId: placement.gradeId,
    sectionId: placement.sectionId,
    classroomId: placement.classroomId,
    enrollmentDate,
    status,
  };
};

export const mockStudentEnrollments: StudentEnrollment[] = mockStudents.map((student, index) =>
  buildEnrollment(student, index),
);

export const mockEnrollmentMovements: EnrollmentMovement[] = mockStudentEnrollments.map(
  (enrollment) => ({
    id: `MOVE-${enrollment.enrollmentId}`,
    studentId: enrollment.studentId,
    academicYear: enrollment.academicYear,
    actionType: "enrolled",
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

const compareAcademicYears = (left: string, right: string) => {
  const leftStart = parseInt(left.split("-")[0] || "0", 10);
  const rightStart = parseInt(right.split("-")[0] || "0", 10);
  return leftStart - rightStart;
};

export function getEnrollmentByStudentId(
  studentId: string,
): StudentEnrollment | undefined {
  return mockStudentEnrollments
    .filter((enrollment) => enrollment.studentId === studentId)
    .sort((left, right) => compareAcademicYears(right.academicYear, left.academicYear))
    .sort((left, right) => {
      if (left.status === "active" && right.status !== "active") return -1;
      if (left.status !== "active" && right.status === "active") return 1;
      return 0;
    })[0];
}

export function getEnrollmentsByStudentId(studentId: string): StudentEnrollment[] {
  return mockStudentEnrollments
    .filter((enrollment) => enrollment.studentId === studentId)
    .sort((left, right) => compareAcademicYears(left.academicYear, right.academicYear));
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
      enrollment.academicYear === payload.academicYear,
  );

  const nextEnrollment: StudentEnrollment = {
    enrollmentId: payload.enrollmentId || `ENR-${payload.studentId}`,
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
