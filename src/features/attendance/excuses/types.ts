export type ExcuseType = "ABSENCE" | "LATE" | "EARLY_LEAVE";
export type ExcuseStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ExcuseScopeType = "SCHOOL" | "STAGE" | "GRADE" | "SECTION";

export interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface ExcuseRequest {
  id: string;
  yearId: string;
  termId: string;
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber?: string;
  scopeType: ExcuseScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
  };
  type: ExcuseType;
  dateFrom: string;
  dateTo: string;
  selectedPeriodIds?: string[]; // Stable period IDs from timetable
  periodIndexes?: number[]; // Legacy support - will be migrated to selectedPeriodIds
  reasonAr: string;
  reasonEn: string;
  attachments: AttachmentMeta[];
  status: ExcuseStatus;
  decisionNote?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
  linkedSessionIds?: string[];
}

export interface ExcuseRequestFilters {
  dateFrom?: string;
  dateTo?: string;
  scopeType: ExcuseScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
  };
  status: "ALL" | ExcuseStatus;
  type: "ALL" | ExcuseType;
  search: string;
  hasAttachment: "ALL" | "YES" | "NO";
}

export interface ExcusesKpis {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withAttachments: number;
}

export interface ExcuseValidationErrors {
  studentId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  selectedPeriodIds?: string;
  reason?: string;
  attachments?: string;
  policy?: string;
}
