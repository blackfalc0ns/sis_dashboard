export type HeroJourneyMission = {
  id: string;
  status: string;
  progressPercent: number;
  titleEn: string | null;
  titleAr: string | null;
  requiredObjectives: number;
  completedRequiredObjectives: number;
  rewardXp: number;
  badgeReward: {
    id: string;
    nameEn: string | null;
    nameAr: string | null;
    assetPath: string | null;
  } | null;
  lastActivityAt: string | null;
};

export type HeroJourneyActivity = {
  id: string;
  type: string;
  missionId: string | null;
  occurredAt: string | null;
};

export type HeroJourneyProgress = {
  id: string;
  summary: {
    missionsTotal: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };
  missions: HeroJourneyMission[];
  recentEvents: HeroJourneyActivity[];
};

export type HeroJourneyRewards = {
  totalHeroXp: number;
  badgesCount: number;
  badges: Array<{
    id: string;
    name: string;
  }>;
  xpLedger: Array<{
    id: string;
    amount: number;
    reason: string;
  }>;
};
