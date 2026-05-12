import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";

// ─── Primitive enums (lowercase, matching API values) ──────────────────────
export type BehaviorType = "positive" | "negative";
export type BehaviorStatus = "draft" | "submitted" | "approved" | "rejected";
export type BehaviorSeverity = "low" | "medium" | "high";

// ─── Legacy scope filters (kept for AttendanceScopeHeader) ─────────────────
export interface AttendanceBehaviorFilters {
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  type?: BehaviorType;
  status?: BehaviorStatus;
}

// ─── Category ──────────────────────────────────────────────────────────────
export interface BehaviorCategory {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: BehaviorType;
  defaultSeverity: BehaviorSeverity;
  defaultPoints: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BehaviorCategoryCreatePayload {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: BehaviorType;
  defaultSeverity: BehaviorSeverity;
  defaultPoints: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BehaviorCategoryUpdatePayload {
  code?: string;
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  defaultSeverity?: BehaviorSeverity;
  defaultPoints?: number;
  isActive?: boolean;
  sortOrder?: number;
}

/** POST /behavior/categories → response */
export interface BehaviorCategoryCreateResponse {
  id: string;
  type: BehaviorType;
  defaultPoints: number;
}

/** PATCH /behavior/categories/:id → response */
export interface BehaviorCategoryUpdateResponse {
  id: string;
  sortOrder?: number;
}

export interface BehaviorCategoryListFilters {
  type?: BehaviorType;
  isActive?: boolean;
  search?: string;
}

/** GET /behavior/categories → items shape */
export interface BehaviorCategoryListResponse {
  items: BehaviorCategory[];
  total?: number;
}

// ─── Record ────────────────────────────────────────────────────────────────
export interface BehaviorRecord {
  id: string;
  academicYearId?: string;
  termId?: string;
  studentId: string;
  enrollmentId?: string;
  categoryId: string;
  categoryName?: string;
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  type?: BehaviorType;
  status: BehaviorStatus;
  severity?: BehaviorSeverity;
  points: number;
  occurredAt: string;
  reviewNoteEn?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BehaviorRecordCreatePayload {
  academicYearId: string;
  termId: string;
  studentId: string;
  enrollmentId?: string;
  categoryId: string;
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  occurredAt: string;
}

export interface BehaviorRecordUpdatePayload {
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  points?: number;
  severity?: BehaviorSeverity;
}

/** POST /behavior/records → response */
export interface BehaviorRecordCreateResponse {
  id: string;
  status: BehaviorStatus;
  type: BehaviorType;
  points: number;
}

/** POST /behavior/records/:id/submit → response */
export interface BehaviorSubmitResponse {
  id: string;
  status: BehaviorStatus;
  submittedAt: string;
}

export interface BehaviorRecordApprovePayload {
  reviewNoteEn?: string;
  pointsOverride?: number;
}

/** POST /behavior/records/:id/approve → response */
export interface BehaviorApproveResponse {
  record: {
    id: string;
    status: BehaviorStatus;
    points: number;
  };
}

export interface BehaviorRecordRejectPayload {
  reviewNoteEn?: string;
}

/** POST /behavior/records/:id/reject → response */
export interface BehaviorRejectResponse {
  record: {
    id: string;
    status: BehaviorStatus;
  };
}

export interface BehaviorRecordListFilters {
  academicYearId?: string;
  termId?: string;
  studentId?: string;
  status?: BehaviorStatus;
  type?: BehaviorType;
  dateFrom?: string;
  dateTo?: string;
}

/** GET /behavior/records → items shape */
export interface BehaviorRecordListResponse {
  items: BehaviorRecord[];
  total?: number;
}

// ─── Review Queue ──────────────────────────────────────────────────────────
export interface BehaviorReviewQueueItem {
  id: string;
  recordId?: string;
  studentId?: string;
  studentName?: string;
  categoryId?: string;
  categoryName?: string;
  type?: BehaviorType;
  status: BehaviorStatus;
  points?: number;
  occurredAt?: string;
  submittedAt?: string;
}

export interface BehaviorReviewQueueFilters {
  academicYearId?: string;
  termId?: string;
  studentId?: string;
}

/** GET /behavior/review-queue → items shape */
export interface BehaviorReviewQueueResponse {
  items: BehaviorReviewQueueItem[];
  total?: number;
}

// ─── Dashboard / Overview ──────────────────────────────────────────────────
export interface BehaviorOverviewFilters {
  academicYearId?: string;
  termId?: string;
  classroomId?: string;
  includeRecentActivity?: boolean;
  includeTopCategories?: boolean;
}

/** GET /behavior/overview → response */
export interface BehaviorOverviewResponse {
  summary: Record<string, unknown>;
  recentActivity: unknown[];
  topCategories: unknown[];
}

export interface BehaviorStudentSummaryFilters {
  academicYearId?: string;
  termId?: string;
  includeTimeline?: boolean;
  includeCategoryBreakdown?: boolean;
  includeLedger?: boolean;
}

/** GET /behavior/students/:studentId/summary → response */
export interface BehaviorStudentSummaryResponse {
  student: Record<string, unknown>;
  timeline: unknown[];
  categoryBreakdown: unknown[];
  ledger: unknown[];
}

export interface BehaviorClassroomSummaryFilters {
  academicYearId?: string;
  termId?: string;
  includeStudents?: boolean;
  includeCategoryBreakdown?: boolean;
  includeRecentActivity?: boolean;
}

/** GET /behavior/classrooms/:classroomId/summary → response */
export interface BehaviorClassroomSummaryResponse {
  students: unknown[];
  categoryBreakdown: unknown[];
  recentActivity: unknown[];
}
