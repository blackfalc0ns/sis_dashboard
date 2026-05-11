import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Test } from "@/features/admissions/types/admissions";
import {
  buildQueryString,
  normalizeTest,
  toIsoFromDateAndTime,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/admissions/shared/services/admissionsApiUtils";

const TESTS_ENDPOINT = "/admissions/tests";

export interface FetchPlacementTestsParams {
  search?: string;
  applicationId?: string;
}

export interface CreatePlacementTestPayload {
  applicationId: string;
  type?: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
}

export interface CompletePlacementTestPayload {
  status?: string;
  score?: number;
  result?: string;
  notes?: string;
}

export type UpdatePlacementTestPayload =
  Partial<CreatePlacementTestPayload & CompletePlacementTestPayload>;

const toCreateBody = (payload: CreatePlacementTestPayload) => ({
  applicationId: payload.applicationId,
  type: payload.type || "Placement",
  scheduledAt:
    payload.scheduledAt || toIsoFromDateAndTime(payload.date || "", payload.time || ""),
});

export async function fetchPlacementTests(
  params: FetchPlacementTestsParams = {},
): Promise<Test[]> {
  const response = await apiGet<unknown>(
    `${TESTS_ENDPOINT}${buildQueryString(params)}`,
  );
  return unwrapArrayResponse(response, "placement tests").map(normalizeTest);
}

export async function fetchPlacementTestById(id: string): Promise<Test> {
  const response = await apiGet<unknown>(`${TESTS_ENDPOINT}/${id}`);
  return normalizeTest(unwrapItemResponse(response, "placement test"));
}

export async function createPlacementTest(
  payload: CreatePlacementTestPayload,
): Promise<Test> {
  const response = await apiPost<unknown>(TESTS_ENDPOINT, toCreateBody(payload));
  return normalizeTest(unwrapItemResponse(response, "created placement test"));
}

export async function updatePlacementTest(
  id: string,
  payload: UpdatePlacementTestPayload,
): Promise<Test> {
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
  const response = await apiPatch<unknown>(`${TESTS_ENDPOINT}/${id}`, body);
  return normalizeTest(unwrapItemResponse(response, "updated placement test"));
}

export async function completePlacementTest(
  id: string,
  payload: CompletePlacementTestPayload,
): Promise<Test> {
  const response = await apiPatch<unknown>(`${TESTS_ENDPOINT}/${id}`, {
    status: payload.status || "completed",
    score: payload.score,
    result: payload.result || payload.notes,
  });
  return normalizeTest(unwrapItemResponse(response, "completed placement test"));
}
