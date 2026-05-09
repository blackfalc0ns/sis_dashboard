"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Award, Flame, ShieldAlert, Target, Trophy, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { KPICardV2 } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { heroJourneySectionBanners } from "../config/heroJourneySectionBanners";
import { getHeroJourneyOverview } from "../services/heroJourneyService";
import type { HeroJourneyOverviewMetrics } from "../types";
import HeroJourneyPageHeader from "./HeroJourneyPageHeader";
import HeroJourneyOverviewCharts from "./charts/HeroJourneyOverviewCharts";

const widgetToneClasses = {
  teal: "border-teal-100 bg-teal-50",
  sky: "border-sky-100 bg-sky-50",
  amber: "border-amber-100 bg-amber-50",
} as const;

const widgetIconClasses = {
  teal: "bg-teal-100 text-teal-700",
  sky: "bg-sky-100 text-sky-700",
  amber: "bg-amber-100 text-amber-700",
} as const;

export default function HeroJourneyOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("heroJourney");
  const [overview, setOverview] = useState<HeroJourneyOverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getHeroJourneyOverview()
      .then((result) => {
        if (!cancelled) {
          setOverview(result);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t("messages.loadOverviewFailed"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const kpiCards = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        key: "enrolled",
        title: t("kpi.enrolledStudents"),
        value: overview.enrolledStudents,
        icon: Users,
        iconColor: "#036b80",
        iconBgColor: "#e6f4f6",
      },
      {
        key: "active",
        title: t("kpi.activeThisWeek"),
        value: overview.activeStudentsThisWeek,
        icon: Activity,
        iconColor: "#0f766e",
        iconBgColor: "#ecfdf5",
      },
      {
        key: "completion",
        title: t("kpi.completionRate"),
        value: overview.missionCompletionRate,
        valueSuffix: "%",
        icon: Target,
        iconColor: "#0284c7",
        iconBgColor: "#eff6ff",
      },
      {
        key: "xp",
        title: t("kpi.totalXpEarned"),
        value: overview.totalXpEarned,
        icon: Trophy,
        iconColor: "#7c3aed",
        iconBgColor: "#f5f3ff",
      },
      {
        key: "streak",
        title: t("kpi.averageStreak"),
        value: overview.averageStreakDays,
        icon: Flame,
        iconColor: "#ea580c",
        iconBgColor: "#fff7ed",
      },
      {
        key: "badges",
        title: t("kpi.badgesAwarded"),
        value: overview.badgesEarnedThisMonth,
        icon: Award,
        iconColor: "#b45309",
        iconBgColor: "#fffbeb",
      },
    ];
  }, [overview, t]);

  if (error) {
    return (
      <div className="space-y-6">
        <HeroJourneyPageHeader
          title={t("overview")}
          description={t("overviewDescription")}
          bannerImageSrc={heroJourneySectionBanners.overview}
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="space-y-6">
        <HeroJourneyPageHeader
          title={t("overview")}
          description={t("overviewDescription")}
          bannerImageSrc={heroJourneySectionBanners.overview}
        />
        <MainLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50">
      <HeroJourneyPageHeader
        title={t("overview")}
        description={t("overviewDescription")}
        bannerImageSrc={heroJourneySectionBanners.overview}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((card) => (
          <KPICardV2
            key={card.key}
            title={card.title}
            value={card.value}
            valueSuffix={card.valueSuffix}
            icon={card.icon}
            iconColor={card.iconColor}
            iconBgColor={card.iconBgColor}
            showChart={false}
            className="bg-white"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.summaryWidgets.map((widget) => (
          <div
            key={widget.id}
            className={`rounded-xl border p-5 shadow-sm ${widgetToneClasses[widget.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {widget.id === "near-level-up"
                    ? t("summary.nearLevelUp.title")
                    : widget.id === "attention-queue"
                      ? t("summary.attentionQueue.title")
                      : t("summary.bestStage.title")}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {widget.id === "best-stage"
                    ? locale === "ar"
                      ? [...overview.completionByStage].sort(
                          (left, right) => right.completionRate - left.completionRate,
                        )[0]?.stageNameAr || widget.value
                      : [...overview.completionByStage].sort(
                          (left, right) => right.completionRate - left.completionRate,
                        )[0]?.stageNameEn || widget.value
                    : widget.value}
                </p>
              </div>
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${widgetIconClasses[widget.tone]}`}
              >
                {widget.id === "near-level-up" ? (
                  <Target className="h-5 w-5" />
                ) : widget.id === "attention-queue" ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : (
                  <Trophy className="h-5 w-5" />
                )}
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {widget.id === "near-level-up"
                ? t("summary.nearLevelUp.description")
                : widget.id === "attention-queue"
                  ? t("summary.attentionQueue.description")
                  : t("summary.bestStage.description")}
            </p>
          </div>
        ))}
      </div>

      <HeroJourneyOverviewCharts overview={overview} />
    </div>
  );
}
