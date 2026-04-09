"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/utils/formatters/dateTime";
import type { HeroJourneyBadge, HeroJourneyMission } from "../types";
import { formatHeroJourneyPercent } from "../utils/heroJourneyPresentation";
import HeroJourneyBadgeThumb from "./HeroJourneyBadgeThumb";
import HeroJourneyStatusPill from "./HeroJourneyStatusPill";

interface HeroJourneyMissionDetailContentProps {
  mission: HeroJourneyMission | null;
  badgeMap: Map<string, HeroJourneyBadge>;
}

function getMissionCompletionRate(mission: HeroJourneyMission) {
  if (mission.studentsStarted === 0) {
    return 0;
  }

  return (mission.studentsCompleted / mission.studentsStarted) * 100;
}

export default function HeroJourneyMissionDetailContent({
  mission,
  badgeMap,
}: HeroJourneyMissionDetailContentProps) {
  const locale = useLocale();
  const t = useTranslations("heroJourney");

  if (!mission) {
    return <div className="text-sm text-gray-500">{t("empty.missions")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {locale === "ar" ? mission.titleAr : mission.titleEn}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{mission.id}</p>
        </div>
        <HeroJourneyStatusPill kind="mission" value={mission.status} />
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500">{t("detail.requiredLevel")}</p>
          <p className="mt-1 font-semibold text-gray-900">
            {mission.requiredLevel}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500">{t("detail.lastUpdated")}</p>
          <p className="mt-1 font-semibold text-gray-900">
            {formatDate(mission.updatedAt, locale)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-500">
          {t("detail.linkedContent")}
        </p>
        <p className="mt-2 text-sm text-gray-900">
          {locale === "ar"
            ? mission.linkedLessonTitleAr
            : mission.linkedLessonTitleEn}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {locale === "ar"
            ? mission.linkedQuizTitleAr
            : mission.linkedQuizTitleEn}
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-500">
          {t("detail.rewardPreview")}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-600">{t("table.rewardXp")}</p>
            <p className="font-semibold text-gray-900">{mission.rewardXp} XP</p>
          </div>
          <HeroJourneyBadgeThumb
            badge={badgeMap.get(mission.badgeRewardSlug || "")}
            size="md"
            showLabel
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-500">{t("detail.engagement")}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-gray-500">{t("table.studentsStarted")}</p>
            <p className="font-semibold text-gray-900">{mission.studentsStarted}</p>
          </div>
          <div>
            <p className="text-gray-500">{t("table.studentsCompleted")}</p>
            <p className="font-semibold text-gray-900">
              {mission.studentsCompleted}
            </p>
          </div>
          <div>
            <p className="text-gray-500">{t("table.completionRate")}</p>
            <p className="font-semibold text-gray-900">
              {formatHeroJourneyPercent(getMissionCompletionRate(mission))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
