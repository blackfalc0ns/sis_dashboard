import { apiClient, apiGet, apiPatch } from "@/lib/api";
import type { StudentDocument } from "@/features/students-guardians/students/types";
import {
  normalizeStudentDocument,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const STUDENTS_BASE_PATH = "/students-guardians/students";
const DOCUMENTS_BASE_PATH = "/students-guardians/documents";

export async function createStudentDocument(
  studentId: string,
  payloadWithFile: FormData,
): Promise<StudentDocument> {
  const response = await apiClient.post<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/documents`,
    payloadWithFile,
  );
  return normalizeStudentDocument(
    unwrapItemResponse(response.data, "Created student document"),
  );
}

export async function fetchStudentDocuments(
  studentId: string,
): Promise<StudentDocument[]> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/documents`,
  );
  return unwrapArrayResponse(response, "Student documents").map(
    normalizeStudentDocument,
  );
}

export async function fetchMissingStudentDocuments(
  studentId: string,
): Promise<StudentDocument[]> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/documents/missing`,
  );
  return unwrapArrayResponse(response, "Missing student documents").map(
    normalizeStudentDocument,
  );
}

export async function updateStudentDocument(
  studentDocumentId: string,
  payload: Partial<StudentDocument> & { notes?: string },
): Promise<StudentDocument> {
  const response = await apiPatch<unknown>(
    `${DOCUMENTS_BASE_PATH}/${studentDocumentId}`,
    payload,
  );
  return normalizeStudentDocument(
    unwrapItemResponse(response, "Updated student document"),
  );
}
