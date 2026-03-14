// FILE: src/data/mockTeacherAssignments.ts
// ERP Teacher assignment mock data

import type {
  ClassTeacherAssignment,
  SubjectTeacherAssignment,
} from "@/features/students-guardians/students/types";

const academicYear = "2026-2027";

/**
 * Class Teacher Assignments (Homeroom Teachers)
 * One teacher per grade-section combination
 */
export const mockClassTeacherAssignments: ClassTeacherAssignment[] = [
  // Grade 6
  {
    assignmentId: "CTA-2026-G6-A",
    academicYear,
    grade: "Grade 6",
    section: "A",
    classroomId: "classroom-6",
    teacherId: "T001",
    teacherName: "Ms. Sarah Johnson",
    teacherNameArabic: "السيدة سارة جونسون",
  },
  {
    assignmentId: "CTA-2026-G6-B",
    academicYear,
    grade: "Grade 6",
    section: "B",
    classroomId: "classroom-8",
    teacherId: "T002",
    teacherName: "Mr. Ahmed Al-Mansoori",
    teacherNameArabic: "السيد أحمد المنصوري",
  },
  {
    assignmentId: "CTA-2026-G6-C",
    academicYear,
    grade: "Grade 6",
    section: "C",
    teacherId: "T003",
    teacherName: "Ms. Fatima Al-Zaabi",
    teacherNameArabic: "السيدة فاطمة الزعابي",
  },

  // Grade 7
  {
    assignmentId: "CTA-2026-G7-A",
    academicYear,
    grade: "Grade 7",
    section: "A",
    classroomId: "classroom-9",
    teacherId: "T004",
    teacherName: "Dr. Mohammed Hassan",
    teacherNameArabic: "الدكتور محمد حسن",
  },
  {
    assignmentId: "CTA-2026-G7-B",
    academicYear,
    grade: "Grade 7",
    section: "B",
    teacherId: "T005",
    teacherName: "Ms. Layla Ibrahim",
    teacherNameArabic: "السيدة ليلى إبراهيم",
  },
  {
    assignmentId: "CTA-2026-G7-C",
    academicYear,
    grade: "Grade 7",
    section: "C",
    teacherId: "T006",
    teacherName: "Mr. Khalid Omar",
    teacherNameArabic: "السيد خالد عمر",
  },

  // Grade 8
  {
    assignmentId: "CTA-2026-G8-A",
    academicYear,
    grade: "Grade 8",
    section: "A",
    classroomId: "classroom-11",
    teacherId: "T007",
    teacherName: "Ms. Aisha Abdullah",
    teacherNameArabic: "السيدة عائشة عبدالله",
  },
  {
    assignmentId: "CTA-2026-G8-B",
    academicYear,
    grade: "Grade 8",
    section: "B",
    teacherId: "T008",
    teacherName: "Dr. Salem Rashid",
    teacherNameArabic: "الدكتور سالم راشد",
  },
  {
    assignmentId: "CTA-2026-G8-C",
    academicYear,
    grade: "Grade 8",
    section: "C",
    teacherId: "T009",
    teacherName: "Ms. Mariam Ali",
    teacherNameArabic: "السيدة مريم علي",
  },

  // Grade 9
  {
    assignmentId: "CTA-2026-G9-A",
    academicYear,
    grade: "Grade 9",
    section: "A",
    classroomId: "classroom-13",
    teacherId: "T010",
    teacherName: "Mr. Youssef Mohammed",
    teacherNameArabic: "السيد يوسف محمد",
  },
  {
    assignmentId: "CTA-2026-G9-B",
    academicYear,
    grade: "Grade 9",
    section: "B",
    teacherId: "T011",
    teacherName: "Ms. Hessa Salem",
    teacherNameArabic: "السيدة حصة سالم",
  },
  {
    assignmentId: "CTA-2026-G9-C",
    academicYear,
    grade: "Grade 9",
    section: "C",
    teacherId: "T012",
    teacherName: "Dr. Abdullah Khalid",
    teacherNameArabic: "الدكتور عبدالله خالد",
  },

  // Grade 10
  {
    assignmentId: "CTA-2026-G10-A",
    academicYear,
    grade: "Grade 10",
    section: "A",
    classroomId: "classroom-15",
    teacherId: "T013",
    teacherName: "Ms. Noura Ahmed",
    teacherNameArabic: "السيدة نورة أحمد",
  },
  {
    assignmentId: "CTA-2026-G10-B",
    academicYear,
    grade: "Grade 10",
    section: "B",
    teacherId: "T014",
    teacherName: "Mr. Hassan Ibrahim",
    teacherNameArabic: "السيد حسن إبراهيم",
  },
  {
    assignmentId: "CTA-2026-G10-C",
    academicYear,
    grade: "Grade 10",
    section: "C",
    teacherId: "T015",
    teacherName: "Dr. Fatima Omar",
    teacherNameArabic: "الدكتورة فاطمة عمر",
  },
];

/**
 * Subject Teacher Assignments
 * Multiple teachers per grade-section for different subjects
 */
export const mockSubjectTeacherAssignments: SubjectTeacherAssignment[] = [
  // Grade 6 - Section A
  {
    assignmentId: "STA-2026-G6-A-MATH",
    academicYear,
    grade: "Grade 6",
    section: "A",
    classroomId: "classroom-6",
    subject: "Mathematics",
    teacherId: "T101",
    teacherName: "Dr. Ahmed Al-Mansoori",
    teacherNameArabic: "الدكتور أحمد المنصوري",
  },
  {
    assignmentId: "STA-2026-G6-A-SCI",
    academicYear,
    grade: "Grade 6",
    section: "A",
    classroomId: "classroom-6",
    subject: "Science",
    teacherId: "T102",
    teacherName: "Ms. Sarah Johnson",
    teacherNameArabic: "السيدة سارة جونسون",
  },
  {
    assignmentId: "STA-2026-G6-A-ENG",
    academicYear,
    grade: "Grade 6",
    section: "A",
    classroomId: "classroom-7",
    subject: "English",
    teacherId: "T103",
    teacherName: "Mr. John Smith",
    teacherNameArabic: "السيد جون سميث",
  },
  {
    assignmentId: "STA-2026-G6-A-ARA",
    academicYear,
    grade: "Grade 6",
    section: "A",
    classroomId: "classroom-7",
    subject: "Arabic",
    teacherId: "T104",
    teacherName: "Ms. Fatima Al-Zaabi",
    teacherNameArabic: "السيدة فاطمة الزعابي",
  },
  {
    assignmentId: "STA-2026-G6-A-ISL",
    academicYear,
    grade: "Grade 6",
    section: "A",
    classroomId: "classroom-6",
    subject: "Islamic Studies",
    teacherId: "T105",
    teacherName: "Sheikh Mohammed Hassan",
    teacherNameArabic: "الشيخ محمد حسن",
  },

  // Grade 7 - Section A (sample)
  {
    assignmentId: "STA-2026-G7-A-MATH",
    academicYear,
    grade: "Grade 7",
    section: "A",
    classroomId: "classroom-9",
    subject: "Mathematics",
    teacherId: "T106",
    teacherName: "Dr. Layla Ibrahim",
    teacherNameArabic: "الدكتورة ليلى إبراهيم",
  },
  {
    assignmentId: "STA-2026-G7-A-SCI",
    academicYear,
    grade: "Grade 7",
    section: "A",
    classroomId: "classroom-9",
    subject: "Science",
    teacherId: "T107",
    teacherName: "Mr. Khalid Omar",
    teacherNameArabic: "السيد خالد عمر",
  },

  // Grade 8 - Section A (sample)
  {
    assignmentId: "STA-2026-G8-A-MATH",
    academicYear,
    grade: "Grade 8",
    section: "A",
    classroomId: "classroom-11",
    subject: "Mathematics",
    teacherId: "T108",
    teacherName: "Dr. Aisha Abdullah",
    teacherNameArabic: "الدكتورة عائشة عبدالله",
  },
  {
    assignmentId: "STA-2026-G8-A-SCI",
    academicYear,
    grade: "Grade 8",
    section: "A",
    classroomId: "classroom-11",
    subject: "Science",
    teacherId: "T109",
    teacherName: "Mr. Salem Rashid",
    teacherNameArabic: "السيد سالم راشد",
  },
];

/**
 * Get class teacher for a specific grade and section
 */
type AssignmentLookupParams = {
  grade?: string;
  section?: string;
  classroomId?: string;
  year?: string;
};

const matchAssignmentTarget = <T extends { academicYear: string; grade: string; section: string; classroomId?: string }>(
  assignment: T,
  params: AssignmentLookupParams,
) => {
  const year = params.year || academicYear;
  if (assignment.academicYear !== year) return false;
  if (params.classroomId && assignment.classroomId === params.classroomId) return true;

  return assignment.grade === params.grade && assignment.section === params.section;
};

export function getClassTeacher(
  grade: string,
  section: string,
  year?: string,
): ClassTeacherAssignment | undefined;
export function getClassTeacher(
  params: AssignmentLookupParams,
): ClassTeacherAssignment | undefined;
export function getClassTeacher(
  gradeOrParams: string | AssignmentLookupParams,
  section?: string,
  year: string = academicYear,
): ClassTeacherAssignment | undefined {
  const params =
    typeof gradeOrParams === "string"
      ? { grade: gradeOrParams, section, year }
      : gradeOrParams;

  return mockClassTeacherAssignments.find((assignment) =>
    matchAssignmentTarget(assignment, params),
  );
}

/**
 * Get all subject teachers for a specific grade and section
 */
export function getSubjectTeachers(
  grade: string,
  section: string,
  year?: string,
): SubjectTeacherAssignment[];
export function getSubjectTeachers(
  params: AssignmentLookupParams,
): SubjectTeacherAssignment[];
export function getSubjectTeachers(
  gradeOrParams: string | AssignmentLookupParams,
  section?: string,
  year: string = academicYear,
): SubjectTeacherAssignment[] {
  const params =
    typeof gradeOrParams === "string"
      ? { grade: gradeOrParams, section, year }
      : gradeOrParams;

  return mockSubjectTeacherAssignments.filter((assignment) =>
    matchAssignmentTarget(assignment, params),
  );
}

/**
 * Get subject teacher for a specific subject
 */
export function getSubjectTeacher(
  grade: string,
  section: string,
  subject: string,
  year?: string,
): SubjectTeacherAssignment | undefined;
export function getSubjectTeacher(
  params: AssignmentLookupParams & { subject: string },
): SubjectTeacherAssignment | undefined;
export function getSubjectTeacher(
  gradeOrParams: string | (AssignmentLookupParams & { subject: string }),
  section?: string,
  subject?: string,
  year: string = academicYear,
): SubjectTeacherAssignment | undefined {
  const params =
    typeof gradeOrParams === "string"
      ? { grade: gradeOrParams, section, subject: subject || "", year }
      : gradeOrParams;

  return mockSubjectTeacherAssignments.find(
    (assignment) =>
      assignment.subject === params.subject && matchAssignmentTarget(assignment, params),
  );
}
