import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Application } from "@/features/admissions/types/admissions";
import type { ApplicationCreationPayload } from "@/features/admissions/applications/services/applicationCreationService";
import {
  buildQueryString,
  normalizeApplication,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/admissions/shared/services/admissionsApiUtils";

const APPLICATIONS_ENDPOINT = "/admissions/applications";

type ApiRecord = Record<string, unknown>;

export interface FetchApplicationsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type CreateApplicationPayload =
  | (ApplicationCreationPayload & { requestedAcademicYearId?: string })
  | {
      leadId?: string;
      studentName: string;
      requestedAcademicYearId?: string;
      requestedGradeId?: string;
      source?: string;
    };

export type UpdateApplicationPayload = Partial<{
  studentName: string;
  source: string;
  status: string;
  notes: string;
}>;

const isCreationStepperPayload = (
  payload: CreateApplicationPayload,
): payload is ApplicationCreationPayload =>
  Boolean((payload as ApplicationCreationPayload).student);

function toCreateApplicationBody(payload: CreateApplicationPayload): ApiRecord {
  if (!isCreationStepperPayload(payload)) {
    return {
      leadId: payload.leadId,
      studentName: payload.studentName,
      requestedAcademicYearId: payload.requestedAcademicYearId,
      requestedGradeId: payload.requestedGradeId,
      source: payload.source || "referral",
    };
  }

  return {
    leadId: undefined,
    studentName: payload.student.full_name_en || payload.student.full_name_ar,
    requestedAcademicYearId: payload.requestedAcademicYearId,
    requestedGradeId: payload.student.grade_requested,
    source: "referral",
  };
}

export async function fetchApplications(
  params: FetchApplicationsParams = {},
): Promise<Application[]> {
  const response = await apiGet<unknown>(
    `${APPLICATIONS_ENDPOINT}${buildQueryString(params)}`,
  );
  return unwrapArrayResponse(response, "applications").map(normalizeApplication);
}

export async function fetchApplicationById(id: string): Promise<Application> {
  const response = await apiGet<unknown>(`${APPLICATIONS_ENDPOINT}/${id}`);
  return normalizeApplication(unwrapItemResponse(response, "application"));
}

export async function createApplication(
  payload: CreateApplicationPayload,
): Promise<Application> {
  const response = await apiPost<unknown>(
    APPLICATIONS_ENDPOINT,
    toCreateApplicationBody(payload),
  );
  return normalizeApplication(unwrapItemResponse(response, "created application"));
}

export async function updateApplication(
  id: string,
  payload: UpdateApplicationPayload,
): Promise<Application> {
  const response = await apiPatch<unknown>(`${APPLICATIONS_ENDPOINT}/${id}`, payload);
  return normalizeApplication(unwrapItemResponse(response, "updated application"));
}

export async function submitApplication(id: string): Promise<Application> {
  const response = await apiPost<unknown>(`${APPLICATIONS_ENDPOINT}/${id}/submit`);
  return normalizeApplication(unwrapItemResponse(response, "submitted application"));
}
