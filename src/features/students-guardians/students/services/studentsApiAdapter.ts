import { apiWithToken } from "@/lib/api";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import * as studentsApiService from "@/features/students-guardians/students/services/studentsApiService";
import type { StudentsAdapter } from "@/features/students-guardians/students/services/studentsAdapter";
import type { StudentWithEnrollmentContext } from "@/features/students-guardians/students/services/studentsService";
import type {
  Student,
  StudentGuardian,
  StudentStatus,
  UpdateStudentPayload,
} from "@/features/students-guardians/students/types";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

const unwrap = async <T>(request: Promise<ApiEnvelope<T> | T>): Promise<T> => {
  const response = await request;

  if (
    response &&
    typeof response === "object" &&
    ("data" in response || "error" in response || "message" in response)
  ) {
    const envelope = response as ApiEnvelope<T>;
    if (envelope.error) {
      throw new Error(envelope.error);
    }
    if (typeof envelope.data === "undefined") {
      throw new Error(envelope.message || "Missing API response data");
    }
    return envelope.data;
  }

  return response as T;
};

const attachEnrollments = (
  students: Student[],
  enrollments: Awaited<ReturnType<typeof fetchEnrollments>>,
): StudentWithEnrollmentContext[] => {
  const enrollmentByStudentId = new Map(
    enrollments.map((enrollment) => [enrollment.studentId, enrollment]),
  );

  return students.map((student) => ({
    ...student,
    enrollment: enrollmentByStudentId.get(student.id),
  }));
};

const fetchStudentsWithActiveEnrollments = async (
  academicYearId?: string | null,
): Promise<StudentWithEnrollmentContext[]> => {
  const [students, enrollments] = await Promise.all([
    studentsApiService.fetchStudents(),
    fetchEnrollments({
      ...(academicYearId ? { academicYearId } : {}),
      status: "active",
    }),
  ]);
  return attachEnrollments(students, enrollments);
};

export const createStudentsApiAdapter = (
  basePath: string = "/students-guardians/students",
): StudentsAdapter => ({
  getAllStudents: () => {
    throw new Error("students_api_sync_not_supported");
  },
  getStudentById: () => {
    throw new Error("students_api_sync_not_supported");
  },
  updateStudent: (studentId, payload: UpdateStudentPayload) =>
    unwrap<Student>(
      apiWithToken(`${basePath}/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  getStudentsByStatus: (_status: StudentStatus) => {
    throw new Error("students_api_sync_not_supported");
  },
  getStudentsByGrade: (_grade) => {
    throw new Error("students_api_sync_not_supported");
  },
  getAtRiskStudents: () => {
    throw new Error("students_api_sync_not_supported");
  },
  searchStudents: (_query) => {
    throw new Error("students_api_sync_not_supported");
  },
  getStudentGuardians: (_studentId) => {
    throw new Error("students_api_sync_not_supported");
  },
  getPrimaryGuardian: (_studentId) => {
    throw new Error("students_api_sync_not_supported");
  },
  getGuardianStudents: (_guardianId) => {
    throw new Error("students_api_sync_not_supported");
  },
  getAllGuardians: () => {
    throw new Error("students_api_sync_not_supported");
  },
  getGuardianById: (_guardianId) => {
    throw new Error("students_api_sync_not_supported");
  },
  getStudentDocuments: (_studentId) => {
    throw new Error("students_api_sync_not_supported");
  },
  getMissingDocuments: (_studentId) => {
    throw new Error("students_api_sync_not_supported");
  },
  getStudentsWithEnrollment: () => {
    throw new Error("students_api_sync_not_supported");
  },
  getStudentsWithEnrollmentForContext: () => {
    throw new Error("students_api_sync_not_supported");
  },
  fetchAllGuardians: () =>
    unwrap<StudentGuardian[]>(
      apiWithToken(`${basePath}/guardians`, {
        method: "GET",
      }),
    ),
  fetchAllStudents: () =>
    unwrap<Student[]>(
      apiWithToken(basePath, {
        method: "GET",
      }),
    ),
  fetchStudentById: (id) =>
    unwrap<Student | undefined>(
      apiWithToken(`${basePath}/${id}`, {
        method: "GET",
      }),
    ),
  fetchStudentGuardians: (studentId) =>
    unwrap<StudentGuardian[]>(
      apiWithToken(`${basePath}/${studentId}/guardians`, {
        method: "GET",
      }),
    ),
  fetchPrimaryGuardian: (studentId) =>
    unwrap<StudentGuardian | undefined>(
      apiWithToken(`${basePath}/${studentId}/guardians/primary`, {
        method: "GET",
      }),
    ),
  fetchGuardianStudents: (guardianId) =>
    unwrap<Student[]>(
      apiWithToken(`${basePath}/guardians/${guardianId}/students`, {
        method: "GET",
      }),
    ),
  fetchGuardianById: (guardianId) =>
    unwrap<StudentGuardian | undefined>(
      apiWithToken(`${basePath}/guardians/${guardianId}`, {
        method: "GET",
      }),
    ),
  fetchStudentsWithEnrollment: () => fetchStudentsWithActiveEnrollments(),
  fetchStudentsWithEnrollmentForContext: (academicYearId) =>
    fetchStudentsWithActiveEnrollments(academicYearId),
});

export const studentsApiAdapter = createStudentsApiAdapter();
