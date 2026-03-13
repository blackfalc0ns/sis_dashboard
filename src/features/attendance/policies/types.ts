export type AttendanceScopeType = "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
export type AttendanceMode = "DAILY" | "PERIOD";
export type DailyComputationStrategy = "MANUAL" | "DERIVED_FROM_PERIODS";

export interface AttendancePolicy {
  id: string;
  yearId: string;
  termId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  notesAr?: string;
  notesEn?: string;
  scopeType: AttendanceScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
  mode: AttendanceMode;
  dailyComputationStrategy?: DailyComputationStrategy; // Only for DAILY mode
  selectedPeriodIds?: string[]; // For PERIOD mode or DAILY with DERIVED strategy
  lateThresholdMinutes: number;
  earlyLeaveThresholdMinutes: number;
  autoAbsentAfterMinutes?: number; // For DAILY mode
  absentIfMissedPeriodsCount?: number; // For PERIOD mode
  allowExcuses: boolean;
  requireExcuseReason: boolean;
  requireAttachmentForExcuse: boolean;
  notifyTeachers: boolean;
  notifyStudents: boolean;
  notifyGuardians: boolean;
  notifyOnAbsent: boolean;
  notifyOnLate: boolean;
  notifyOnEarlyLeave: boolean;
  effectiveStartDate: string; // YYYY-MM-DD
  effectiveEndDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PolicyFormData = Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">;

export interface PolicyConflict {
  policyId: string;
  conflictingPolicyId: string;
  reason: string;
}

export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
  conflicts: PolicyConflict[];
}
