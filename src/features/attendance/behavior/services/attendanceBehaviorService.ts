import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { buildQueryString } from "@/features/students-guardians/services/studentsGuardiansApiUtils";
import type {
  AttendanceBehaviorFilters,
  AttendanceBehaviorResponse,
  BehaviorCategory,
  BehaviorCategoryCreatePayload,
  BehaviorCategoryListFilters,
  BehaviorCategoryListResponse,
  BehaviorCategoryUpdatePayload,
  BehaviorOverviewFilters,
  BehaviorOverviewResponse,
  BehaviorRecord,
  BehaviorRecordApprovePayload,
  BehaviorRecordCreatePayload,
  BehaviorRecordListFilters,
  BehaviorRecordListResponse,
  BehaviorRecordUpdatePayload,
  BehaviorReviewQueueFilters,
  BehaviorReviewQueueItem,
  BehaviorReviewQueueResponse,
  BehaviorSummaryFilters,
  BehaviorSummaryResponse,
} from "../types";

const BEHAVIOR_BASE = "/behavior";

export async function fetchAttendanceBehavior(
  params: AttendanceBehaviorFilters,
): Promise<AttendanceBehaviorResponse> {
  void params;

  return {
    rows: [],
    total: 0,
  };
}

export async function createBehaviorCategory(
  payload: BehaviorCategoryCreatePayload,
): Promise<BehaviorCategory> {
  return apiPost<BehaviorCategory>(`${BEHAVIOR_BASE}/categories`, payload);
}

export async function listBehaviorCategories(
  filters?: BehaviorCategoryListFilters,
): Promise<BehaviorCategoryListResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorCategoryListResponse>(`${BEHAVIOR_BASE}/categories${query}`);
}

export async function getBehaviorCategory(id: string): Promise<BehaviorCategory> {
  return apiGet<BehaviorCategory>(`${BEHAVIOR_BASE}/categories/${id}`);
}

export async function updateBehaviorCategory(
  id: string,
  payload: BehaviorCategoryUpdatePayload,
): Promise<BehaviorCategory> {
  return apiPatch<BehaviorCategory>(`${BEHAVIOR_BASE}/categories/${id}`, payload);
}

export async function createBehaviorRecord(
  payload: BehaviorRecordCreatePayload,
): Promise<BehaviorRecord> {
  return apiPost<BehaviorRecord>(`${BEHAVIOR_BASE}/records`, payload);
}

export async function getBehaviorRecord(id: string): Promise<BehaviorRecord> {
  return apiGet<BehaviorRecord>(`${BEHAVIOR_BASE}/records/${id}`);
}

export async function updateBehaviorRecord(
  id: string,
  payload: BehaviorRecordUpdatePayload,
): Promise<BehaviorRecord> {
  return apiPatch<BehaviorRecord>(`${BEHAVIOR_BASE}/records/${id}`, payload);
}

export async function submitBehaviorRecord(id: string): Promise<BehaviorRecord> {
  return apiPost<BehaviorRecord>(`${BEHAVIOR_BASE}/records/${id}/submit`, {});
}

export async function approveBehaviorRecord(
  id: string,
  payload: BehaviorRecordApprovePayload,
): Promise<BehaviorRecord> {
  return apiPost<BehaviorRecord>(`${BEHAVIOR_BASE}/records/${id}/approve`, payload);
}

export async function listBehaviorRecords(
  filters?: BehaviorRecordListFilters,
): Promise<BehaviorRecordListResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorRecordListResponse>(`${BEHAVIOR_BASE}/records${query}`);
}

export async function listBehaviorReviewQueue(
  filters?: BehaviorReviewQueueFilters,
): Promise<BehaviorReviewQueueResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorReviewQueueResponse>(`${BEHAVIOR_BASE}/review-queue${query}`);
}

export async function getBehaviorReviewQueueItem(
  id: string,
): Promise<BehaviorReviewQueueItem> {
  return apiGet<BehaviorReviewQueueItem>(`${BEHAVIOR_BASE}/review-queue/${id}`);
}

export async function getBehaviorOverview(
  filters?: BehaviorOverviewFilters,
): Promise<BehaviorOverviewResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorOverviewResponse>(`${BEHAVIOR_BASE}/overview${query}`);
}

export async function getStudentBehaviorSummary(
  studentId: string,
  filters?: BehaviorSummaryFilters,
): Promise<BehaviorSummaryResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorSummaryResponse>(
    `${BEHAVIOR_BASE}/students/${studentId}/summary${query}`,
  );
}

export async function getClassroomBehaviorSummary(
  classroomId: string,
  filters?: BehaviorSummaryFilters,
): Promise<BehaviorSummaryResponse> {
  const query = buildQueryString(filters);
  return apiGet<BehaviorSummaryResponse>(
    `${BEHAVIOR_BASE}/classrooms/${classroomId}/summary${query}`,
  );
}
