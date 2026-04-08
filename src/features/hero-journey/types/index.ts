export type HeroJourneyMissionStatus =
  | "draft"
  | "published"
  | "scheduled"
  | "archived";

export type HeroJourneyProgressStatus = "on_track" | "at_risk" | "inactive";

export interface HeroJourneyBadge {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  assetPath?: string;
}

export interface HeroJourneyChartDatum {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  color?: string;
}

export interface HeroJourneyTimeSeriesDatum {
  label: string;
  value: number;
  ts?: string;
}

export interface HeroJourneyStagePerformance {
  id: string;
  stageNameEn: string;
  stageNameAr: string;
  completionRate: number;
  activeStudents: number;
}

export interface HeroJourneyDropOffDatum {
  missionId: string;
  titleEn: string;
  titleAr: string;
  started: number;
  completed: number;
  dropOffRate: number;
}

export interface HeroJourneySummaryWidget {
  id: string;
  titleEn: string;
  titleAr: string;
  value: string;
  descriptionEn: string;
  descriptionAr: string;
  tone: "teal" | "sky" | "amber";
}

export interface HeroJourneyOverviewMetrics {
  enrolledStudents: number;
  activeStudentsThisWeek: number;
  missionCompletionRate: number;
  totalXpEarned: number;
  averageStreakDays: number;
  badgesEarnedThisMonth: number;
  stuckStudentsCount: number;
  averageProgressPercent: number;
  missionStatusBreakdown: HeroJourneyChartDatum[];
  xpTrend: HeroJourneyTimeSeriesDatum[];
  completionByStage: HeroJourneyStagePerformance[];
  streakDistribution: HeroJourneyChartDatum[];
  topMissionDropOff: HeroJourneyDropOffDatum[];
  summaryWidgets: HeroJourneySummaryWidget[];
}

export interface HeroJourneyMission {
  id: string;
  titleEn: string;
  titleAr: string;
  stageNameEn: string;
  stageNameAr: string;
  requiredLevel: number;
  linkedLessonId: string;
  linkedLessonTitleEn: string;
  linkedLessonTitleAr: string;
  linkedQuizId: string;
  linkedQuizTitleEn: string;
  linkedQuizTitleAr: string;
  status: HeroJourneyMissionStatus;
  rewardXp: number;
  badgeRewardSlug?: string;
  studentsStarted: number;
  studentsCompleted: number;
  updatedAt: string;
}

export interface HeroJourneyMissionObjective {
  id: string;
  titleEn: string;
  titleAr: string;
  isCompleted: boolean;
}

export interface HeroJourneyStudentProgress {
  id: string;
  studentName: string;
  stageNameEn: string;
  stageNameAr: string;
  gradeNameEn: string;
  gradeNameAr: string;
  sectionNameEn: string;
  sectionNameAr: string;
  currentLevel: number;
  currentMissionId: string;
  currentMissionTitleEn: string;
  currentMissionTitleAr: string;
  xpCurrent: number;
  xpTarget: number;
  rankTitleEn: string;
  rankTitleAr: string;
  badgeSlugs: string[];
  recentBadgeSlugs: string[];
  streakDays: number;
  lastActivityAt: string;
  progressStatus: HeroJourneyProgressStatus;
  progressPercent: number;
  completedMissionsCount: number;
  currentObjectives: HeroJourneyMissionObjective[];
  coachNoteEn: string;
  coachNoteAr: string;
}

export interface HeroJourneyMissionFilters {
  search?: string;
  status?: HeroJourneyMissionStatus | "all";
  stage?: string | "all";
}

export interface HeroJourneyStudentProgressFilters {
  search?: string;
  grade?: string | "all";
  section?: string | "all";
  status?: HeroJourneyProgressStatus | "all";
}
