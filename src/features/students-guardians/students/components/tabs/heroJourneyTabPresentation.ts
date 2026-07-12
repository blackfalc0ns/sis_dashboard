import type {
  HeroJourneyActivity,
  HeroJourneyMission,
  HeroJourneyProgress,
  HeroJourneyRewards,
} from "./heroJourneyTabTypes";

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const sortByRecentActivity = <T extends { lastActivityAt?: string | null; occurredAt?: string | null }>(
  values: T[],
) =>
  [...values].sort((left, right) => {
    const leftTime = new Date(left.lastActivityAt ?? left.occurredAt ?? 0).getTime();
    const rightTime = new Date(right.lastActivityAt ?? right.occurredAt ?? 0).getTime();
    return rightTime - leftTime;
  });

function normalizeMission(value: unknown): HeroJourneyMission {
  const row = asRecord(value);
  const objectives = asRecord(row.objectives);
  const badge = asRecord(row.badgeReward);

  return {
    id: asString(row.missionId || row.id),
    status: asString(row.status),
    progressPercent: asNumber(row.progressPercent),
    titleEn: asString(row.titleEn) || null,
    titleAr: asString(row.titleAr) || null,
    requiredObjectives: asNumber(objectives.required),
    completedRequiredObjectives: asNumber(objectives.completedRequired),
    rewardXp: asNumber(row.rewardXp),
    badgeReward: Object.keys(badge).length
      ? {
          id: asString(badge.id),
          nameEn: asString(badge.nameEn) || null,
          nameAr: asString(badge.nameAr) || null,
          assetPath: asString(badge.assetPath) || null,
        }
      : null,
    lastActivityAt: asString(row.lastActivityAt) || null,
  };
}

export function normalizeHeroJourneyProgress(raw: unknown): HeroJourneyProgress {
  const response = asRecord(raw);
  const summary = asRecord(response.summary);

  return {
    id: asString(response.progressId || response.id),
    summary: {
      missionsTotal: asNumber(summary.missionsTotal),
      notStarted: asNumber(summary.notStarted),
      inProgress: asNumber(summary.inProgress),
      completed: asNumber(summary.completed),
      cancelled: asNumber(summary.cancelled),
      completionRate: asNumber(summary.completionRate),
    },
    missions: sortByRecentActivity(asArray(response.missions).map(normalizeMission)),
    recentEvents: sortByRecentActivity(
      asArray(response.recentEvents).map((item): HeroJourneyActivity => {
        const row = asRecord(item);
        return {
          id: asString(row.id),
          type: asString(row.type),
          missionId: asString(row.missionId) || null,
          occurredAt: asString(row.occurredAt) || null,
        };
      }),
    ),
  };
}

export function normalizeHeroJourneyRewards(raw: unknown): HeroJourneyRewards {
  const response = asRecord(raw);
  const summary = asRecord(response.summary);

  return {
    totalHeroXp: asNumber(summary.totalHeroXp),
    badgesCount: asNumber(summary.badgesCount),
    badges: asArray(response.badges).map((item) => {
      const row = asRecord(item);
      const badge = asRecord(row.badge);
      return {
        id: asString(row.id),
        name: asString(badge.nameEn || badge.nameAr || badge.slug),
      };
    }),
    xpLedger: asArray(response.xpLedger).map((item) => {
      const row = asRecord(item);
      return {
        id: asString(row.id),
        amount: asNumber(row.amount),
        reason: asString(row.reason),
      };
    }),
  };
}

export const getMissionTitle = (mission: HeroJourneyMission, locale: string) =>
  (locale === "ar" ? mission.titleAr || mission.titleEn : mission.titleEn || mission.titleAr) ||
  "Mission";

export const isAwaitingMissionCompletion = (mission: HeroJourneyMission) =>
  mission.status === "in_progress" &&
  mission.requiredObjectives > 0 &&
  mission.completedRequiredObjectives >= mission.requiredObjectives;
