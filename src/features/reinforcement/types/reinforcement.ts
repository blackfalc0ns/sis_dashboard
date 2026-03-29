export type ReinforcementSource = "teacher" | "parent" | "system";

export type ReinforcementStatus =
  | "draft"
  | "active"
  | "in_progress"
  | "under_review"
  | "completed"
  | "rejected"
  | "archived";

export type ReinforcementProofType = "image" | "video" | "document" | "none";
export type ReinforcementRewardType = "moral" | "financial" | "xp" | "badge";

export interface ReinforcementStage {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  proofType: ReinforcementProofType;
  isCompleted: boolean;
  isApproved: boolean;
  submittedAt?: string;
  proofUrl?: string;
}

export interface ReinforcementTask {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  source: ReinforcementSource;
  status: ReinforcementStatus;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  dueDate?: string;
  assignedById?: string;
  assignedByName?: string;
  createdAt: string;
  updatedAt: string;
  stages: ReinforcementStage[];
}

export type ReinforcementTemplateStage = Omit<
  ReinforcementStage,
  "isCompleted" | "isApproved" | "submittedAt" | "proofUrl"
>;

export interface ReinforcementTemplate {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  stages: ReinforcementTemplateStage[];
  isActive: boolean;
  createdAt: string;
}

export interface ReinforcementReward {
  id: string;
  nameAr: string;
  nameEn: string;
  type: ReinforcementRewardType;
  defaultValue: string;
  isActive: boolean;
}

export interface ReinforcementReviewItem {
  id: string;
  taskId: string;
  taskTitleAr: string;
  taskTitleEn: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  proofType: ReinforcementProofType;
  source: ReinforcementSource;
  status: Extract<ReinforcementStatus, "under_review">;
  stageCountCompleted: number;
}

export interface ReinforcementTaskFilters {
  search?: string;
  student?: string;
  className?: string;
  source?: ReinforcementSource | "all";
  status?: ReinforcementStatus | "all";
  rewardType?: ReinforcementRewardType | "all";
  dueDate?: string;
}

export interface ReinforcementOverviewKpis {
  activeTasks: number;
  underReview: number;
  completedThisWeek: number;
  rewardedStudents: number;
  averageCompletionRate: number;
  totalRewardsIssued: number;
}

export interface ReinforcementChartDatum {
  id: string;
  label: string;
  value: number;
}

export interface ReinforcementTopPerformer {
  id: string;
  name: string;
  value: number;
}

export interface ReinforcementActivityItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  timestamp: string;
  type: "review" | "reward" | "task" | "submission";
}

export interface ReinforcementQuickAction {
  id: string;
  titleAr: string;
  titleEn: string;
  href: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface ReinforcementOverview {
  kpis: ReinforcementOverviewKpis;
  tasksByStatus: ReinforcementChartDatum[];
  tasksBySource: ReinforcementChartDatum[];
  rewardsByType: ReinforcementChartDatum[];
  topClasses: ReinforcementTopPerformer[];
  topStudents: ReinforcementTopPerformer[];
  recentActivity: ReinforcementActivityItem[];
  quickActions: ReinforcementQuickAction[];
}

export type CreateReinforcementTemplatePayload = Omit<
  ReinforcementTemplate,
  "id" | "createdAt"
>;

export type CreateReinforcementRewardPayload = Omit<
  ReinforcementReward,
  "id"
>;
