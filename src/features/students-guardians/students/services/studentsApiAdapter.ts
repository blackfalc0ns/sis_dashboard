import { apiWithToken } from "@/lib/api";
import type { StudentsAdapter } from "@/features/students-guardians/students/services/studentsAdapter";
import type { StudentWithEnrollmentContext } from "@/features/students-guardians/students/services/studentsService";
import type {
  Student,
  StudentDocument,
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

const buildQuery = (params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `?${search.toString()}`;
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
  getStudentsByStatus: (status: StudentStatus) =>
    unwrap<Student[]>(
      apiWithToken(`${basePath}${buildQuery({ status })}`, {
        method: "GET",
      }),
    ),
  getStudentsByGrade: (grade) =>
    unwrap<Student[]>(
      apiWithToken(`${basePath}${buildQuery({ grade })}`, {
        method: "GET",
      }),
    ),
  getAtRiskStudents: () =>
    unwrap<Student[]>(
      apiWithToken(`${basePath}/at-risk`, {
        method: "GET",
      }),
    ),
  searchStudents: (query) =>
    unwrap<Student[]>(
      apiWithToken(`${basePath}/search${buildQuery({ q: query })}`, {
        method: "GET",
      }),
    ),
  getStudentGuardians: (studentId) =>
    unwrap<StudentGuardian[]>(
      apiWithToken(`${basePath}/${studentId}/guardians`, {
        method: "GET",
      }),
    ),
  getPrimaryGuardian: (studentId) =>
    unwrap<StudentGuardian | undefined>(
      apiWithToken(`${basePath}/${studentId}/guardians/primary`, {
        method: "GET",
      }),
    ),
  getGuardianStudents: (guardianId) =>
    unwrap<Student[]>(
      apiWithToken(`${basePath}/guardians/${guardianId}/students`, {
        method: "GET",
      }),
    ),
  getAllGuardians: () => {
    throw new Error("students_api_sync_not_supported");
  },
  getGuardianById: (guardianId) =>
    unwrap<StudentGuardian | undefined>(
      apiWithToken(`${basePath}/guardians/${guardianId}`, {
        method: "GET",
      }),
    ),
  getStudentDocuments: (studentId) =>
    unwrap<StudentDocument[]>(
      apiWithToken(`${basePath}/${studentId}/documents`, {
        method: "GET",
      }),
    ),
  getMissingDocuments: (studentId) =>
    unwrap<StudentDocument[]>(
      apiWithToken(`${basePath}/${studentId}/documents/missing`, {
        method: "GET",
      }),
    ),
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
  fetchStudentsWithEnrollment: () =>
    unwrap<StudentWithEnrollmentContext[]>(
      apiWithToken(`${basePath}/with-enrollment`, {
        method: "GET",
      }),
    ),
  fetchStudentsWithEnrollmentForContext: (academicYearId, termId) =>
    unwrap<StudentWithEnrollmentContext[]>(
      apiWithToken(
        `${basePath}/with-enrollment${buildQuery({
          ...(academicYearId ? { academicYearId } : {}),
          ...(termId ? { termId } : {}),
        })}`,
        {
          method: "GET",
        },
      ),
    ),
});

export const studentsApiAdapter = createStudentsApiAdapter();
