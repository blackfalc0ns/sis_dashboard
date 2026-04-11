"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaGlobalExportModal from "@/features/nedaa/shared/components/export/NedaaGlobalExportModal";
import {
  fetchNedaaGateBoard,
  fetchNedaaRequests,
  fetchNedaaSettings,
} from "@/features/nedaa/services/nedaaService";
import {
  exportNedaaData,
  formatNedaaExportDate,
  generateNedaaExportFilename,
  type ExportColumn,
  type NedaaExportFormat,
} from "@/features/nedaa/shared/utils/nedaaExport";
import type {
  NedaaGateStats,
  NedaaRequest,
  NedaaSettings,
} from "@/features/nedaa/types/nedaa";
import {
  formatNedaaMinutes,
  getNedaaGateLabel,
  isNedaaActiveStatus,
} from "@/features/nedaa/utils/nedaaPresentation";
import NedaaGatesView from "@/features/nedaa/views/NedaaGatesView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaGatesPage() {
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
  } = useStudentsGuardiansYearTermContext();
  const canViewRequests = hasPermission("nedaa.requests.view");
  const [gates, setGates] = useState<NedaaGateStats[]>([]);
  const [requests, setRequests] = useState<NedaaRequest[]>([]);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!canViewRequests || isContextLoading || !yearId || !termId) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [nextGates, nextRequests, nextSettings] = await Promise.all([
          fetchNedaaGateBoard({ yearId, termId }),
          fetchNedaaRequests({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setGates(nextGates);
          setRequests(nextRequests);
          setSettings(nextSettings);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_gates_failed"),
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
  }, [canViewRequests, isContextLoading, t, termId, yearId]);

  const activeRequests = useMemo(
    () => requests.filter((request) => isNedaaActiveStatus(request.status)),
    [requests],
  );

  const selectedYearName =
    ((locale === "ar"
      ? academicYears.find((item) => item.id === yearId)?.nameAr
      : academicYears.find((item) => item.id === yearId)?.nameEn) ||
      academicYears.find((item) => item.id === yearId)?.nameEn ||
      yearId ||
      "");
  const selectedTerm = terms.find((item) => item.id === termId) || null;
  const selectedTermName =
    (locale === "ar" ? selectedTerm?.nameAr : selectedTerm?.nameEn) ||
    selectedTerm?.nameEn ||
    selectedTerm?.nameAr ||
    selectedTerm?.name ||
    termId ||
    "";

  const handleExport = async (format: NedaaExportFormat) => {
    if (!settings) return;

    const gateColumns: ExportColumn[] =
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

    const requestColumns: ExportColumn[] =
      locale === "ar"
        ? [
            { key: "requestId", label: "رقم الطلب" },
            { key: "studentName", label: "الطالب" },
            { key: "guardianName", label: "ولي الأمر" },
            { key: "gate", label: "البوابة" },
            { key: "status", label: "الحالة" },
            { key: "createdAt", label: "تاريخ الإنشاء" },
          ]
        : [
            { key: "requestId", label: "Request ID" },
            { key: "studentName", label: "Student" },
            { key: "guardianName", label: "Guardian" },
            { key: "gate", label: "Gate" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Created At" },
          ];

    const gateRows = gates.map((gateStats) => ({
      gateId: gateStats.gate.id,
      gateName: locale === "ar" ? gateStats.gate.nameAr : gateStats.gate.nameEn,
      waitingCount: gateStats.waitingCount,
      preparingCount: gateStats.preparingCount,
      readyCount: gateStats.readyCount,
      completedToday: gateStats.completedToday,
      avgHandlingTime: formatNedaaMinutes(gateStats.avgHandlingTimeMinutes, locale),
      activeRequests: gateStats.activeRequests,
    }));

    const activeRequestRows = activeRequests.map((request) => ({
      requestId: request.id,
      studentName: request.studentName,
      guardianName: request.guardianName,
      gate: getNedaaGateLabel(request.gate, settings.gates, locale),
      status: t(`status.${request.status}`),
      createdAt: request.createdAt,
    }));

    exportNedaaData({
      title: t("gates_page.title"),
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        viewName: t("gates_page.title"),
        exportDate: formatNedaaExportDate(locale),
      },
      filename: generateNedaaExportFilename("nedaa-gates", termId),
      format,
      sections: [
        {
          title: t("overview.gate_summary"),
          columns: gateColumns,
          rows: gateRows,
        },
        {
          title: t("gates_page.live_queue"),
          columns: requestColumns,
          rows: activeRequestRows,
        },
      ],
        jsonData: {
          title: "Nedaa Gates",
          metadata: {
            yearName: academicYears.find((item) => item.id === yearId)?.nameEn || yearId || "",
            termName: selectedTerm?.nameEn || selectedTerm?.name || termId || "",
            viewName: "Gates",
            exportDate: formatNedaaExportDate("en"),
        },
        gateBoard: gates,
        activeRequests,
      },
      locale,
      emptyMessage: t("export.errors.noData"),
    });
  };

  if (!canViewRequests) {
    return <NedaaAccessNotice />;
  }

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !settings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_gates_failed")}
        </p>
      </div>
    );
  }

  return (
    <>
      <NedaaGatesView
        gates={gates}
        activeRequests={activeRequests}
        requestGates={settings.gates}
        isReadOnly={isReadOnly}
        onOpenExport={() => setShowExportModal(true)}
      />
      <NedaaGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={gates.length + activeRequests.length}
        emptyStateMessage={t("export.errors.noData")}
      />
    </>
  );
}
