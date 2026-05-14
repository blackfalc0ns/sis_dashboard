import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CreateXpPolicyPayload,
  GetEffectiveXpPolicyParams,
  GetXpSummaryParams,
  ListXpLedgerParams,
  ListXpLedgerResponse,
  ListXpPoliciesParams,
  ListXpPoliciesResponse,
  ManualXpGrantPayload,
  ManualXpGrantResponse,
  PatchXpPolicyPayload,
  XpLedgerEntry,
  XpPolicy,
  XpSummary,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const XP_POLICIES_ENDPOINT = "/reinforcement/xp/policies";
const MANUAL_GRANTS_ENDPOINT = "/reinforcement/xp/grants/manual";
const XP_LEDGER_ENDPOINT = "/reinforcement/xp/ledger";
const XP_SUMMARY_ENDPOINT = "/reinforcement/xp/summary";

export async function listXpPolicies(
  params?: ListXpPoliciesParams,
): Promise<ListXpPoliciesResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${XP_POLICIES_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<XpPolicy>(response);
}

export async function getEffectiveXpPolicy(
  params?: GetEffectiveXpPolicyParams,
): Promise<XpPolicy> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(
    `${XP_POLICIES_ENDPOINT}/effective${query}`,
  );
  return unwrapReinforcementItemResponse<XpPolicy>(response);
}

export async function createXpPolicy(
  payload: CreateXpPolicyPayload,
): Promise<XpPolicy> {
  const response = await apiPost<unknown>(XP_POLICIES_ENDPOINT, payload);
  return unwrapReinforcementItemResponse<XpPolicy>(response);
}

export async function patchXpPolicy(
  policyId: string,
  payload: PatchXpPolicyPayload,
): Promise<XpPolicy> {
  const response = await apiPatch<unknown>(
    `${XP_POLICIES_ENDPOINT}/${policyId}`,
    payload,
  );
  return unwrapReinforcementItemResponse<XpPolicy>(response);
}

export async function grantManualXp(
  payload: ManualXpGrantPayload,
): Promise<ManualXpGrantResponse> {
  const response = await apiPost<unknown>(MANUAL_GRANTS_ENDPOINT, payload);
  return unwrapReinforcementItemResponse<ManualXpGrantResponse>(response);
}

export async function listXpLedger(
  params?: ListXpLedgerParams,
): Promise<ListXpLedgerResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${XP_LEDGER_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<XpLedgerEntry>(response);
}

export async function getXpSummary(
  params?: GetXpSummaryParams,
): Promise<XpSummary> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${XP_SUMMARY_ENDPOINT}${query}`);
  return unwrapReinforcementItemResponse<XpSummary>(response);
}
