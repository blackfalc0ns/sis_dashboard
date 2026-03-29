"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import type { ReinforcementOverview } from "../types/reinforcement";
import { getReinforcementOverview } from "../services/reinforcementService";
import { useReinforcementLocale } from "../hooks/useReinforcementLocale";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementStatsGrid from "../components/shared/ReinforcementStatsGrid";
import ReinforcementOverviewCharts from "../components/charts/ReinforcementOverviewCharts";

interface ReinforcementOverviewPageProps {
  initialOverview?: ReinforcementOverview | null;
}

const activityIcons = {
  review: ShieldCheck,
  reward: Sparkles,
  task: ClipboardList,
  submission: ClipboardList,
};

export default function ReinforcementOverviewPage({
  initialOverview = null,
}: ReinforcementOverviewPageProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { getLocalizedText } = useReinforcementLocale();
  const [overview, setOverview] = useState<ReinforcementOverview | null>(
    initialOverview,
  );

  useEffect(() => {
    if (initialOverview) return;
    getReinforcementOverview().then(setOverview);
  }, [initialOverview]);

  if (!overview) {
    return <div className="rounded-xl bg-white p-6 shadow-sm">{t("loading")}</div>;
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("overview")}
        description={t("overviewDescription")}
      />

      <ReinforcementStatsGrid kpis={overview.kpis} />
      <ReinforcementOverviewCharts overview={overview} />

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
            {overview.recentActivity.map((item) => {
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
