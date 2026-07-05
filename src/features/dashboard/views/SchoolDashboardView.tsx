"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  MessageSquareWarning,
  RefreshCw,
  School,
  Settings2,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";

import ActivitiesCard from "../components/ActivitiesCard";
import FilterBar from "../components/FilterBar";
import QuickActionPanel from "../components/QuickActionPanel";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { SetupGuideCard } from "@/features/onboarding/components/SetupGuideCard";
import { DASHBOARD_ALERT_PREVIEW_LIMIT } from "@/features/dashboard/constants/dashboardPreviewLimits";
import { dashboardExportRowsFromViewModels } from "@/features/dashboard/mappers/dashboardViewMapper";
import type {
  DashboardActivityFeedViewModel,
  DashboardAlertsViewModel,
  DashboardDeferredFeature,
  DashboardModuleCard,
  DashboardModuleMetric,
  DashboardSetupItem,
  DashboardSummaryViewModel,
  DashboardTone,
  DashboardTopKpi,
  DashboardViewAlert,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import { LightModeDropdown } from "@/components/ui";

export type DashboardSectionState<TData> =
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; message: string };

interface SchoolDashboardViewProps {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  isRefreshing: boolean;
  onRefresh: () => void;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
}

interface DashboardHeaderProps {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  isRefreshing: boolean;
  locale: string;
  onRefresh: () => void;
  pathname: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  t: ReturnType<typeof useTranslations>;
}

type DashboardTab =
  | "overview"
  | "academics"
  | "admissions"
  | "communication"
  | "operations";

type DashboardTabDefinition = {
  id: DashboardTab;
  label: string;
};

const toneStyles: Record<
  DashboardTone,
  { border: string; bg: string; text: string; icon: string; dot: string }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
    dot: "bg-red-500",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-600",
    dot: "bg-amber-500",
  },
  info: {
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    icon: "text-cyan-700",
    dot: "bg-cyan-500",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  neutral: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-500",
    dot: "bg-gray-400",
  },
};

const moduleIcons: Record<DashboardModuleCard["id"], LucideIcon> = {
  admissions: UserCheck,
  students: Users,
  academics: GraduationCap,
  attendance: CheckCircle2,
  grades: BookOpen,
  homework: BookOpen,
  behavior: ShieldAlert,
  reinforcement: School,
  communication: MessageSquareWarning,
  settings: Settings2,
};

const dashboardTabs: DashboardTabDefinition[] = [
  { id: "overview", label: "Overview" },
  { id: "academics", label: "Academics" },
  { id: "admissions", label: "Admissions" },
  { id: "communication", label: "Communication" },
  { id: "operations", label: "Operations" },
];

const overviewModuleIds: DashboardModuleCard["id"][] = [
  "students",
  "admissions",
  "communication",
  "attendance",
  "behavior",
  "academics",
];

export default function SchoolDashboardView({
  activityFeedState,
  alertsState,
  isRefreshing,
  onRefresh,
  summaryState,
}: SchoolDashboardViewProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("dashboard_new");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  return (
    <div
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <LightModeDropdown />
      <DashboardHeader
        activityFeedState={activityFeedState}
        alertsState={alertsState}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        locale={locale}
        pathname={pathname}
        summaryState={summaryState}
        t={t}
      />

      <DashboardActionRow alertsState={alertsState} pathname={pathname} t={t} />

      <SetupGuideCard />

      <TopKpiGrid locale={locale} summaryState={summaryState} t={t} />

      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      <DashboardTabContent
        activeTab={activeTab}
        locale={locale}
        pathname={pathname}
        summaryState={summaryState}
        t={t}
      />

      <PersistentDashboardDetails
        activityFeedState={activityFeedState}
        alertsState={alertsState}
        locale={locale}
        pathname={pathname}
        summaryState={summaryState}
        t={t}
      />
    </div>
  );
}

function DashboardActionRow({
  alertsState,
  pathname,
  t,
}: {
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <ActionRequiredPanel
        alertsState={alertsState}
        pathname={pathname}
        t={t}
      />
      <QuickActionPanel />
    </section>
  );
}

function DashboardHeader({
  activityFeedState,
  alertsState,
  isRefreshing,
  locale,
  onRefresh,
  pathname,
  summaryState,
  t,
}: DashboardHeaderProps) {
  if (summaryState.status === "loading") {
    return (
      <header className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <DashboardPartialLoading label={t("dashboard.loading_summary")} />
      </header>
    );
  }

  if (summaryState.status === "error") {
    return (
      <header className="mb-5 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <SectionError
          title={t("dashboard.unavailable")}
          message={summaryState.message}
        />
      </header>
    );
  }

  const { context } = summaryState.data;
  const exportRows = dashboardExportRowsFromViewModels({
    summary: summaryState.data,
    alerts: alertsState.status === "success" ? alertsState.data : undefined,
    activityFeed:
      activityFeedState.status === "success"
        ? activityFeedState.data
        : undefined,
  });

  return (
    <header className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
            <School className="h-4 w-4" />
            {context.schoolName}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-gray-950">
            {t("dashboard.title")}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
            <span>
              {t("dashboard.academic_year", {
                value: context.academicYearName,
              })}
            </span>
            <span>{t("dashboard.term", { value: context.termName })}</span>
            <span>
              {t("dashboard.last_updated", {
                value: formattedGeneratedAt(
                  context.generatedAt,
                  context.timezone,
                  locale,
                ),
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={localizedPath(pathname, "/attendance/reports")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            {t("dashboard.reports")}
          </Link>
          <Link
            href={localizedPath(pathname, "/settings")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Settings2 className="h-4 w-4" />
            {t("dashboard.settings")}
          </Link>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-hover disabled:cursor-wait disabled:opacity-70"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t("dashboard.refresh")}
          </button>
          <FilterBar
            academicYearName={context.academicYearName}
            termName={context.termName}
            exportRows={exportRows}
          />
        </div>
      </div>
    </header>
  );
}

function ActionRequiredPanel({
  alertsState,
  pathname,
  t,
}: {
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (alertsState.status === "loading") {
    return (
      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <DashboardPartialLoading label={t("alerts_page.loading")} />
      </section>
    );
  }

  if (alertsState.status === "error") {
    return (
      <section className="mb-5 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <SectionError
          title={t("alerts_page.unavailable")}
          message={alertsState.message}
        />
      </section>
    );
  }

  const { alerts, summary: alertSummary } = alertsState.data;

  if (alerts.length === 0) {
    return <EmptyAlertState t={t} />;
  }

  const prioritizedAlerts = dashboardAlertsByPriority(alerts);
  const visibleAlerts = prioritizedAlerts.slice(
    0,
    DASHBOARD_ALERT_PREVIEW_LIMIT,
  );
  const actionAlerts = visibleAlerts.filter(hasAlertAction);
  const hasMoreAlerts =
    alertSummary.total > visibleAlerts.length ||
    prioritizedAlerts.length > visibleAlerts.length;

  return (
    <section className="mb-5 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
      <ActionRequiredHeader
        alertsHref={dashboardAlertsPath(pathname)}
        hasMoreAlerts={hasMoreAlerts}
        issueCount={alertSummary.total}
        t={t}
      />

      {actionAlerts.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actionAlerts.map((alertEntry) => (
            <Link
              key={alertEntry.id}
              href={localizedPath(pathname, alertEntry.actionTarget)}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-hover"
            >
              {alertEntry.actionLabel}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 divide-y divide-gray-100">
        {visibleAlerts.map((alertEntry) => (
          <ActionRequiredItem key={alertEntry.id} alertEntry={alertEntry} />
        ))}
      </div>
    </section>
  );
}

function EmptyAlertState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <section className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <div>
          <h2 className="text-sm font-semibold text-emerald-900">
            {t("dashboard.alerts.empty_title")}
          </h2>
          <p className="text-xs text-emerald-700">
            {t("dashboard.alerts.empty_description")}
          </p>
        </div>
      </div>
    </section>
  );
}

function ActionRequiredHeader({
  alertsHref,
  hasMoreAlerts,
  issueCount,
  t,
}: {
  alertsHref: string;
  hasMoreAlerts: boolean;
  issueCount: number;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-950">
            {t("dashboard.alerts.title")}
          </h2>
          <p className="mt-1 text-sm font-medium text-red-700">
            {t("dashboard.alerts.issue_count", { count: issueCount })}
          </p>
        </div>
      </div>
      {hasMoreAlerts ? (
        <Link
          href={alertsHref}
          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
        >
          {t("dashboard.alerts.view_all")}
        </Link>
      ) : null}
    </div>
  );
}

function ActionRequiredItem({
  alertEntry,
}: {
  alertEntry: DashboardViewAlert;
}) {
  const toneStyle = toneStyles[alertEntry.tone];

  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <span
          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${toneStyle.dot}`}
        />
        <div>
          <h3 className="text-sm font-bold text-gray-950">
            {alertEntry.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{alertEntry.description}</p>
        </div>
      </div>
    </article>
  );
}

function dashboardAlertsByPriority(
  alerts: DashboardViewAlert[],
): DashboardViewAlert[] {
  const priorityOrder: Record<DashboardViewAlert["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...alerts].sort((firstAlert, secondAlert) => {
    const severityDelta =
      priorityOrder[firstAlert.severity] - priorityOrder[secondAlert.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    const sourceDelta = firstAlert.source.localeCompare(secondAlert.source);
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return firstAlert.id.localeCompare(secondAlert.id);
  });
}

function hasAlertAction(
  alertEntry: DashboardViewAlert,
): alertEntry is DashboardViewAlert & {
  actionLabel: string;
  actionTarget: string;
} {
  return Boolean(alertEntry.actionLabel && alertEntry.actionTarget);
}

function DashboardTabs({
  activeTab,
  onTabChange,
  t,
}: {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="mb-5 overflow-x-auto">
      <div
        role="tablist"
        aria-label={t("dashboard.tabs.aria_label")}
        className="inline-flex min-w-full gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:min-w-0"
      >
        {dashboardTabs.map((dashboardTab) => {
          const isActive = dashboardTab.id === activeTab;

          return (
            <button
              key={dashboardTab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(dashboardTab.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              }`}
            >
              {t(`dashboard.tabs.${dashboardTab.id}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DashboardTabContent({
  activeTab,
  locale,
  pathname,
  summaryState,
  t,
}: {
  activeTab: DashboardTab;
  locale: string;
  pathname: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  t: ReturnType<typeof useTranslations>;
}) {
  if (summaryState.status === "loading") {
    return <ModuleCardGridSkeleton t={t} />;
  }

  if (summaryState.status === "error") {
    return (
      <section className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <SectionError
          title={t("dashboard.modules_unavailable")}
          message={summaryState.message}
        />
      </section>
    );
  }

  if (activeTab === "operations") {
    return (
      <ModuleCardGrid
        moduleCards={moduleCardsById(summaryState.data.moduleCards, [
          "reinforcement",
        ])}
        locale={locale}
        pathname={pathname}
        t={t}
      />
    );
  }

  return (
    <ModuleCardGrid
      moduleCards={moduleCardsById(
        summaryState.data.moduleCards,
        moduleIdsForTab(activeTab),
      )}
      locale={locale}
      pathname={pathname}
      t={t}
    />
  );
}

function PersistentDashboardDetails({
  activityFeedState,
  alertsState,
  locale,
  pathname,
  summaryState,
  t,
}: {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  locale: string;
  pathname: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  t: ReturnType<typeof useTranslations>;
}) {
  const deferredFeatures = dashboardDeferredFeaturesFromStates(
    summaryState,
    alertsState,
    activityFeedState,
  );

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <DashboardActivityPanel
        activityFeedState={activityFeedState}
        locale={locale}
        recentActivitiesHref={recentActivitiesPath(pathname)}
        t={t}
      />
      <DeferredFeatureList deferredFeatures={deferredFeatures} t={t} />
    </section>
  );
}

function DashboardActivityPanel({
  activityFeedState,
  locale,
  recentActivitiesHref,
  t,
}: {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  locale: string;
  recentActivitiesHref: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (activityFeedState.status === "loading") {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <DashboardPartialLoading label={t("activity_page.loading")} />
      </section>
    );
  }

  if (activityFeedState.status === "error") {
    return (
      <section className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <SectionError
          title={t("activity_page.unavailable")}
          message={activityFeedState.message}
        />
      </section>
    );
  }

  return (
    <ActivitiesCard
      activityFeed={activityFeedState.data}
      locale={locale}
      recentActivitiesHref={recentActivitiesHref}
    />
  );
}

function TopKpiGridSkeleton({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <section
      aria-label={t("dashboard.loading_kpis")}
      className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, skeletonIndex) => (
        <div
          key={skeletonIndex}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <DashboardPartialLoading label={t("dashboard.loading_kpis")} />
        </div>
      ))}
    </section>
  );
}

function ModuleCardGridSkeleton({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section
      aria-label={t("dashboard.loading_modules")}
      className="grid grid-cols-1 gap-4 xl:grid-cols-3"
    >
      {Array.from({ length: 3 }).map((_, skeletonIndex) => (
        <div
          key={skeletonIndex}
          className="min-h-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <DashboardPartialLoading label={t("dashboard.loading_modules")} />
        </div>
      ))}
    </section>
  );
}

function DashboardPartialLoading({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="flex min-h-32 flex-col items-center justify-center gap-3 text-sm font-medium text-gray-500"
    >
      <PartialLoader size={32} />
      <span>{label}</span>
    </div>
  );
}

function SectionError({ message, title }: { message: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-red-600">{title}</p>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  );
}

function dashboardDeferredFeaturesFromStates(
  summaryState: DashboardSectionState<DashboardSummaryViewModel>,
  alertsState: DashboardSectionState<DashboardAlertsViewModel>,
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>,
) {
  return [
    ...(summaryState.status === "success"
      ? summaryState.data.deferredFeatures
      : []),
    ...(alertsState.status === "success"
      ? alertsState.data.deferredFeatures
      : []),
    ...(activityFeedState.status === "success"
      ? activityFeedState.data.deferredFeatures
      : []),
  ];
}

function ModuleCardGrid({
  locale,
  moduleCards,
  pathname,
  t,
}: {
  locale: string;
  moduleCards: DashboardModuleCard[];
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {moduleCards.map((moduleCard) => (
        <ModuleSummaryCard
          key={moduleCard.id}
          locale={locale}
          moduleCard={moduleCard}
          pathname={pathname}
          t={t}
        />
      ))}
    </section>
  );
}

function moduleIdsForTab(activeTab: DashboardTab): DashboardModuleCard["id"][] {
  if (activeTab === "academics") {
    return ["academics", "grades", "homework"];
  }

  if (activeTab === "admissions") {
    return ["admissions"];
  }

  if (activeTab === "communication") {
    return ["communication"];
  }

  return overviewModuleIds;
}

function moduleCardsById(
  moduleCards: DashboardModuleCard[],
  moduleIds: DashboardModuleCard["id"][],
) {
  return moduleIds
    .map((moduleId) =>
      moduleCards.find((moduleCard) => moduleCard.id === moduleId),
    )
    .filter((moduleCard): moduleCard is DashboardModuleCard =>
      Boolean(moduleCard),
    );
}

function TopKpiGrid({
  locale,
  summaryState,
  t,
}: {
  locale: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  t: ReturnType<typeof useTranslations>;
}) {
  if (summaryState.status === "loading") {
    return <TopKpiGridSkeleton t={t} />;
  }

  if (summaryState.status === "error") {
    return (
      <section className="mb-5 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <SectionError
          title={t("dashboard.kpis_unavailable")}
          message={summaryState.message}
        />
      </section>
    );
  }

  return (
    <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryState.data.topKpis.map((topKpi) => (
        <TopKpiCard key={topKpi.id} locale={locale} topKpi={topKpi} t={t} />
      ))}
    </section>
  );
}

function TopKpiCard({
  locale,
  topKpi,
  t,
}: {
  locale: string;
  topKpi: DashboardTopKpi;
  t: ReturnType<typeof useTranslations>;
}) {
  const toneStyle = toneStyles[topKpi.tone];
  const numberLocale = locale === "ar" ? "ar-EG" : "en";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {t(`dashboard.top_kpis.${topKpi.id}.label`)}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-950">
            {topKpi.value.toLocaleString(numberLocale)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t(
              `dashboard.top_kpis.${topKpi.id}.subtitle`,
              topKpi.subtitleValues,
            )}
          </p>
        </div>
        <div
          className={`rounded-full border ${toneStyle.border} ${toneStyle.bg} p-2`}
        >
          <BarChart3 className={`h-4 w-4 ${toneStyle.icon}`} />
        </div>
      </div>
    </article>
  );
}

function ModuleSummaryCard({
  locale,
  moduleCard,
  pathname,
  t,
}: {
  locale: string;
  moduleCard: DashboardModuleCard;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = moduleIcons[moduleCard.id];
  const stateTone = moduleStateTone(moduleCard.state);
  const toneStyle = toneStyles[stateTone];

  return (
    <article className="flex min-h-[320px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg border ${toneStyle.border} ${toneStyle.bg} p-2`}
          >
            <Icon className={`h-5 w-5 ${toneStyle.icon}`} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-950">
              {t(`dashboard.modules.${moduleCard.id}.title`)}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {localizedModuleSummary(moduleCard, t)}
            </p>
          </div>
        </div>
        <ModuleStateBadge state={moduleCard.state} t={t} />
      </div>

      {moduleCard.setupItems ? (
        <SetupChecklist setupItems={moduleCard.setupItems} t={t} />
      ) : (
        <ModuleMetrics locale={locale} metrics={moduleCard.metrics} t={t} />
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {localizedModuleHighlights(moduleCard, t).map((highlight) => (
          <span
            key={highlight}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
          >
            {highlight}
          </span>
        ))}
      </div>

      {moduleCard.actionLabel && moduleCard.actionTarget ? (
        <Link
          href={localizedPath(pathname, moduleCard.actionTarget)}
          className="mt-auto pt-5 text-sm font-semibold text-primary-700 hover:text-hover"
        >
          {localizedModuleAction(moduleCard, t)}
        </Link>
      ) : null}
    </article>
  );
}

function ModuleMetrics({
  locale,
  metrics,
  t,
}: {
  locale: string;
  metrics: DashboardModuleMetric[];
  t: ReturnType<typeof useTranslations>;
}) {
  const numberLocale = locale === "ar" ? "ar-EG" : "en";

  return (
    <dl className="grid grid-cols-1 gap-2">
      {metrics.map((metricEntry) => {
        const toneStyle = toneStyles[metricEntry.tone];

        return (
          <div
            key={metricEntry.label}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
          >
            <dt className="text-sm text-gray-600">
              {localizedMetricLabel(metricEntry.label, t)}
            </dt>
            <dd className={`text-sm font-bold ${toneStyle.text}`}>
              {metricEntry.value.toLocaleString(numberLocale)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function SetupChecklist({
  setupItems,
  t,
}: {
  setupItems: DashboardSetupItem[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-2">
      {setupItems.map((setupItem) => {
        const isReady = setupItem.status === "ready";

        return (
          <div
            key={setupItem.label}
            className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2"
          >
            {isReady ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            ) : (
              <Clock3 className="mt-0.5 h-4 w-4 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {localizedSetupLabel(setupItem.label, t)}:{" "}
                {isReady
                  ? t("dashboard.setup.ready")
                  : t("dashboard.setup.not_configured")}
              </p>
              <p className="text-xs text-gray-500">
                {localizedSetupDetail(setupItem, t)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuleStateBadge({
  state,
  t,
}: {
  state: DashboardModuleCard["state"];
  t: ReturnType<typeof useTranslations>;
}) {
  const toneStyle = toneStyles[moduleStateTone(state)];

  return (
    <span
      className={`rounded-full border ${toneStyle.border} ${toneStyle.bg} px-2.5 py-1 text-xs font-semibold ${toneStyle.text}`}
    >
      {t(`dashboard.module_state.${state}`)}
    </span>
  );
}

function localizedModuleSummary(
  moduleCard: DashboardModuleCard,
  t: ReturnType<typeof useTranslations>,
) {
  const moduleValues = moduleTranslationValues(moduleCard);
  const summaryKey =
    moduleCard.id === "communication" && moduleValues.moderationReports > 0
      ? "warning"
      : moduleCard.state;

  return t(
    `dashboard.modules.${moduleCard.id}.summary.${summaryKey}`,
    moduleValues,
  );
}

function localizedModuleAction(
  moduleCard: DashboardModuleCard,
  t: ReturnType<typeof useTranslations>,
) {
  const actionKey =
    moduleCard.id === "communication" &&
    moduleTranslationValues(moduleCard).moderationReports > 0
      ? "review_moderation"
      : "default";

  return t(`dashboard.modules.${moduleCard.id}.action.${actionKey}`);
}

function localizedModuleHighlights(
  moduleCard: DashboardModuleCard,
  t: ReturnType<typeof useTranslations>,
) {
  const moduleValues = moduleTranslationValues(moduleCard);
  const highlightKeys = moduleHighlightKeys(moduleCard, moduleValues);

  return highlightKeys.map((highlightKey) =>
    t(
      `dashboard.modules.${moduleCard.id}.highlights.${highlightKey}`,
      moduleValues,
    ),
  );
}

function localizedMetricLabel(
  metricLabel: string,
  t: ReturnType<typeof useTranslations>,
) {
  const metricKey = metricLabelKey(metricLabel);
  return metricKey ? t(`dashboard.metrics.${metricKey}`) : metricLabel;
}

function localizedSetupLabel(
  setupLabel: string,
  t: ReturnType<typeof useTranslations>,
) {
  const setupKey = setupItemKey(setupLabel);
  return setupKey ? t(`dashboard.setup_items.${setupKey}.label`) : setupLabel;
}

function localizedSetupDetail(
  setupItem: DashboardSetupItem,
  t: ReturnType<typeof useTranslations>,
) {
  const setupKey = setupItemKey(setupItem.label);
  if (!setupKey) {
    return setupItem.detail;
  }

  return t(
    `dashboard.setup_items.${setupKey}.detail`,
    setupDetailValues(setupItem),
  );
}

function moduleTranslationValues(moduleCard: DashboardModuleCard) {
  return {
    openApplications: metricValue(moduleCard, "Open applications"),
    recentDecisions: metricValue(moduleCard, "Recent decisions"),
    moderationReports: metricValue(moduleCard, "Moderation reports"),
    withdrawnEnrollments: metricValue(moduleCard, "Withdrawn enrollments"),
    todaySessions: metricValue(moduleCard, "Today sessions"),
    activeAssessments: metricValue(moduleCard, "Active assessments"),
    publishedAssignments: metricValue(moduleCard, "Published assignments"),
    positiveRecords: metricValue(moduleCard, "Positive behavior"),
    negativeRecords: metricValue(moduleCard, "Negative behavior"),
    activeTasks: metricValue(moduleCard, "Active tasks"),
  };
}

function metricValue(moduleCard: DashboardModuleCard, metricLabel: string) {
  return (
    moduleCard.metrics.find((metricEntry) => metricEntry.label === metricLabel)
      ?.value ?? 0
  );
}

function moduleHighlightKeys(
  moduleCard: DashboardModuleCard,
  moduleValues: ReturnType<typeof moduleTranslationValues>,
) {
  if (moduleCard.id === "admissions") {
    return [
      moduleValues.openApplications > 0 ? "open_applications" : "",
      moduleValues.recentDecisions > 0 ? "recent_decisions" : "",
    ].filter(Boolean);
  }

  if (moduleCard.id === "communication") {
    return moduleValues.moderationReports > 0 ? ["moderation_reports"] : [];
  }

  if (moduleCard.id === "students") {
    return [
      moduleValues.withdrawnEnrollments > 0
        ? "withdrawn_exists"
        : "no_withdrawn",
    ];
  }

  if (moduleCard.id === "academics") {
    return [moduleCard.state === "setup" ? "setup_attention" : "setup_ready"];
  }

  if (moduleCard.id === "attendance") {
    return [moduleCard.state === "healthy" ? "active_today" : "none_today"];
  }

  if (moduleCard.id === "grades") {
    return [
      moduleValues.activeAssessments > 0
        ? "tracking_active"
        : "create_assessments",
    ];
  }

  if (moduleCard.id === "homework") {
    return [
      moduleValues.publishedAssignments > 0
        ? "assignments_active"
        : "create_assignments",
    ];
  }

  if (moduleCard.id === "behavior") {
    return ["positive", "negative"];
  }

  if (moduleCard.id === "reinforcement") {
    return ["active_tasks"];
  }

  return [];
}

function metricLabelKey(metricLabel: string) {
  const metricKeys: Record<string, string> = {
    "Total leads": "total_leads",
    "Open applications": "open_applications",
    Submitted: "submitted",
    Accepted: "accepted",
    "Pending tests": "pending_tests",
    "Pending interviews": "pending_interviews",
    "Recent decisions": "recent_decisions",
    "Active conversations": "active_conversations",
    "Active announcements": "active_announcements",
    "Moderation reports": "moderation_reports",
    "Recent messages": "recent_messages",
    "Active students": "active_students",
    "Active enrollments": "active_enrollments",
    Guardians: "guardians",
    "New enrollments": "new_enrollments",
    "Withdrawn enrollments": "withdrawn_enrollments",
    "Academic years": "academic_years",
    Terms: "terms",
    Stages: "stages",
    Grades: "grades",
    Sections: "sections",
    Classrooms: "classrooms",
    Subjects: "subjects",
    Rooms: "rooms",
    "Today sessions": "today_sessions",
    "Submitted today": "submitted_today",
    "Pending today": "pending_today",
    "Absent today": "absent_today",
    "Late today": "late_today",
    "Pending excuses": "pending_excuses",
    "Active assessments": "active_assessments",
    "Draft assessments": "draft_assessments",
    "Published assessments": "published_assessments",
    "Approved assessments": "approved_assessments",
    "Pending submissions": "pending_submissions",
    "Pending answer reviews": "pending_answer_reviews",
    "Draft assignments": "draft_assignments",
    "Published assignments": "published_assignments",
    "Closed assignments": "closed_assignments",
    "Waiting review": "waiting_review",
    "Reviewed submissions": "reviewed_submissions",
    "Grade sync pending": "grade_sync_pending",
    "Recent records": "recent_records",
    "Positive behavior": "positive_behavior",
    "Negative behavior": "negative_behavior",
    "Pending review": "pending_review",
    "Active tasks": "active_tasks",
    "Pending reviews": "pending_reviews",
    "Completed assignments": "completed_assignments",
    "Rewards pending": "rewards_pending",
  };

  return metricKeys[metricLabel];
}

function setupItemKey(setupLabel: string) {
  const setupKeys: Record<string, string> = {
    "Academic structure": "academic_structure",
    "Teacher allocations": "teacher_allocations",
    Curricula: "curricula",
    "Lesson plans": "lesson_plans",
    Timetable: "timetable",
  };

  return setupKeys[setupLabel];
}

function setupDetailValues(setupItem: DashboardSetupItem) {
  const numbers = setupItem.detail.match(/\d+/g)?.map(Number) ?? [];

  return {
    first: numbers[0] ?? 0,
    second: numbers[1] ?? 0,
  };
}

function DeferredFeatureList({
  deferredFeatures,
  t,
}: {
  deferredFeatures: DashboardDeferredFeature[];
  t: ReturnType<typeof useTranslations>;
}) {
  if (deferredFeatures.length === 0) {
    return null;
  }

  const shouldScrollVersionNotes = deferredFeatures.length > 7;

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-950">
        <BarChart3 className="h-5 w-5 text-gray-500" />
        {t("dashboard.version_notes")}
      </h2>
      <div
        className={`space-y-3 ${
          shouldScrollVersionNotes ? "max-h-[34rem] overflow-y-auto pr-2" : ""
        }`}
      >
        {deferredFeatures.map((feature) => (
          <div
            key={feature.id}
            className="rounded-lg border border-dashed border-gray-200 p-3"
          >
            <p className="text-sm font-semibold text-gray-800">
              {feature.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function moduleStateTone(state: DashboardModuleCard["state"]): DashboardTone {
  if (state === "warning" || state === "setup") {
    return "warning";
  }

  if (state === "healthy") {
    return "success";
  }

  return "neutral";
}

function formattedGeneratedAt(
  generatedAt: string,
  timezone: string,
  locale: string,
) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
      timeZoneName: "short",
    }).format(new Date(generatedAt));
  } catch {
    return generatedAt;
  }
}

function localizedPath(pathname: string, targetPath: string) {
  if (!targetPath.startsWith("/")) {
    return targetPath;
  }

  const localePrefix = localePathPrefix(pathname);
  if (!localePrefix || targetPath.startsWith(`${localePrefix}/`)) {
    return targetPath;
  }

  return `${localePrefix}${targetPath}`;
}

function localePathPrefix(pathname: string) {
  const firstPathSegment = pathname.split("/")[1];

  if (!firstPathSegment || !/^[a-z]{2}(-[A-Z]{2})?$/.test(firstPathSegment)) {
    return "";
  }

  return `/${firstPathSegment}`;
}

function recentActivitiesPath(pathname: string) {
  const normalizedPathname = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (normalizedPathname.endsWith("/dashboard")) {
    return `${normalizedPathname}/recent-activities`;
  }

  return "/dashboard/recent-activities";
}

function dashboardAlertsPath(pathname: string) {
  const normalizedPathname = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (normalizedPathname.endsWith("/dashboard")) {
    return `${normalizedPathname}/alerts`;
  }

  return "/dashboard/alerts";
}
