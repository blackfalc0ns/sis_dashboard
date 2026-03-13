import type { Application } from "@/features/admissions/types/admissions";
import type { StudentEnrollment } from "@/features/students-guardians/students/types";
import {
  getEnrollmentByStudentId,
  mockStudents,
  upsertStudentEnrollment,
} from "@/data/mockStudents";

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
  const existingEnrollment = getEnrollmentByStudentId(studentId);

  return upsertStudentEnrollment({
    enrollmentId: existingEnrollment?.enrollmentId,
    studentId,
    academicYear: payload.academicYear,
    grade: payload.grade,
    section: payload.section,
    classroom: payload.classroom,
    gradeId: payload.gradeId,
    sectionId: payload.sectionId,
    classroomId: payload.classroomId,
    enrollmentDate: payload.startDate,
    status: existingEnrollment?.status || "active",
  });
}
