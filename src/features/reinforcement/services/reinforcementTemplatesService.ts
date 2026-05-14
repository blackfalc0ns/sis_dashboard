import { apiGet, apiPost } from "@/lib/api";
import type {
  CreateReinforcementTemplatePayload,
  ListReinforcementTemplatesParams,
  ListReinforcementTemplatesResponse,
  ReinforcementTemplate,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const TEMPLATES_ENDPOINT = "/reinforcement/templates";

export async function listReinforcementTemplates(
  params?: ListReinforcementTemplatesParams,
): Promise<ListReinforcementTemplatesResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${TEMPLATES_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<ReinforcementTemplate>(response);
}

export async function createReinforcementTemplate(
  payload: CreateReinforcementTemplatePayload,
): Promise<ReinforcementTemplate> {
  const response = await apiPost<unknown>(TEMPLATES_ENDPOINT, payload);
  return unwrapReinforcementItemResponse<ReinforcementTemplate>(response);
}
