import {
  mockHeroJourneyBadges,
  mockHeroJourneyMissions,
  mockHeroJourneyStudentProgress,
  mockHeroJourneyXpTrend,
} from "../data/mockHeroJourneyData";
import { getHeroJourneyBadgeAssetPath } from "../utils/badgeAssetRegistry";
import type {
  HeroJourneyBadge,
  HeroJourneyMission,
  HeroJourneyMissionFilters,
  HeroJourneyMissionStatus,
  HeroJourneyOverviewMetrics,
  HeroJourneyStudentProgress,
  HeroJourneyStudentProgressFilters,
} from "../types";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const wait = (ms = 120) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

let missionsStore = clone(mockHeroJourneyMissions);
const badgesStore = clone(mockHeroJourneyBadges);
const studentsStore = clone(mockHeroJourneyStudentProgress);

function buildOverviewMetrics(): HeroJourneyOverviewMetrics {
  const enrolledStudents = studentsStore.length;
  const activeStudentsThisWeek = studentsStore.filter((student) => {
    const diffInDays =
      (new Date("2026-04-08T23:59:00.000Z").getTime() -
        new Date(student.lastActivityAt).getTime()) /
      (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  }).length;

  const startedMissions = missionsStore.reduce(
    (sum, mission) => sum + mission.studentsStarted,
    0,
  );
  const completedMissions = missionsStore.reduce(
    (sum, mission) => sum + mission.studentsCompleted,
    0,
  );

  const missionCompletionRate =
    startedMissions === 0 ? 0 : (completedMissions / startedMissions) * 100;
  const totalXpEarned = studentsStore.reduce(
    (sum, student) => sum + student.xpCurrent,
    0,
  );
  const averageStreakDays =
    studentsStore.reduce((sum, student) => sum + student.streakDays, 0) /
    Math.max(enrolledStudents, 1);
  const badgesEarnedThisMonth = studentsStore.reduce(
    (sum, student) => sum + student.recentBadgeSlugs.length,
    0,
  );
  const stuckStudentsCount = studentsStore.filter(
    (student) => student.progressStatus === "at_risk",
  ).length;
  const averageProgressPercent =
    studentsStore.reduce((sum, student) => sum + student.progressPercent, 0) /
    Math.max(enrolledStudents, 1);

  const stageMap = new Map<
    string,
    {
      stageNameEn: string;
      stageNameAr: string;
      totalProgress: number;
      activeStudents: number;
    }
  >();

  studentsStore.forEach((student) => {
    const existing = stageMap.get(student.stageNameEn) || {
      stageNameEn: student.stageNameEn,
      stageNameAr: student.stageNameAr,
      totalProgress: 0,
      activeStudents: 0,
    };
    existing.totalProgress += student.progressPercent;
    existing.activeStudents += 1;
    stageMap.set(student.stageNameEn, existing);
  });

  const completionByStage = Array.from(stageMap.values()).map((stage, index) => ({
    id: `stage-${index + 1}`,
    stageNameEn: stage.stageNameEn,
    stageNameAr: stage.stageNameAr,
    completionRate: Number(
      (stage.totalProgress / Math.max(stage.activeStudents, 1)).toFixed(1),
    ),
    activeStudents: stage.activeStudents,
  }));

  const streakDistribution = [
    {
      id: "streak-0-2",
      labelEn: "0-2 days",
      labelAr: "0-2 أيام",
      value: studentsStore.filter((student) => student.streakDays <= 2).length,
      color: "#94a3b8",
    },
    {
      id: "streak-3-6",
      labelEn: "3-6 days",
      labelAr: "3-6 أيام",
      value: studentsStore.filter(
        (student) => student.streakDays >= 3 && student.streakDays <= 6,
      ).length,
      color: "#38bdf8",
    },
    {
      id: "streak-7-10",
      labelEn: "7-10 days",
      labelAr: "7-10 أيام",
      value: studentsStore.filter(
        (student) => student.streakDays >= 7 && student.streakDays <= 10,
      ).length,
      color: "#14b8a6",
    },
    {
      id: "streak-11-plus",
      labelEn: "11+ days",
      labelAr: "11+ يوم",
      value: studentsStore.filter((student) => student.streakDays >= 11).length,
      color: "#f59e0b",
    },
  ];

  const topMissionDropOff = missionsStore
    .filter((mission) => mission.studentsStarted > 0)
    .map((mission) => ({
      missionId: mission.id,
      titleEn: mission.titleEn,
      titleAr: mission.titleAr,
      started: mission.studentsStarted,
      completed: mission.studentsCompleted,
      dropOffRate: Number(
        (
          ((mission.studentsStarted - mission.studentsCompleted) /
            mission.studentsStarted) *
          100
        ).toFixed(1),
      ),
    }))
    .sort((left, right) => right.dropOffRate - left.dropOffRate)
    .slice(0, 5);

  const bestStage = [...completionByStage].sort(
    (left, right) => right.completionRate - left.completionRate,
  )[0];
  const nearLevelUpCount = studentsStore.filter(
    (student) => student.progressPercent >= 85,
  ).length;
  const inactiveCount = studentsStore.filter(
    (student) => student.progressStatus === "inactive",
  ).length;

  return {
    enrolledStudents,
    activeStudentsThisWeek,
    missionCompletionRate: Number(missionCompletionRate.toFixed(1)),
    totalXpEarned,
    averageStreakDays: Number(averageStreakDays.toFixed(1)),
    badgesEarnedThisMonth,
    stuckStudentsCount,
    averageProgressPercent: Number(averageProgressPercent.toFixed(1)),
    missionStatusBreakdown: [
      {
        id: "published",
        labelEn: "Published",
        labelAr: "منشورة",
        value: missionsStore.filter((mission) => mission.status === "published")
          .length,
        color: "#10b981",
      },
      {
        id: "draft",
        labelEn: "Draft",
        labelAr: "مسودة",
        value: missionsStore.filter((mission) => mission.status === "draft")
          .length,
        color: "#94a3b8",
      },
      {
        id: "scheduled",
        labelEn: "Scheduled",
        labelAr: "مجدولة",
        value: missionsStore.filter((mission) => mission.status === "scheduled")
          .length,
        color: "#38bdf8",
      },
      {
        id: "archived",
        labelEn: "Archived",
        labelAr: "مؤرشفة",
        value: missionsStore.filter((mission) => mission.status === "archived")
          .length,
        color: "#f59e0b",
      },
    ],
    xpTrend: clone(mockHeroJourneyXpTrend),
    completionByStage,
    streakDistribution,
    topMissionDropOff,
    summaryWidgets: [
      {
        id: "near-level-up",
        titleEn: "Near Level-Up",
        titleAr: "قريبون من المستوى التالي",
        value: String(nearLevelUpCount),
        descriptionEn:
          "Students already above 85% progress and ready for the next push.",
        descriptionAr: "طلاب تجاوزوا 85% من التقدم وجاهزون للدفعة التالية.",
        tone: "teal",
      },
      {
        id: "attention-queue",
        titleEn: "Attention Queue",
        titleAr: "قائمة التدخل",
        value: String(stuckStudentsCount + inactiveCount),
        descriptionEn:
          "At-risk and inactive students who may need teacher follow-up.",
        descriptionAr: "طلاب معرضون للخطر أو غير نشطين ويحتاجون متابعة من المعلم.",
        tone: "amber",
      },
      {
        id: "best-stage",
        titleEn: "Best Performing Stage",
        titleAr: "أفضل مرحلة أداءً",
        value: bestStage?.stageNameEn || "N/A",
        descriptionEn:
          "Highest average progress in the current mock journey dataset.",
        descriptionAr: "أعلى متوسط تقدم في بيانات الرحلة الحالية.",
        tone: "sky",
      },
    ],
  };
}

export async function getHeroJourneyOverview(): Promise<HeroJourneyOverviewMetrics> {
  await wait();
  return clone(buildOverviewMetrics());
}

export async function getHeroJourneyBadgeCatalog(): Promise<HeroJourneyBadge[]> {
  await wait();
  return clone(
    badgesStore.map((badge) => ({
      ...badge,
      assetPath: getHeroJourneyBadgeAssetPath(badge.slug),
    })),
  );
}

export async function getHeroJourneyMissions(
  filters: HeroJourneyMissionFilters = {},
): Promise<HeroJourneyMission[]> {
  await wait();

  const search = filters.search?.trim().toLowerCase();

  return clone(
    missionsStore.filter((mission) => {
      if (search) {
        const haystack = [
          mission.id,
          mission.titleEn,
          mission.titleAr,
          mission.stageNameEn,
          mission.stageNameAr,
          mission.linkedLessonTitleEn,
          mission.linkedLessonTitleAr,
          mission.linkedQuizTitleEn,
          mission.linkedQuizTitleAr,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      if (
        filters.status &&
        filters.status !== "all" &&
        mission.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.stage &&
        filters.stage !== "all" &&
        mission.stageNameEn !== filters.stage
      ) {
        return false;
      }

      return true;
    }),
  );
}

export async function getHeroJourneyStudentProgress(
  filters: HeroJourneyStudentProgressFilters = {},
): Promise<HeroJourneyStudentProgress[]> {
  await wait();

  const search = filters.search?.trim().toLowerCase();

  return clone(
    studentsStore.filter((student) => {
      if (search) {
        const haystack = [
          student.studentName,
          student.gradeNameEn,
          student.gradeNameAr,
          student.sectionNameEn,
          student.sectionNameAr,
          student.currentMissionTitleEn,
          student.currentMissionTitleAr,
          student.rankTitleEn,
          student.rankTitleAr,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      if (
        filters.grade &&
        filters.grade !== "all" &&
        student.gradeNameEn !== filters.grade
      ) {
        return false;
      }

      if (
        filters.section &&
        filters.section !== "all" &&
        student.sectionNameEn !== filters.section
      ) {
        return false;
      }

      if (
        filters.status &&
        filters.status !== "all" &&
        student.progressStatus !== filters.status
      ) {
        return false;
      }

      return true;
    }),
  );
}

export async function toggleHeroJourneyMissionPublishState(
  missionId: string,
): Promise<HeroJourneyMission | null> {
  await wait();

  const mission = missionsStore.find((item) => item.id === missionId);

  if (!mission || mission.status === "archived") {
    return null;
  }

  const nextStatus: HeroJourneyMissionStatus =
    mission.status === "published" ? "draft" : "published";

  const updatedMission: HeroJourneyMission = {
    ...mission,
    status: nextStatus,
    updatedAt: "2026-04-08T14:20:00.000Z",
  };

  missionsStore = missionsStore.map((item) =>
    item.id === missionId ? updatedMission : item,
  );

  return clone(updatedMission);
}
