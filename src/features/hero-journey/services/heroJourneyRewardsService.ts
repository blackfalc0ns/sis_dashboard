import { apiGet, apiPost } from "@/lib/api";
import { buildReinforcementQueryString, unwrapReinforcementItemResponse, type ReinforcementQueryParams } from "@/features/reinforcement/services/reinforcementApiUtils";

const HERO_ENDPOINT = "/reinforcement/hero";
type Payload = Record<string, unknown>;

export async function getStudentHeroJourneyRewards(studentId: string, query?: ReinforcementQueryParams) {
  return unwrapReinforcementItemResponse<Record<string, unknown>>(
    await apiGet<unknown>(`${HERO_ENDPOINT}/students/${studentId}/rewards${buildReinforcementQueryString(query)}`),
  );
}

export async function grantHeroJourneyXp(progressId: string, payload: Payload) {
  return unwrapReinforcementItemResponse<Record<string, unknown>>(
    await apiPost<unknown>(`${HERO_ENDPOINT}/progress/${progressId}/grant-xp`, payload),
  );
}

export async function awardHeroJourneyBadge(progressId: string, payload: Payload) {
  return unwrapReinforcementItemResponse<Record<string, unknown>>(
    await apiPost<unknown>(`${HERO_ENDPOINT}/progress/${progressId}/award-badge`, payload),
  );
}
