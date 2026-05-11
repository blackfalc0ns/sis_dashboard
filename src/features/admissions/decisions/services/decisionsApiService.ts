import { apiGet, apiPost } from "@/lib/api";
import type { Decision, DecisionType } from "@/features/admissions/types/admissions";
import {
  buildQueryString,
  normalizeDecision,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/admissions/shared/services/admissionsApiUtils";

const DECISIONS_ENDPOINT = "/admissions/decisions";

export interface FetchDecisionsParams {
  search?: string;
  applicationId?: string;
}

export interface CreateDecisionPayload {
  applicationId: string;
  decision: DecisionType;
  reason: string;
}

export async function fetchDecisions(
  params: FetchDecisionsParams = {},
): Promise<Decision[]> {
  const response = await apiGet<unknown>(
    `${DECISIONS_ENDPOINT}${buildQueryString(params)}`,
  );
  return unwrapArrayResponse(response, "decisions").map(normalizeDecision);
}

export async function fetchDecisionById(id: string): Promise<Decision> {
  const response = await apiGet<unknown>(`${DECISIONS_ENDPOINT}/${id}`);
  return normalizeDecision(unwrapItemResponse(response, "decision"));
}

export async function createDecision(
  payload: CreateDecisionPayload,
): Promise<Decision> {
  const response = await apiPost<unknown>(DECISIONS_ENDPOINT, payload);
  return normalizeDecision(unwrapItemResponse(response, "created decision"));
}

export function getDecisionFriendlyErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: number }).status === 409
  ) {
    return "A decision already exists for this application.";
  }

  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: number }).status === 422
  ) {
    return "Complete the required test and interview before making a decision.";
  }

  return null;
}
