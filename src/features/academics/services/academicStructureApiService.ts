import { apiGet } from "@/lib/api";
import {
  buildQueryString,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const ACADEMIC_STRUCTURE_BASE_PATH = "/academics/structure";

export async function fetchAcademicYears(): Promise<unknown[]> {
  const response = await apiGet<unknown>(`${ACADEMIC_STRUCTURE_BASE_PATH}/years`);
  return unwrapArrayResponse(response, "Academic years");
}

export async function fetchTerms(academicYearId: string): Promise<unknown[]> {
  const response = await apiGet<unknown>(
    `${ACADEMIC_STRUCTURE_BASE_PATH}/terms${buildQueryString({ academicYearId })}`,
  );
  return unwrapArrayResponse(response, "Academic terms");
}

export async function fetchStructureTree(
  yearId: string,
  termId: string,
): Promise<unknown> {
  const response = await apiGet<unknown>(
    `${ACADEMIC_STRUCTURE_BASE_PATH}/tree${buildQueryString({ yearId, termId })}`,
  );
  return unwrapItemResponse(response, "Academic structure tree");
}
