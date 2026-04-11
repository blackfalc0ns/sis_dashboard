"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import {
  fetchNedaaOverview,
  fetchNedaaSettings,
} from "@/features/nedaa/services/nedaaService";
import NedaaGlobalExportModal from "@/features/nedaa/shared/components/export/NedaaGlobalExportModal";
import {
  exportNedaaData,
  formatNedaaExportDate,
  generateNedaaExportFilename,
  type ExportColumn,
  type NedaaExportFormat,
} from "@/features/nedaa/shared/utils/nedaaExport";
import type {
  NedaaOverviewData,
  NedaaSettings,
} from "@/features/nedaa/types/nedaa";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaOverviewView from "@/features/nedaa/views/NedaaOverviewView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import {
  formatNedaaMinutes,
  getNedaaGateLabel,
} from "@/features/nedaa/utils/nedaaPresentation";

export default function NedaaOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("nedaa");
  const { hasPermission } = usePermissions();
  const {
    academicYears,
    terms,
    yearId,
    termId,
    isLoading: isContextLoading,
    error,
    isReadOnly,
  } =
    useStudentsGuardiansYearTermContext();
  const canViewOverview = hasPermission("nedaa.overview.view");
  const [overview, setOverview] = useState<NedaaOverviewData | null>(null);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDataset, setExportDataset] = useState<
    "summary" | "latest_requests" | "gates"
  >("summary");

  const selectedYearName =
    ((locale === "ar"
      ? academicYears.find((item) => item.id === yearId)?.nameAr
      : academicYears.find((item) => item.id === yearId)?.nameEn) ||
      academicYears.find((item) => item.id === yearId)?.nameEn ||
      yearId ||
      "");

  const selectedTerm = useMemo(
    () => terms.find((item) => item.id === termId) || null,
    [termId, terms],
  );

  const selectedTermName =
    (locale === "ar" ? selectedTerm?.nameAr : selectedTerm?.nameEn) ||
    selectedTerm?.nameEn ||
    selectedTerm?.nameAr ||
    selectedTerm?.name ||
    termId ||
    "";

  useEffect(() => {
    let cancelled = false;

    if (!canViewOverview || isContextLoading || !yearId || !termId) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [nextOverview, nextSettings] = await Promise.all([
          fetchNedaaOverview({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setOverview(nextOverview);
          setSettings(nextSettings);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_overview_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [canViewOverview, isContextLoading, t, termId, yearId]);

  if (!canViewOverview) {
    return <NedaaAccessNotice />;
  }

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !overview || !settings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_overview_failed")}
        </p>
      </div>
    );
  }

  const exportDatasetOptions = [
    {
      value: "summary",
      label: t("export.datasets.summary.title"),
      description: t("export.datasets.summary.description"),
    },
    {
      value: "latest_requests",
      label: t("export.datasets.latest_requests.title"),
      description: t("export.datasets.latest_requests.description"),
    },
    {
      value: "gates",
      label: t("export.datasets.gates.title"),
      description: t("export.datasets.gates.description"),
    },
  ];

  const datasetCount =
    exportDataset === "summary"
      ? 5
      : exportDataset === "latest_requests"
        ? overview.latestRequests.length
        : overview.gates.length;

  const handleExport = async (format: NedaaExportFormat) => {
    if (!settings) return;

    const metadata = {
      yearName: selectedYearName,
      termName: selectedTermName,
      viewName: t("overview.title"),
      datasetName: t(`export.datasets.${exportDataset}.title`),
      exportDate: formatNedaaExportDate(locale),
    };

    if (exportDataset === "summary") {
      const columns: ExportColumn[] =
        locale === "ar"
          ? [
              { key: "metric", label: "المؤشر" },
              { key: "value", label: "القيمة" },
              { key: "subtitle", label: "الوصف" },
            ]
          : [
              { key: "metric", label: "Metric" },
              { key: "value", label: "Value" },
              { key: "subtitle", label: "Subtitle" },
            ];

      const rows = [
        {
          metric: t("kpis.active_requests"),
          value: overview.stats.activeRequests,
          subtitle: t("overview.active_requests_subtitle"),
        },
        {
          metric: t("kpis.avg_pickup_time"),
          value: formatNedaaMinutes(overview.stats.avgPickupTimeMinutes, locale),
          subtitle: t("overview.avg_pickup_subtitle"),
        },
        {
          metric: t("kpis.completed_today"),
          value: overview.stats.completedToday,
          subtitle: t("overview.completed_today_subtitle"),
        },
        {
          metric: t("kpis.cancelled_today"),
          value: overview.stats.cancelledToday,
          subtitle: t("overview.cancelled_today_subtitle"),
        },
        {
          metric: t("kpis.blocked_attempts"),
          value: overview.stats.blockedAttempts,
          subtitle: t("overview.blocked_attempts_subtitle"),
        },
      ];

      exportNedaaData({
        title: t("overview.title"),
        metadata,
        filename: generateNedaaExportFilename("nedaa-overview-summary", termId),
        format,
        columns,
        rows,
        jsonData: {
          title: "Nedaa Overview Summary",
          metadata: {
            yearName: academicYears.find((item) => item.id === yearId)?.nameEn || yearId || "",
            termName: selectedTerm?.nameEn || selectedTerm?.name || termId || "",
            viewName: "Overview",
            datasetName: "summary",
            exportDate: formatNedaaExportDate("en"),
          },
          stats: overview.stats,
        },
        locale,
        emptyMessage: t("export.errors.noData"),
      });
      return;
    }

    if (exportDataset === "latest_requests") {
      const columns: ExportColumn[] =
        locale === "ar"
          ? [
              { key: "requestId", label: "رقم الطلب" },
              { key: "studentId", label: "رقم الطالب" },
              { key: "studentName", label: "الطالب" },
              { key: "guardianId", label: "رقم ولي الأمر" },
              { key: "guardianName", label: "ولي الأمر" },
              { key: "guardianRelation", label: "صلة القرابة" },
              { key: "gate", label: "البوابة" },
              { key: "status", label: "الحالة" },
              { key: "createdAt", label: "تاريخ الإنشاء" },
            ]
          : [
              { key: "requestId", label: "Request ID" },
              { key: "studentId", label: "Student ID" },
              { key: "studentName", label: "Student" },
              { key: "guardianId", label: "Guardian ID" },
              { key: "guardianName", label: "Guardian" },
              { key: "guardianRelation", label: "Relation" },
              { key: "gate", label: "Gate" },
              { key: "status", label: "Status" },
              { key: "createdAt", label: "Created At" },
            ];

      const rows = overview.latestRequests.map((request) => ({
        requestId: request.id,
        studentId: request.studentId,
        studentName: request.studentName,
        guardianId: request.guardianId,
        guardianName: request.guardianName,
        guardianRelation: request.guardianRelation,
        gate: getNedaaGateLabel(request.gate, settings.gates, locale),
        status: t(`status.${request.status}`),
        createdAt: request.createdAt,
      }));

      exportNedaaData({
        title: t("overview.latest_requests"),
        metadata,
        filename: generateNedaaExportFilename("nedaa-overview-latest-requests", termId),
        format,
        columns,
        rows,
        jsonData: {
          title: "Nedaa Overview Latest Requests",
          metadata: {
            yearName: academicYears.find((item) => item.id === yearId)?.nameEn || yearId || "",
            termName: selectedTerm?.nameEn || selectedTerm?.name || termId || "",
            viewName: "Overview",
            datasetName: "latest_requests",
            exportDate: formatNedaaExportDate("en"),
          },
          requests: overview.latestRequests,
        },
        locale,
        emptyMessage: t("export.errors.noData"),
      });
      return;
    }

    const columns: ExportColumn[] =
      locale === "ar"
        ? [
            { key: "gateId", label: "معرّف البوابة" },
            { key: "gateName", label: "البوابة" },
            { key: "waitingCount", label: "في الانتظار" },
            { key: "preparingCount", label: "قيد التحضير" },
            { key: "readyCount", label: "جاهز" },
            { key: "completedToday", label: "مكتمل اليوم" },
            { key: "avgHandlingTime", label: "متوسط وقت المعالجة" },
            { key: "activeRequests", label: "الطلبات النشطة" },
          ]
        : [
            { key: "gateId", label: "Gate ID" },
            { key: "gateName", label: "Gate" },
            { key: "waitingCount", label: "Waiting" },
            { key: "preparingCount", label: "Preparing" },
            { key: "readyCount", label: "Ready" },
            { key: "completedToday", label: "Completed Today" },
            { key: "avgHandlingTime", label: "Avg Handling Time" },
            { key: "activeRequests", label: "Active Requests" },
          ];

    const rows = overview.gates.map((gateStats) => ({
      gateId: gateStats.gate.id,
      gateName: locale === "ar" ? gateStats.gate.nameAr : gateStats.gate.nameEn,
      waitingCount: gateStats.waitingCount,
      preparingCount: gateStats.preparingCount,
      readyCount: gateStats.readyCount,
      completedToday: gateStats.completedToday,
      avgHandlingTime: formatNedaaMinutes(gateStats.avgHandlingTimeMinutes, locale),
      activeRequests: gateStats.activeRequests,
    }));

    exportNedaaData({
      title: t("overview.gate_summary"),
      metadata,
      filename: generateNedaaExportFilename("nedaa-overview-gates", termId),
      format,
      columns,
      rows,
      jsonData: {
        title: "Nedaa Overview Gates",
        metadata: {
          yearName: academicYears.find((item) => item.id === yearId)?.nameEn || yearId || "",
          termName: selectedTerm?.nameEn || selectedTerm?.name || termId || "",
          viewName: "Overview",
          datasetName: "gates",
          exportDate: formatNedaaExportDate("en"),
        },
        gates: overview.gates,
      },
      locale,
      emptyMessage: t("export.errors.noData"),
    });
  };

  return (
    <>
      <NedaaOverviewView
        overview={overview}
        gates={settings.gates}
        isReadOnly={isReadOnly}
        onOpenExport={() => setShowExportModal(true)}
      />
      <NedaaGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetOptions={exportDatasetOptions}
        selectedDataset={exportDataset}
        onDatasetChange={(value) =>
          setExportDataset(value as "summary" | "latest_requests" | "gates")
        }
        datasetCount={datasetCount}
        emptyStateMessage={t("export.errors.noData")}
      />
    </>
  );
}
