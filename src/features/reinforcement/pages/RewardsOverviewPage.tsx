"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Gift,
  Package,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import {
  getRewardCatalogSummary,
  getRewardsOverview,
} from "../services/rewardDashboardService";

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

export default function RewardsOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [catalogSummary, setCatalogSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("reinforcement.rewards.view");

  const fetchData = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const [overviewData, summaryData] = await Promise.all([
        getRewardsOverview(),
        getRewardCatalogSummary(),
      ]);
      setOverview(overviewData);
      setCatalogSummary(summaryData);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : t("common.error"),
      );
    } finally {
      setLoading(false);
    }
  }, [canView, t]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <ReinforcementPageHeader
        title={t("rewardsModule.title")}
        description={t("rewardsModule.description")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={loading}
            onClick={fetchData}
          >
            {t("actions.refresh")}
          </Button>
        }
      />

      {/* Error state */}
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Loading state */}
      {loading && !overview ? (
        <MainLoader />
      ) : (
        <>
          {/* KPI Cards */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICardV2
              title={t("rewardsModule.overview.totalCatalogItems")}
              value={
                typeof (overview?.catalog as Record<string, unknown>)?.published === "number"
                  ? ((overview?.catalog as Record<string, unknown>)?.draft as number ?? 0) +
                    ((overview?.catalog as Record<string, unknown>)?.published as number ?? 0) +
                    ((overview?.catalog as Record<string, unknown>)?.archived as number ?? 0)
                  : 0
              }
              icon={Package}
              iconColor="#2563eb"
              iconBgColor="#dbeafe"
              showChart={false}
            />
            <KPICardV2
              title={t("rewardsModule.overview.activeItems")}
              value={
                typeof (overview?.catalog as Record<string, unknown>)?.published === "number"
                  ? (overview?.catalog as Record<string, unknown>)?.published as number
                  : 0
              }
              icon={CheckCircle}
              iconColor="#16a34a"
              iconBgColor="#dcfce7"
              showChart={false}
            />
            <KPICardV2
              title={t("rewardsModule.overview.pendingRedemptions")}
              value={
                typeof (overview?.redemptions as Record<string, unknown>)?.requested === "number"
                  ? (overview?.redemptions as Record<string, unknown>)?.requested as number
                  : 0
              }
              icon={Clock}
              iconColor="#d97706"
              iconBgColor="#fef3c7"
              showChart={false}
            />
            <KPICardV2
              title={t("rewardsModule.overview.fulfilledThisMonth")}
              value={
                typeof (overview?.redemptions as Record<string, unknown>)?.fulfilled === "number"
                  ? (overview?.redemptions as Record<string, unknown>)?.fulfilled as number
                  : 0
              }
              icon={Gift}
              iconColor="#7c3aed"
              iconBgColor="#ede9fe"
              showChart={false}
            />
          </section>

          {/* Catalog Summary */}
          {catalogSummary ? (
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.catalog.title")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("rewardsModule.status.draft")}
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-700">
                    {typeof (catalogSummary?.summary as Record<string, unknown>)?.draft === "number"
                      ? (catalogSummary?.summary as Record<string, unknown>)?.draft as number
                      : 0}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("rewardsModule.status.published")}
                  </div>
                  <div className="mt-1 text-lg font-bold text-emerald-600">
                    {typeof (catalogSummary?.summary as Record<string, unknown>)?.published === "number"
                      ? (catalogSummary?.summary as Record<string, unknown>)?.published as number
                      : 0}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("rewardsModule.status.archived")}
                  </div>
                  <div className="mt-1 text-lg font-bold text-amber-600">
                    {typeof (catalogSummary?.summary as Record<string, unknown>)?.archived === "number"
                      ? (catalogSummary?.summary as Record<string, unknown>)?.archived as number
                      : 0}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* Navigation Buttons */}
          <section className="flex flex-wrap gap-4">
            <Link href={`/${locale}/reinforcement/rewards/catalog`}>
              <Button leftIcon={<Package className="h-4 w-4" />}>
                {t("rewardsModule.catalog.title")}
              </Button>
            </Link>
            <Link href={`/${locale}/reinforcement/rewards/redemptions`}>
              <Button
                variant="secondary"
                leftIcon={<Gift className="h-4 w-4" />}
              >
                {t("rewardsModule.redemptions.title")}
              </Button>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
