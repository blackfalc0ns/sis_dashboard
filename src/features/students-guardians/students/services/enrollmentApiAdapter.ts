import { apiWithToken } from "@/lib/api";
import type { EnrollmentAdapter } from "@/features/students-guardians/students/services/enrollmentAdapter";
import type {
  BulkAssignStudentsPayload,
  BulkAssignStudentsResult,
  EnrollmentPlacementValidationResult,
  PromoteStudentEnrollmentPayload,
  TransferStudentPayload,
  WithdrawStudentPayload,
} from "@/features/students-guardians/students/services/enrollmentService";
import type {
  EnrollmentMovement,
  StudentEnrollment,
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

export const createEnrollmentApiAdapter = (
  basePath: string = "/students-guardians/enrollments",
): EnrollmentAdapter => ({
  validateEnrollmentPlacement: (payload, options) =>
    unwrap<EnrollmentPlacementValidationResult>(
      apiWithToken(`${basePath}/validation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload, options }),
      }),
    ),
  createEnrollment: (payload) =>
    unwrap<StudentEnrollment>(
      apiWithToken(basePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  updateEnrollment: (enrollmentId, payload) =>
    unwrap<StudentEnrollment>(
      apiWithToken(`${basePath}/${enrollmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  upsertEnrollment: (payload) =>
    unwrap<StudentEnrollment>(
      apiWithToken(`${basePath}/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  getCurrentActiveEnrollment: (studentId, academicYear) =>
    unwrap<StudentEnrollment | undefined>(
      apiWithToken(
        `${basePath}/current${buildQuery({
          studentId,
          ...(academicYear ? { academicYear } : {}),
        })}`,
        {
          method: "GET",
        },
      ),
    ),
  getEnrollmentHistory: (studentId) =>
    unwrap<StudentEnrollment[]>(
      apiWithToken(`${basePath}/history${buildQuery({ studentId })}`, {
        method: "GET",
      }),
    ),
  getPlacementHistory: (studentId) =>
    unwrap<EnrollmentMovement[]>(
      apiWithToken(`${basePath}/placements${buildQuery({ studentId })}`, {
        method: "GET",
      }),
    ),
  transferStudent: (payload: TransferStudentPayload) =>
    unwrap<StudentEnrollment>(
      apiWithToken(`${basePath}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  withdrawStudent: (payload: WithdrawStudentPayload) =>
    unwrap<StudentEnrollment>(
      apiWithToken(`${basePath}/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  promoteStudentEnrollment: (payload: PromoteStudentEnrollmentPayload) =>
    unwrap<StudentEnrollment>(
      apiWithToken(`${basePath}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  bulkAssignStudentsToClassrooms: (payload: BulkAssignStudentsPayload) =>
    unwrap<BulkAssignStudentsResult>(
      apiWithToken(`${basePath}/bulk-assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    ),
  promoteActiveStudentsToAcademicYear: (targetAcademicYear, effectiveDate) =>
    unwrap<StudentEnrollment[]>(
      apiWithToken(`${basePath}/promote-active`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetAcademicYear, effectiveDate }),
      }),
    ),
  getAcademicYearOptions: () =>
    unwrap<string[]>(
      apiWithToken(`${basePath}/academic-years`, {
        method: "GET",
      }),
    ),
});

export const enrollmentApiAdapter = createEnrollmentApiAdapter();
