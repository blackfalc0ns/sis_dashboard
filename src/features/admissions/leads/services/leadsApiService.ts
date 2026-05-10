// Leads API Service
// Production API integration for /admissions/leads

import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { Lead, CreateLeadPayload, UpdateLeadPayload } from "@/features/admissions/leads/types/lead";

// ---- Response unwrapping ----

function unwrapArray(response: unknown): Lead[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Lead[];
    if (Array.isArray(obj.items)) return obj.items as Lead[];
    if (Array.isArray(obj.leads)) return obj.leads as Lead[];
  }
  return [];
}

function unwrapSingle(response: unknown): Lead {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") return obj.data as Lead;
  }
  return response as Lead;
}

// ---- Helper to build query string ----

function toQueryString(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") {
      query.set(key, value);
    }
  });
  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

// ---- Normalize lead from API ----
// Ensures `name` field exists for backward compat
function normalizeLead(lead: Lead): Lead {
  return {
    ...lead,
    name: lead.name || lead.studentName || lead.primaryContactName || "",
  };
}

// ---- Public API ----

export interface FetchLeadsParams {
  status?: string;
  channel?: string;
}

export async function fetchLeads(params: FetchLeadsParams = {}): Promise<Lead[]> {
  const query = toQueryString({
    status: params.status,
    channel: params.channel,
  });
  const response = await apiGet<unknown>(`/admissions/leads${query}`);
  return unwrapArray(response).map(normalizeLead);
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const response = await apiGet<unknown>(`/admissions/leads/${id}`);
  return normalizeLead(unwrapSingle(response));
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const response = await apiPost<unknown>("/admissions/leads", payload);
  return normalizeLead(unwrapSingle(response));
}

export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
  const response = await apiPatch<unknown>(`/admissions/leads/${id}`, payload);
  return normalizeLead(unwrapSingle(response));
}

// Convenience: convert lead = set status to Converted
export async function convertLead(id: string): Promise<Lead> {
  return updateLead(id, { status: "Converted" });
}
