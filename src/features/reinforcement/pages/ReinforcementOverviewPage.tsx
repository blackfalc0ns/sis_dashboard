"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ClipboardList, Sparkles } from "lucide-react";
import Select from "@/components/ui/input/Select";
import type { ReinforcementOverview } from "../types/reinforcement";
import { getReinforcementOverview } from "../services/reinforcementService";
import { useReinforcementLocale } from "../hooks/useReinforcementLocale";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementStatsGrid from "../components/shared/ReinforcementStatsGrid";
import ReinforcementOverviewCharts from "../components/charts/ReinforcementOverviewCharts";
import {
  buildReinforcementOverviewQueryState,
  parseReinforcementOverviewQueryState,
} from "../utils/reinforcementQueryState";

interface ReinforcementOverviewPageProps {
  initialOverview?: ReinforcementOverview | null;
}

const activityIcons = {
  reward: Sparkles,
  task: ClipboardList,
  submission: ClipboardList,
};

export default function ReinforcementOverviewPage({
  initialOverview = null,
}: ReinforcementOverviewPageProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("reinforcement");
  const { getLocalizedText } = useReinforcementLocale();
  const [overview, setOverview] = useState<ReinforcementOverview | null>(
    initialOverview,
  );
  const queryState = parseReinforcementOverviewQueryState(
    new URLSearchParams(searchParams.toString()),
  );

  useEffect(() => {
    if (initialOverview) return;
    getReinforcementOverview().then(setOverview);
  }, [initialOverview]);

  if (!overview) {
    return <div className="rounded-xl bg-white p-6 shadow-sm">{t("loading")}</div>;
  }

  const filteredActivity =
    queryState.activity === "all"
      ? overview.recentActivity
      : overview.recentActivity.filter((item) => item.type === queryState.activity);

  const replaceQuery = (next: {
    chart: typeof queryState.chart;
    activity: typeof queryState.activity;
  }) => {
    const nextQuery = buildReinforcementOverviewQueryState(
      next,
      new URLSearchParams(searchParams.toString()),
    );
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("overview")}
        description={t("overviewDescription")}
      />

      <ReinforcementStatsGrid kpis={overview.kpis} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <Select
            label={t("overviewControls.chart")}
            value={queryState.chart}
            onChange={(value) =>
              replaceQuery({
                chart: value as typeof queryState.chart,
                activity: queryState.activity,
              })
            }
            options={[
              { value: "status", label: t("overviewControls.chartOptions.status") },
              { value: "source", label: t("overviewControls.chartOptions.source") },
              { value: "rewardType", label: t("overviewControls.chartOptions.rewardType") },
              {
                value: "topPerformance",
                label: t("overviewControls.chartOptions.topPerformance"),
              },
            ]}
          />
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <Select
            label={t("overviewControls.activity")}
            value={queryState.activity}
            onChange={(value) =>
              replaceQuery({
                chart: queryState.chart,
                activity: value as typeof queryState.activity,
              })
            }
            options={[
              { value: "all", label: t("overviewControls.activityOptions.all") },
              { value: "reward", label: t("overviewControls.activityOptions.reward") },
              { value: "task", label: t("overviewControls.activityOptions.task") },
              {
                value: "submission",
                label: t("overviewControls.activityOptions.submission"),
              },
            ]}
          />
        </div>
      </div>
      <ReinforcementOverviewCharts
        overview={overview}
        focusedChart={queryState.chart}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr,1fr]">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {t("recentActivity")}
              </h3>
              <p className="text-sm text-gray-500">{t("recentActivitySubtitle")}</p>
            </div>
          </div>
          <div className="space-y-4">
            {filteredActivity.map((item) => {
              const Icon = activityIcons[item.type];

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">
                      {getLocalizedText(item.titleAr, item.titleEn)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {getLocalizedText(item.descriptionAr, item.descriptionEn)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{item.timestamp.slice(0, 10)}</div>
                </div>
              );
            })}
            {filteredActivity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                {t("overviewControls.emptyActivity")}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">
            {t("quickActions")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{t("quickActionsSubtitle")}</p>
          <div className="mt-4 space-y-3">
            {overview.quickActions.map((action) => (
              <Link
                key={action.id}
                href={`/${locale}${action.href}`}
                className="block rounded-lg border border-gray-100 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {getLocalizedText(action.titleAr, action.titleEn)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {getLocalizedText(action.descriptionAr, action.descriptionEn)}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
