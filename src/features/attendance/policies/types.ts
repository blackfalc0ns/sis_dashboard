export type AttendanceScopeType = "SCHOOL" | "STAGE" | "GRADE" | "SECTION";
export type AttendanceMode = "DAILY" | "PERIOD";

export interface AttendancePolicy {
  id: string;
  yearId: string;
  termId: string;
  nameAr: string;
  nameEn: string;
  scopeType: AttendanceScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
  };
  mode: AttendanceMode;
  lateThresholdMinutes: number;
  earlyLeaveThresholdMinutes: number;
  autoAbsentAfterMinutes?: number;
  allowExcuses: boolean;
  requireAttachmentForExcuse: boolean;
  effectiveStartDate: string; // YYYY-MM-DD
  effectiveEndDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyFormData extends Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt"> {}
