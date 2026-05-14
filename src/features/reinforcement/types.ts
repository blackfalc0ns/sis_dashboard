export type ReinforcementSource = "teacher" | "parent" | "system";

export type ReinforcementRewardType = "xp" | "badge" | "moral" | "financial";

export type ReinforcementProofType = "none" | "image" | "video" | "document";

export type ReinforcementTargetScope =
  | "school"
  | "stage"
  | "grade"
  | "section"
  | "classroom"
  | "student";

export type ReinforcementTaskStatus =
  | "not_completed"
  | "in_progress"
  | "completed"
  | "cancel";

export interface ReinforcementListResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ReinforcementLocalizedFields {
  titleEn?: string;
  titleAr?: string;
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface ReinforcementStagePayload {
  sortOrder: number;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  proofType: ReinforcementProofType;
  requiresApproval?: boolean;
}

export interface ReinforcementStage extends ReinforcementStagePayload {
  id?: string;
  isCompleted?: boolean;
  isApproved?: boolean;
  submittedAt?: string;
  proofUrl?: string;
  [key: string]: unknown;
}

export interface ReinforcementTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue?: number | string;
  rewardLabelEn?: string;
  rewardLabelAr?: string;
  stages: ReinforcementStage[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ListReinforcementTemplatesParams {
  search?: string;
  source?: ReinforcementSource;
  rewardType?: ReinforcementRewardType;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateReinforcementTemplatePayload {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue?: number | string;
  rewardLabelEn?: string;
  rewardLabelAr?: string;
  stages: ReinforcementStagePayload[];
}

export type ListReinforcementTemplatesResponse =
  ReinforcementListResponse<ReinforcementTemplate>;

export interface ReinforcementTargetPayload {
  scopeType: ReinforcementTargetScope;
  scopeId: string;
}

export interface ReinforcementTaskTarget extends ReinforcementTargetPayload {
  nameEn?: string;
  nameAr?: string;
  audienceCount?: number;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  [key: string]: unknown;
}

export interface ReinforcementAssignmentSummary {
  total?: number;
  completed?: number;
  inProgress?: number;
  notCompleted?: number;
  cancelled?: number;
  [key: string]: unknown;
}

export interface ReinforcementTask {
  id: string;
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  subjectId?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue?: number | string;
  rewardLabelEn?: string;
  rewardLabelAr?: string;
  dueDate?: string;
  assignedById?: string;
  assignedByName?: string;
  status?: ReinforcementTaskStatus | string;
  targets?: ReinforcementTaskTarget[];
  stages?: ReinforcementStage[];
  assignmentSummary?: ReinforcementAssignmentSummary;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ListReinforcementTasksParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  subjectId?: string;
  studentId?: string;
  classroomId?: string;
  status?: ReinforcementTaskStatus | string;
  includeCancelled?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateReinforcementTaskPayload {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  subjectId?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue?: number | string;
  rewardLabelEn?: string;
  rewardLabelAr?: string;
  dueDate: string;
  assignedById?: string;
  assignedByName?: string;
  targets: ReinforcementTargetPayload[];
  stages: ReinforcementStagePayload[];
}

export interface DuplicateReinforcementTaskPayload {
  titleEn?: string;
  titleAr?: string;
  dueDate?: string;
}

export interface CancelReinforcementTaskPayload {
  reason: string;
  reasonAr?: string;
}

export type ListReinforcementTasksResponse =
  ReinforcementListResponse<ReinforcementTask>;

export interface ReinforcementFilterOptionsParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  subjectId?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ReinforcementScopeOption {
  value: string;
  scopeType: ReinforcementTargetScope;
  nameEn?: string;
  nameAr?: string;
  audienceCount?: number;
  [key: string]: unknown;
}

export interface ReinforcementFilterOptions {
  academicYears?: unknown[];
  terms?: unknown[];
  subjects?: unknown[];
  students?: unknown[];
  classrooms?: unknown[];
  stages?: unknown[];
  grades?: unknown[];
  sections?: unknown[];
  scopeTargets?: Partial<
    Record<ReinforcementTargetScope, ReinforcementScopeOption[]>
  >;
  [key: string]: unknown;
}

export type XpPolicyScopeType = ReinforcementTargetScope;

export interface XpPolicy {
  id: string;
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  scopeType: XpPolicyScopeType;
  scopeId?: string;
  dailyCap?: number;
  weeklyCap?: number;
  cooldownMinutes?: number;
  allowedReasons?: string[];
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ListXpPoliciesParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  scopeType?: XpPolicyScopeType;
  scopeId?: string;
  studentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface GetEffectiveXpPolicyParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  studentId?: string;
  enrollmentId?: string;
  scopeType?: XpPolicyScopeType;
  scopeId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateXpPolicyPayload {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  scopeType: XpPolicyScopeType;
  scopeId?: string;
  dailyCap?: number;
  weeklyCap?: number;
  cooldownMinutes?: number;
  allowedReasons?: string[];
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export type PatchXpPolicyPayload = Partial<
  Pick<
    CreateXpPolicyPayload,
    | "dailyCap"
    | "weeklyCap"
    | "cooldownMinutes"
    | "allowedReasons"
    | "startsAt"
    | "endsAt"
    | "isActive"
  >
>;

export type ListXpPoliciesResponse = ReinforcementListResponse<XpPolicy>;

export interface ManualXpGrantPayload {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  studentId: string;
  enrollmentId: string;
  amount: number;
  reason: string;
  reasonAr?: string;
  sourceId?: string;
  dedupeKey?: string;
}

export interface ManualXpGrantResponse {
  id?: string;
  ledgerEntry?: XpLedgerEntry;
  studentId?: string;
  amount?: number;
  balance?: number;
  [key: string]: unknown;
}

export interface XpLedgerEntry {
  id: string;
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  studentId: string;
  enrollmentId?: string;
  amount: number;
  reason?: string;
  reasonAr?: string;
  sourceId?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ListXpLedgerParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  studentId?: string;
  enrollmentId?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export type ListXpLedgerResponse = ReinforcementListResponse<XpLedgerEntry>;

export interface GetXpSummaryParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  studentId?: string;
  enrollmentId?: string;
  classroomId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface XpSummary {
  totalXp?: number;
  earnedXp?: number;
  spentXp?: number;
  balance?: number;
  ledgerCount?: number;
  [key: string]: unknown;
}

export interface ReinforcementOverviewParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  classroomId?: string;
  studentId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ReinforcementOverviewResponse {
  metrics?: Record<string, unknown>;
  kpis?: Record<string, unknown>;
  recentActivity?: unknown[];
  tasksByStatus?: unknown[];
  tasksBySource?: unknown[];
  rewardsByType?: unknown[];
  [key: string]: unknown;
}

export interface StudentReinforcementProgressParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface StudentReinforcementProgress {
  studentId: string;
  summary?: Record<string, unknown>;
  tasks?: ReinforcementTask[];
  xpSummary?: XpSummary;
  [key: string]: unknown;
}

export interface ClassroomReinforcementSummaryParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ClassroomReinforcementSummary {
  classroomId: string;
  summary?: Record<string, unknown>;
  tasks?: ReinforcementTask[];
  students?: unknown[];
  xpSummary?: XpSummary;
  [key: string]: unknown;
}
