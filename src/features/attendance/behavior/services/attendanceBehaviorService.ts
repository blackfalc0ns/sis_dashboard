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

// ─── Categories ────────────────────────────────────────────────────────────

/** POST /behavior/categories */
export async function createBehaviorCategory(
  payload: BehaviorCategoryCreatePayload,
): Promise<BehaviorCategoryCreateResponse> {
  return apiPost<BehaviorCategoryCreateResponse>(`${BASE}/categories`, payload);
}

/** GET /behavior/categories */
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

// ─── Records ───────────────────────────────────────────────────────────────

/** POST /behavior/records */
export async function createBehaviorRecord(
  payload: BehaviorRecordCreatePayload,
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

/** GET /behavior/records */
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
  const query = buildQueryString({
    ...filters,
    includeRecentActivity: filters?.includeRecentActivity ?? true,
    includeTopCategories: filters?.includeTopCategories ?? true,
  });
  return apiGet<BehaviorOverviewResponse>(`${BASE}/overview${query}`);
}

/** GET /behavior/students/:studentId/summary */
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
