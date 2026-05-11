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
  studentName?: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
  interviewerUserId?: string;
  interviewerName?: string;
  notes?: string;
}

export interface CompleteInterviewPayload {
  status?: string;
  notes?: string;
}

export type UpdateInterviewPayload =
  Partial<CreateInterviewPayload & CompleteInterviewPayload>;

const toCreateBody = (payload: CreateInterviewPayload) => {
  if (!payload.interviewerUserId) {
    throw new Error("interviewerUserId is required to schedule an interview.");
  }

  return {
    applicationId: payload.applicationId,
    studentName: payload.studentName,
    scheduledAt:
      payload.scheduledAt ||
      toIsoFromDateAndTime(payload.date || "", payload.time || ""),
    interviewerUserId: payload.interviewerUserId,
    interviewerName: payload.interviewerName,
    notes: payload.notes,
  };
};

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
