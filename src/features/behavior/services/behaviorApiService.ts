// FILE: src/features/behavior/services/behaviorApiService.ts

import { apiGet, apiPost } from "@/lib/api";
import { buildQueryString } from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const BEHAVIOR_BASE = "/behavior";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BehaviorCategory {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  type: "positive" | "negative";
  defaultSeverity: "low" | "medium" | "high";
  defaultPoints: number;
  isActive: boolean;
  sortOrder: number;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  categoryId: string;
  categoryName?: string;
  type?: "positive" | "negative";
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  points?: number;
  severity?: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "cancelled";
  occurredAt: string;
  createdByName?: string;
  actorEmail?: string;
}

export interface BehaviorSummary {
  totalPoints?: number;
  weeklyDelta?: number;
  recentPoints?: number;
  totalIncidents?: number;
  openIncidents?: number;
  timeline?: BehaviorRecord[];
  ledger?: BehaviorRecord[];
  categoryBreakdown?: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    points: number;
  }>;
  [key: string]: unknown;
}

export interface FetchBehaviorSummaryParams {
  academicYearId?: string;
  termId?: string;
  includeTimeline?: boolean;
  includeCategoryBreakdown?: boolean;
  includeLedger?: boolean;
}

export interface FetchBehaviorCategoriesParams {
  type?: "positive" | "negative";
  isActive?: boolean;
  search?: string;
}

export interface FetchBehaviorRecordsParams {
  academicYearId?: string;
  termId?: string;
  studentId?: string;
  status?: string;
}

export interface CreateBehaviorRecordPayload {
  academicYearId?: string;
  termId?: string;
  studentId: string;
  enrollmentId?: string;
  categoryId: string;
  titleEn: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  occurredAt: string;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchStudentBehaviorSummary(
  studentId: string,
  params?: FetchBehaviorSummaryParams,
): Promise<BehaviorSummary> {
  const query = buildQueryString({
    ...params,
    includeTimeline: params?.includeTimeline !== false ? "true" : "false",
    includeCategoryBreakdown:
      params?.includeCategoryBreakdown !== false ? "true" : "false",
    includeLedger: params?.includeLedger !== false ? "true" : "false",
  });
  const response = await apiGet<unknown>(
    `${BEHAVIOR_BASE}/students/${studentId}/summary${query}`,
  );
  // Unwrap common envelope shapes: { data: ... } or { summary: ... }
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") return obj.data as BehaviorSummary;
    if (obj.summary && typeof obj.summary === "object") return obj.summary as BehaviorSummary;
  }
  return (response as BehaviorSummary) ?? {};
}

export async function fetchBehaviorCategories(
  params?: FetchBehaviorCategoriesParams,
): Promise<BehaviorCategory[]> {
  const query = buildQueryString(params);
  const response = await apiGet<unknown>(
    `${BEHAVIOR_BASE}/categories${query}`,
  );
  if (Array.isArray(response)) return response as BehaviorCategory[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as BehaviorCategory[];
    if (Array.isArray(obj.categories)) return obj.categories as BehaviorCategory[];
  }
  return [];
}

export async function createBehaviorRecord(
  payload: CreateBehaviorRecordPayload,
): Promise<BehaviorRecord> {
  const response = await apiPost<unknown>(`${BEHAVIOR_BASE}/records`, payload);
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data) return obj.data as BehaviorRecord;
    if (obj.record) return obj.record as BehaviorRecord;
  }
  return response as BehaviorRecord;
}

export async function submitBehaviorRecord(
  recordId: string,
): Promise<unknown> {
  return apiPost<unknown>(`${BEHAVIOR_BASE}/records/${recordId}/submit`, {});
}

export async function fetchBehaviorRecords(
  params?: FetchBehaviorRecordsParams,
): Promise<BehaviorRecord[]> {
  const query = buildQueryString(params);
  const response = await apiGet<unknown>(`${BEHAVIOR_BASE}/records${query}`);
  if (Array.isArray(response)) return response as BehaviorRecord[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as BehaviorRecord[];
    if (Array.isArray(obj.records)) return obj.records as BehaviorRecord[];
  }
  return [];
}
