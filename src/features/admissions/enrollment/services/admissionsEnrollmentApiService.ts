import { apiPost } from "@/lib/api";
import { unwrapItemResponse } from "@/features/admissions/shared/services/admissionsApiUtils";

export interface EnrollmentHandoffPreview {
  applicationId: string;
  eligible: boolean;
  handoff: {
    studentDraft: { fullName: string };
    guardianDrafts: { fullName: string | null; phone: string | null; email: string | null }[];
    enrollmentDraft: {
      requestedAcademicYearId: string | null;
      requestedAcademicYearName: string | null;
      requestedGradeId: string | null;
      requestedGradeName: string | null;
    };
  };
}

export interface FullEnrollmentPayload {
  applicationId: string;
  studentName: string;
  classroomId: string;
  enrollmentDate: string;
  academicYearId?: string;
  gradeId?: string;
  sectionId?: string;
  guardians?: { fullName: string | null; phone: string | null; email: string | null }[];
}

interface CreatedStudent {
  id: string;
  [key: string]: unknown;
}

interface CreatedGuardian {
  guardianId: string;
  [key: string]: unknown;
}

export async function createEnrollmentHandoffPreview(
  applicationId: string,
): Promise<EnrollmentHandoffPreview> {
  const response = await apiPost<unknown>(
    `/admissions/applications/${applicationId}/enroll`,
  );
  return unwrapItemResponse(
    response,
    "enrollment handoff preview",
  ) as EnrollmentHandoffPreview;
}

/**
 * Full enrollment flow:
 * 1. Create student
 * 2. Create/link guardians
 * 3. Create enrollment
 */
export async function executeFullEnrollment(
  payload: FullEnrollmentPayload,
): Promise<{ studentId: string; enrollmentId: string }> {
  // Step 1: Create student
  const studentResponse = await apiPost<unknown>("/students-guardians/students", {
    full_name_en: payload.studentName,
    name: payload.studentName,
  });
  const student = unwrapItemResponse(studentResponse, "created student") as CreatedStudent;
  const studentId = student.id;

  // Step 2: Create guardians and link them
  if (payload.guardians && payload.guardians.length > 0) {
    for (const guardian of payload.guardians) {
      if (!guardian.fullName) continue;
      try {
        const guardianResponse = await apiPost<unknown>(
          `/students-guardians/students/${studentId}/guardians`,
          {
            full_name: guardian.fullName,
            phone_primary: guardian.phone || undefined,
            email: guardian.email || undefined,
            relation: "guardian",
            is_primary: true,
          },
        );
        void guardianResponse;
      } catch (guardianError) {
        console.error("Failed to create guardian:", guardianError);
        // Continue — don't block enrollment if guardian creation fails
      }
    }
  }

  // Step 3: Create enrollment
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const classroomId = payload.classroomId;
  const gradeId = payload.gradeId && uuidRegex.test(payload.gradeId) ? payload.gradeId : undefined;
  const sectionId = payload.sectionId && uuidRegex.test(payload.sectionId) ? payload.sectionId : undefined;

  if (!classroomId || !uuidRegex.test(classroomId)) {
    throw new Error("A valid classroom must be selected to enroll.");
  }

  const enrollmentBody: Record<string, unknown> = {
    studentId,
    classroomId,
    enrollmentDate: payload.enrollmentDate,
  };
  if (payload.applicationId) enrollmentBody.applicationId = payload.applicationId;
  if (gradeId) enrollmentBody.gradeId = gradeId;
  if (sectionId) enrollmentBody.sectionId = sectionId;

  const enrollmentResponse = await apiPost<unknown>("/students-guardians/enrollments", enrollmentBody);
  const enrollment = unwrapItemResponse(enrollmentResponse, "created enrollment") as { enrollmentId: string };

  return {
    studentId,
    enrollmentId: enrollment.enrollmentId || (enrollment as unknown as { id: string }).id,
  };
}

export function getEnrollmentFriendlyErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    ([400, 422] as Array<number | undefined>).includes(
      (error as { status?: number }).status,
    )
  ) {
    return "This application is not eligible for enrollment yet.";
  }

  return null;
}
