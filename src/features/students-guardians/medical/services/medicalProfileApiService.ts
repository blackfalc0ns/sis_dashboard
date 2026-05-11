import { apiGet, apiPatch } from "@/lib/api";
import { isApiError } from "@/lib/api-error";
import type { StudentMedicalProfile } from "@/features/students-guardians/students/types";
import {
  normalizeMedicalProfile,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const STUDENTS_BASE_PATH = "/students-guardians/students";

export async function fetchMedicalProfile(
  studentId: string,
): Promise<StudentMedicalProfile | null> {
  try {
    const response = await apiGet<unknown>(
      `${STUDENTS_BASE_PATH}/${studentId}/medical-profile`,
    );
    return normalizeMedicalProfile(
      unwrapItemResponse(response, "Medical profile"),
    );
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertMedicalProfile(
  studentId: string,
  payload: Partial<StudentMedicalProfile>,
): Promise<StudentMedicalProfile> {
  const response = await apiPatch<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/medical-profile`,
    payload,
  );
  return normalizeMedicalProfile(
    unwrapItemResponse(response, "Updated medical profile"),
  );
}
