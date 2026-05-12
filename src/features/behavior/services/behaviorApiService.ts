// FILE: src/features/behavior/services/behaviorApiService.ts

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { buildQueryString } from "@/features/students-guardians/services/studentsGuardiansApiUtils";
import type {
  BehaviorApproveResponse,
  BehaviorCategory,
  BehaviorCategoryCreatePayload,
  BehaviorCategoryCreateResponse,
  BehaviorCategoryListFilters,
  BehaviorCategoryListResponse,
  BehaviorCategoryUpdatePayload,
  BehaviorCategoryUpdateResponse,
  BehaviorClassroomSummaryFilters,
  BehaviorClassroomSummaryResponse,
  BehaviorOverviewFilters,
  BehaviorOverviewResponse,
  BehaviorRecord,
  BehaviorRecordApprovePayload,
  BehaviorRecordCreatePayload,
  BehaviorRecordCreateResponse,
  BehaviorRecordListFilters,
  BehaviorRecordListResponse,
  BehaviorRecordRejectPayload,
  BehaviorRecordUpdatePayload,
  BehaviorRejectResponse,
  BehaviorReviewQueueFilters,
  BehaviorReviewQueueItem,
  BehaviorReviewQueueResponse,
  BehaviorStudentSummaryFilters,
  BehaviorStudentSummaryResponse,
  BehaviorSubmitResponse,
} from "../types";

const BASE = "/behavior";

// ─── Re-export legacy types for backward compatibility ─────────────────────
// (Used by student profile BehaviorTab)
export type { BehaviorCategory, BehaviorRecord } from "../types";

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

// ─── Student Profile APIs (legacy, used by BehaviorTab) ────────────────────

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
    `${BASE}/students/${studentId}/summary${query}`,
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
    `${BASE}/categories${query}`,
  );
  if (Array.isArray(response)) return response as BehaviorCategory[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as BehaviorCategory[];
    if (Array.isArray(obj.categories)) return obj.categories as BehaviorCategory[];
  }
  return [];
}

export async function fetchBehaviorRecords(
  params?: FetchBehaviorRecordsParams,
): Promise<BehaviorRecord[]> {
  const query = buildQueryString(params);
  const response = await apiGet<unknown>(`${BASE}/records${query}`);
  if (Array.isArray(response)) return response as BehaviorRecord[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as BehaviorRecord[];
    if (Array.isArray(obj.records)) return obj.records as BehaviorRecord[];
  }
  return [];
}

// ─── Categories CRUD ───────────────────────────────────────────────────────

/** POST /behavior/categories */
export async function createBehaviorCategory(
  payload: BehaviorCategoryCreatePayload,
): Promise<BehaviorCategoryCreateResponse> {
  return apiPost<BehaviorCategoryCreateResponse>(`${BASE}/categories`, payload);
}

/** GET /behavior/categories (typed list) */
export async function listBehaviorCategories(
  filters?: BehaviorCategoryListFilters,
): Promise<BehaviorCategoryListResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorCategoryListResponse>(`${BASE}/categories${query}`);
}

/** GET /behavior/categories/:id */
export async function getBehaviorCategory(id: string): Promise<BehaviorCategory> {
  return apiGet<BehaviorCategory>(`${BASE}/categories/${id}`);
}

/** PATCH /behavior/categories/:id */
export async function updateBehaviorCategory(
  id: string,
  payload: BehaviorCategoryUpdatePayload,
): Promise<BehaviorCategoryUpdateResponse> {
  return apiPatch<BehaviorCategoryUpdateResponse>(`${BASE}/categories/${id}`, payload);
}

// ─── Records CRUD ──────────────────────────────────────────────────────────

/** POST /behavior/records */
export async function createBehaviorRecord(
  payload: BehaviorRecordCreatePayload | CreateBehaviorRecordPayload,
): Promise<BehaviorRecordCreateResponse> {
  return apiPost<BehaviorRecordCreateResponse>(`${BASE}/records`, payload);
}

/** GET /behavior/records/:id */
export async function getBehaviorRecord(id: string): Promise<BehaviorRecord> {
  return apiGet<BehaviorRecord>(`${BASE}/records/${id}`);
}

/** PATCH /behavior/records/:id */
export async function updateBehaviorRecord(
  id: string,
  payload: BehaviorRecordUpdatePayload,
): Promise<BehaviorRecord> {
  return apiPatch<BehaviorRecord>(`${BASE}/records/${id}`, payload);
}

/** POST /behavior/records/:id/submit */
export async function submitBehaviorRecord(id: string): Promise<BehaviorSubmitResponse> {
  return apiPost<BehaviorSubmitResponse>(`${BASE}/records/${id}/submit`, {});
}

/** POST /behavior/records/:id/approve */
export async function approveBehaviorRecord(
  id: string,
  payload: BehaviorRecordApprovePayload,
): Promise<BehaviorApproveResponse> {
  return apiPost<BehaviorApproveResponse>(`${BASE}/records/${id}/approve`, payload);
}

/** POST /behavior/records/:id/reject */
export async function rejectBehaviorRecord(
  id: string,
  payload: BehaviorRecordRejectPayload,
): Promise<BehaviorRejectResponse> {
  return apiPost<BehaviorRejectResponse>(`${BASE}/records/${id}/reject`, payload);
}

/** GET /behavior/records (typed list) */
export async function listBehaviorRecords(
  filters?: BehaviorRecordListFilters,
): Promise<BehaviorRecordListResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorRecordListResponse>(`${BASE}/records${query}`);
}

// ─── Review Queue ──────────────────────────────────────────────────────────

/** GET /behavior/review-queue */
export async function listBehaviorReviewQueue(
  filters?: BehaviorReviewQueueFilters,
): Promise<BehaviorReviewQueueResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorReviewQueueResponse>(`${BASE}/review-queue${query}`);
}

/** GET /behavior/review-queue/:id */
export async function getBehaviorReviewQueueItem(
  id: string,
): Promise<BehaviorReviewQueueItem> {
  return apiGet<BehaviorReviewQueueItem>(`${BASE}/review-queue/${id}`);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

/** GET /behavior/overview */
export async function getBehaviorOverview(
  filters?: BehaviorOverviewFilters,
): Promise<BehaviorOverviewResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorOverviewResponse>(`${BASE}/overview${query}`);
}

/** GET /behavior/students/:studentId/summary (typed) */
export async function getStudentBehaviorSummary(
  studentId: string,
  filters?: BehaviorStudentSummaryFilters,
): Promise<BehaviorStudentSummaryResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorStudentSummaryResponse>(
    `${BASE}/students/${studentId}/summary${query}`,
  );
}

/** GET /behavior/classrooms/:classroomId/summary */
export async function getClassroomBehaviorSummary(
  classroomId: string,
  filters?: BehaviorClassroomSummaryFilters,
): Promise<BehaviorClassroomSummaryResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorClassroomSummaryResponse>(
    `${BASE}/classrooms/${classroomId}/summary${query}`,
  );
}
