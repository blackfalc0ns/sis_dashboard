"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Download,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import Select from "@/components/ui/input/Select";
import ReinforcementOverviewCharts from "../components/charts/ReinforcementOverviewCharts";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementStatsGrid from "../components/shared/ReinforcementStatsGrid";
import { useReinforcementAcademicContext } from "../hooks/useReinforcementAcademicContext";
import { useReinforcementLocale } from "../hooks/useReinforcementLocale";
import type { ReinforcementOverview } from "../types/reinforcement";
import ReinforcementGlobalExportModal from "../shared/components/export/ReinforcementGlobalExportModal";
import {
  exportReinforcementData,
  formatReinforcementExportDate,
  generateReinforcementExportFilename,
  type ExportColumn,
  type ExportMetadata,
  type ReinforcementExportFormat,
} from "../shared/utils/reinforcementExport";
import { getReinforcementOverview } from "../services/reinforcementService";
import {
  buildReinforcementOverviewQueryState,
  parseReinforcementOverviewQueryState,
  type ReinforcementOverviewChartKey,
} from "../utils/reinforcementQueryState";

interface ReinforcementOverviewPageProps {
  initialOverview?: ReinforcementOverview | null;
}

const activityIcons = {
  reward: Sparkles,
  task: ClipboardList,
  submission: ClipboardList,
};

type ReinforcementOverviewExportDataset = "summary" | "activity" | "chart";

export default function ReinforcementOverviewPage({
  initialOverview = null,
}: ReinforcementOverviewPageProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("reinforcement");
  const tExport = useTranslations("reinforcement.export");
  const { getLocalizedText } = useReinforcementLocale();
  const { selectedAcademicYear, selectedTerm } =
    useReinforcementAcademicContext();
  const [overview, setOverview] = useState<ReinforcementOverview | null>(
    initialOverview,
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] =
    useState<ReinforcementOverviewExportDataset>("summary");

  const queryState = parseReinforcementOverviewQueryState(
    new URLSearchParams(searchParams.toString()),
  );

  useEffect(() => {
    if (initialOverview) return;
    getReinforcementOverview().then(setOverview);
  }, [initialOverview]);

  const filteredActivity = useMemo(() => {
    const items = overview?.recentActivity ?? [];
    return queryState.activity === "all"
      ? items
      : items.filter((item) => item.type === queryState.activity);
  }, [overview?.recentActivity, queryState.activity]);

  const formatDateTime = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value)),
    [locale],
  );

  const chartDatasetLabel = (chart: ReinforcementOverviewChartKey) => {
    if (chart === "status") return t("charts.tasksByStatus");
    if (chart === "source") return t("charts.tasksBySource");
    if (chart === "rewardType") return t("charts.rewardsByType");
    return t("charts.topPerformance");
  };

  const summaryRows = useMemo(
    () =>
      overview
        ? [
            { metric: t("kpi.inProgress"), value: overview.kpis.inProgress },
            { metric: t("kpi.notCompleted"), value: overview.kpis.notCompleted },
            {
              metric: t("kpi.completedThisWeek"),
              value: overview.kpis.completedThisWeek,
            },
            {
              metric: t("kpi.rewardedStudents"),
              value: overview.kpis.rewardedStudents,
            },
            {
              metric: t("kpi.averageCompletionRate"),
              value: `${overview.kpis.averageCompletionRate}%`,
            },
            {
              metric: t("kpi.totalRewardsIssued"),
              value: overview.kpis.totalRewardsIssued,
            },
          ]
        : [],
    [overview, t],
  );

  const summaryColumns = useMemo<ExportColumn[]>(
    () => [
      { key: "metric", label: locale === "ar" ? "المؤشر" : "Metric" },
      { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
    ],
    [locale],
  );

  const activityRows = useMemo(
    () =>
      filteredActivity.map((item) => ({
        title: getLocalizedText(item.titleAr, item.titleEn),
        alternateTitle: locale === "ar" ? item.titleEn : item.titleAr,
        description: getLocalizedText(item.descriptionAr, item.descriptionEn),
        alternateDescription:
          locale === "ar" ? item.descriptionEn : item.descriptionAr,
        type: t(`overviewControls.activityOptions.${item.type}`),
        timestamp: formatDateTime(item.timestamp),
      })),
    [filteredActivity, formatDateTime, getLocalizedText, locale, t],
  );

  const activityColumns = useMemo<ExportColumn[]>(
    () => [
      { key: "title", label: locale === "ar" ? "العنوان" : "Title" },
      {
        key: "alternateTitle",
        label: locale === "ar" ? "العنوان باللغة الأخرى" : "Alternate title",
      },
      { key: "description", label: locale === "ar" ? "الوصف" : "Description" },
      {
        key: "alternateDescription",
        label:
          locale === "ar" ? "الوصف باللغة الأخرى" : "Alternate description",
      },
      { key: "type", label: locale === "ar" ? "النوع" : "Type" },
      { key: "timestamp", label: locale === "ar" ? "الوقت" : "Timestamp" },
    ],
    [locale],
  );

  const chartRows = useMemo(() => {
    if (!overview) return [];

    if (queryState.chart === "status") {
      return overview.tasksByStatus.map((item) => ({
        label: t(`status.${item.id}`),
        value: item.value,
      }));
    }

    if (queryState.chart === "source") {
      return overview.tasksBySource.map((item) => ({
        label: t(`source.${item.id}`),
        value: item.value,
      }));
    }

    if (queryState.chart === "rewardType") {
      return overview.rewardsByType.map((item) => ({
        label: t(`rewardType.${item.id}`),
        value: item.value,
      }));
    }

    return [
      ...overview.topClasses.map((item) => ({
        group: locale === "ar" ? "الفصول" : "Classes",
        label: item.name,
        value: item.value,
      })),
      ...overview.topStudents.map((item) => ({
        group: locale === "ar" ? "الطلاب" : "Students",
        label: item.name,
        value: item.value,
      })),
    ];
  }, [locale, overview, queryState.chart, t]);

  const chartColumns = useMemo<ExportColumn[]>(
    () =>
      queryState.chart === "topPerformance"
        ? [
            { key: "group", label: locale === "ar" ? "المجموعة" : "Group" },
            { key: "label", label: locale === "ar" ? "الاسم" : "Name" },
            { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
          ]
        : [
            { key: "label", label: locale === "ar" ? "التصنيف" : "Label" },
            { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
          ],
    [locale, queryState.chart],
  );

  const datasetOptions = useMemo(
    () => [
      {
        value: "summary",
        label: tExport("datasets.summary.label"),
        description: tExport("datasets.summary.description"),
      },
      {
        value: "activity",
        label: tExport("datasets.activity.label"),
        description: tExport("datasets.activity.description"),
      },
      {
        value: "chart",
        label: tExport("datasets.chart.label"),
        description: tExport("datasets.chart.description"),
      },
    ],
    [tExport],
  );

  const selectedDatasetCount =
    selectedDataset === "summary"
      ? summaryRows.length
      : selectedDataset === "activity"
        ? activityRows.length
        : chartRows.length;

  const handleExport = async (format: ReinforcementExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: selectedAcademicYear?.name || undefined,
      termName: selectedTerm?.name || undefined,
      viewName: t("overview"),
      datasetName:
        selectedDataset === "summary"
          ? tExport("datasets.summary.label")
          : selectedDataset === "activity"
            ? tExport("datasets.activity.label")
            : chartDatasetLabel(queryState.chart),
      exportDate: formatReinforcementExportDate(locale),
    };

    if (selectedDataset === "summary") {
      exportReinforcementData({
        title: t("overview"),
        metadata,
        filename: generateReinforcementExportFilename(
          "reinforcement-overview-summary",
          selectedTerm?.id,
        ),
        format,
        columns: summaryColumns,
        rows: summaryRows,
        jsonData: {
          title: "Reinforcement Overview Summary",
          metadata: {
            yearName: selectedAcademicYear?.name || null,
            termName: selectedTerm?.name || null,
            exportDate: formatReinforcementExportDate("en"),
          },
          dataset: "summary",
          kpis: overview?.kpis || null,
        },
        locale,
        emptyMessage: tExport("errors.noData"),
      });
      return;
    }

    if (selectedDataset === "activity") {
      exportReinforcementData({
        title: t("recentActivity"),
        metadata,
        filename: generateReinforcementExportFilename(
          "reinforcement-overview-activity",
          selectedTerm?.id,
        ),
        format,
        columns: activityColumns,
        rows: activityRows,
        jsonData: {
          title: "Reinforcement Recent Activity",
          metadata: {
            yearName: selectedAcademicYear?.name || null,
            termName: selectedTerm?.name || null,
            exportDate: formatReinforcementExportDate("en"),
          },
          dataset: "activity",
          filter: queryState.activity,
          activity: filteredActivity.map((item) => ({
            id: item.id,
            titleEn: item.titleEn,
            titleAr: item.titleAr,
            descriptionEn: item.descriptionEn,
            descriptionAr: item.descriptionAr,
            timestamp: item.timestamp,
            type: item.type,
          })),
        },
        locale,
        emptyMessage: tExport("errors.noData"),
      });
      return;
    }

    exportReinforcementData({
      title: chartDatasetLabel(queryState.chart),
      metadata,
      filename: generateReinforcementExportFilename(
        "reinforcement-overview-chart",
        selectedTerm?.id,
      ),
      format,
      columns: chartColumns,
      rows: chartRows,
      jsonData: {
        title: "Reinforcement Overview Chart",
        metadata: {
          yearName: selectedAcademicYear?.name || null,
          termName: selectedTerm?.name || null,
          exportDate: formatReinforcementExportDate("en"),
        },
        dataset: "chart",
        chart: queryState.chart,
        data:
          queryState.chart === "status"
            ? overview?.tasksByStatus || []
            : queryState.chart === "source"
              ? overview?.tasksBySource || []
              : queryState.chart === "rewardType"
                ? overview?.rewardsByType || []
                : {
                    topClasses: overview?.topClasses || [],
                    topStudents: overview?.topStudents || [],
                  },
      },
      locale,
      emptyMessage: tExport("errors.noData"),
    });
  };

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

  if (!overview) {
    return <MainLoader />;
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("overview")}
        description={t("overviewDescription")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setIsExportModalOpen(true)}
          >
            {tExport("button")}
          </Button>
        }
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
              {
                value: "rewardType",
                label: t("overviewControls.chartOptions.rewardType"),
              },
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
                  <div className="text-xs text-gray-400">
                    {item.timestamp.slice(0, 10)}
                  </div>
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
                      {getLocalizedText(
                        action.descriptionAr,
                        action.descriptionEn,
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ReinforcementGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("overviewDescription")}
        datasetOptions={datasetOptions}
        selectedDataset={selectedDataset}
        onDatasetChange={(value) =>
          setSelectedDataset(value as ReinforcementOverviewExportDataset)
        }
        datasetCount={selectedDatasetCount}
        emptyStateMessage={tExport("errors.noData")}
      />
    </div>
  );
}
