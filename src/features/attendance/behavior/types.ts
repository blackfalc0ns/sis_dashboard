import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";

export type BehaviorType = "POSITIVE" | "NEGATIVE";
export type BehaviorStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type BehaviorSeverity = "LOW" | "MEDIUM" | "HIGH";
export type BehaviorPointsSign = "+" | "-";

export interface AttendanceBehaviorFilters {
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  incidentType?: "ALL" | BehaviorType;
}

export interface AttendanceBehaviorRow {
  id: string;
  studentName: string;
  studentNumber: string;
  behaviorType: BehaviorType;
  points: number;
  incidentDate: string;
  note?: string;
}

export interface AttendanceBehaviorResponse {
  rows: AttendanceBehaviorRow[];
  total: number;
}

export interface BehaviorCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: BehaviorType;
  defaultSeverity: BehaviorSeverity;
  defaultPoints: number;
  pointsSign: BehaviorPointsSign;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BehaviorCategoryCreatePayload {
  code: string;
  name: string;
  description?: string;
  type: BehaviorType;
  defaultSeverity: BehaviorSeverity;
  defaultPoints: number;
  pointsSign: BehaviorPointsSign;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BehaviorCategoryUpdatePayload {
  code?: string;
  name?: string;
  description?: string;
  defaultSeverity?: BehaviorSeverity;
  defaultPoints?: number;
  pointsSign?: BehaviorPointsSign;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BehaviorCategoryListFilters {
  type?: BehaviorType;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BehaviorCategoryListResponse {
  data: BehaviorCategory[];
  total: number;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  categoryId: string;
  categoryName?: string;
  type: BehaviorType;
  status: BehaviorStatus;
  severity?: BehaviorSeverity;
  points: number;
  pointsSign: BehaviorPointsSign;
  occurredAt: string;
  note?: string;
  reviewerNote?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BehaviorRecordCreatePayload {
  studentId: string;
  categoryId: string;
  occurredAt: string;
  note?: string;
  points?: number;
  severity?: BehaviorSeverity;
}

export interface BehaviorRecordUpdatePayload {
  categoryId?: string;
  occurredAt?: string;
  note?: string;
  points?: number;
  severity?: BehaviorSeverity;
}

export interface BehaviorRecordApprovePayload {
  reviewerNote?: string;
  approvedPoints?: number;
}

export interface BehaviorRecordListFilters {
  studentId?: string;
  classroomId?: string;
  status?: BehaviorStatus;
  type?: BehaviorType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface BehaviorRecordListResponse {
  data: BehaviorRecord[];
  total: number;
}

export interface BehaviorReviewQueueItem {
  id: string;
  recordId: string;
  studentId: string;
  studentName: string;
  categoryId: string;
  categoryName: string;
  type: BehaviorType;
  status: BehaviorStatus;
  points: number;
  pointsSign: BehaviorPointsSign;
  occurredAt: string;
  submittedAt: string;
}

export interface BehaviorReviewQueueFilters {
  status?: Extract<BehaviorStatus, "SUBMITTED" | "APPROVED" | "REJECTED">;
  type?: BehaviorType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface BehaviorReviewQueueResponse {
  data: BehaviorReviewQueueItem[];
  total: number;
}

export interface BehaviorOverviewFilters {
  dateFrom?: string;
  dateTo?: string;
  classroomId?: string;
  gradeId?: string;
}

export interface BehaviorOverviewResponse {
  totalRecords: number;
  submittedRecords: number;
  approvedRecords: number;
  rejectedRecords: number;
  totalPositivePoints: number;
  totalNegativePoints: number;
  netPoints: number;
}

export interface BehaviorSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  termId?: string;
}

export interface BehaviorSummaryResponse {
  entityId: string;
  totalRecords: number;
  positiveCount: number;
  negativeCount: number;
  totalPositivePoints: number;
  totalNegativePoints: number;
  netPoints: number;
}
