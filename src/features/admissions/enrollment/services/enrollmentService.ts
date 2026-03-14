import type { Application } from "@/features/admissions/types/admissions";
import type { StudentEnrollment } from "@/features/students-guardians/students/types";
import {
  mockStudents,
} from "@/data/mockStudents";
import { upsertEnrollment } from "@/features/students-guardians/students/services/enrollmentService";

export interface EnrollmentSubmission {
  academicYear: string;
  grade: string;
  section: string;
  classroom: string;
  startDate: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

const resolveStudentIdForApplication = (application: Application) => {
  return (
    mockStudents.find((student) => student.applicationId === application.id)?.id ||
    `STU-${application.id}`
  );
};

export async function submitApplicationEnrollment(
  application: Application,
  payload: EnrollmentSubmission,
): Promise<StudentEnrollment> {
  const studentId = resolveStudentIdForApplication(application);
  return upsertEnrollment({
    studentId,
    academicYear: payload.academicYear,
    grade: payload.grade,
    section: payload.section,
    classroom: payload.classroom,
    gradeId: payload.gradeId,
    sectionId: payload.sectionId,
    classroomId: payload.classroomId,
    enrollmentDate: payload.startDate,
    status: "active",
  });
}
