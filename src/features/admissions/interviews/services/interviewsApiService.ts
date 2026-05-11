import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Interview } from "@/features/admissions/types/admissions";
import {
  buildQueryString,
  normalizeInterview,
  toIsoFromDateAndTime,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/admissions/shared/services/admissionsApiUtils";

const INTERVIEWS_ENDPOINT = "/admissions/interviews";

export interface FetchInterviewsParams {
  search?: string;
  applicationId?: string;
}

export interface CreateInterviewPayload {
  applicationId: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
  interviewerUserId?: string;
  notes?: string;
}

export interface CompleteInterviewPayload {
  status?: string;
  notes?: string;
}

export type UpdateInterviewPayload =
  Partial<CreateInterviewPayload & CompleteInterviewPayload>;

const toCreateBody = (payload: CreateInterviewPayload) => ({
  applicationId: payload.applicationId,
  scheduledAt:
    payload.scheduledAt || toIsoFromDateAndTime(payload.date || "", payload.time || ""),
  // TODO: replace fallback once the auth user id is exposed consistently to admissions screens.
  interviewerUserId: payload.interviewerUserId || "current-user",
  notes: payload.notes,
});

export async function fetchInterviews(
  params: FetchInterviewsParams = {},
): Promise<Interview[]> {
  const response = await apiGet<unknown>(
    `${INTERVIEWS_ENDPOINT}${buildQueryString(params)}`,
  );
  return unwrapArrayResponse(response, "interviews").map(normalizeInterview);
}

export async function fetchInterviewById(id: string): Promise<Interview> {
  const response = await apiGet<unknown>(`${INTERVIEWS_ENDPOINT}/${id}`);
  return normalizeInterview(unwrapItemResponse(response, "interview"));
}

export async function createInterview(
  payload: CreateInterviewPayload,
): Promise<Interview> {
  const response = await apiPost<unknown>(INTERVIEWS_ENDPOINT, toCreateBody(payload));
  return normalizeInterview(unwrapItemResponse(response, "created interview"));
}

export async function updateInterview(
  id: string,
  payload: UpdateInterviewPayload,
): Promise<Interview> {
  const body = {
    ...payload,
    scheduledAt:
      payload.scheduledAt ||
      (payload.date || payload.time
        ? toIsoFromDateAndTime(payload.date || "", payload.time || "")
        : undefined),
    date: undefined,
    time: undefined,
  };
  const response = await apiPatch<unknown>(`${INTERVIEWS_ENDPOINT}/${id}`, body);
  return normalizeInterview(unwrapItemResponse(response, "updated interview"));
}

export async function completeInterview(
  id: string,
  payload: CompleteInterviewPayload,
): Promise<Interview> {
  const response = await apiPatch<unknown>(`${INTERVIEWS_ENDPOINT}/${id}`, {
    status: payload.status || "completed",
    notes: payload.notes,
  });
  return normalizeInterview(unwrapItemResponse(response, "completed interview"));
}
