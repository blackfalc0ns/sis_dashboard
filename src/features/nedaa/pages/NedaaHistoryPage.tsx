"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaGlobalExportModal from "@/features/nedaa/shared/components/export/NedaaGlobalExportModal";
import {
  fetchNedaaHistory,
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
  NedaaRequest,
  NedaaSettings,
} from "@/features/nedaa/types/nedaa";
import NedaaHistoryView from "@/features/nedaa/views/NedaaHistoryView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import {
  getNedaaGateLabel,
  getNedaaGateOptionIds,
} from "@/features/nedaa/utils/nedaaPresentation";

export default function NedaaHistoryPage() {
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
  } = useStudentsGuardiansYearTermContext();
  const canViewRequests = hasPermission("nedaa.requests.view");
  const [history, setHistory] = useState<NedaaRequest[]>([]);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gate, setGate] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
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
        const [nextHistory, nextSettings] = await Promise.all([
          fetchNedaaHistory({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setHistory(nextHistory);
          setSettings(nextSettings);
          setSelectedRequestId(nextHistory[0]?.id || null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_history_failed"),
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

  const gateOptions = useMemo(
    () =>
      getNedaaGateOptionIds(
        settings?.gates || [],
        history.map((request) => request.gate),
      ),
    [history, settings?.gates],
  );

  const filteredHistory = useMemo(
    () =>
      history.filter((request) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          normalizedSearch === "" ||
          request.id.toLowerCase().includes(normalizedSearch) ||
          request.studentName.toLowerCase().includes(normalizedSearch) ||
          request.guardianName.toLowerCase().includes(normalizedSearch);
        const matchesStatus = status === "all" || request.status === status;
        const matchesGate = gate === "all" || request.gate === gate;

        return matchesSearch && matchesStatus && matchesGate;
      }),
    [gate, history, search, status],
  );

  const selectedRequest = useMemo(
    () =>
      filteredHistory.find((request) => request.id === selectedRequestId) ||
      filteredHistory[0] ||
      null,
    [filteredHistory, selectedRequestId],
  );

  useEffect(() => {
    if (selectedRequest && selectedRequest.id !== selectedRequestId) {
      setSelectedRequestId(selectedRequest.id);
    }
  }, [selectedRequest, selectedRequestId]);

  const hasActiveFilters =
    search.trim() !== "" || status !== "all" || gate !== "all";

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
            { key: "updatedAt", label: "آخر تحديث" },
            { key: "canPickup", label: "يمكنه الاستلام" },
            { key: "canReceiveNotifications", label: "يستقبل الإشعارات" },
            { key: "timelineCount", label: "عدد أحداث السجل" },
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
            { key: "updatedAt", label: "Updated At" },
            { key: "canPickup", label: "Can Pickup" },
            { key: "canReceiveNotifications", label: "Can Receive Notifications" },
            { key: "timelineCount", label: "Timeline Events" },
          ];

    const rows = filteredHistory.map((request) => ({
      requestId: request.id,
      studentId: request.studentId,
      studentName: request.studentName,
      guardianId: request.guardianId,
      guardianName: request.guardianName,
      guardianRelation: request.guardianRelation,
      gate: getNedaaGateLabel(request.gate, settings.gates, locale),
      status: t(`status.${request.status}`),
      updatedAt: request.updatedAt,
      canPickup: request.canPickup ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No",
      canReceiveNotifications:
        request.canReceiveNotifications
          ? locale === "ar"
            ? "نعم"
            : "Yes"
          : locale === "ar"
            ? "لا"
            : "No",
      timelineCount: request.timeline.length,
    }));

    exportNedaaData({
      title: t("history.title"),
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        viewName: t("history.title"),
        exportDate: formatNedaaExportDate(locale),
      },
      filename: generateNedaaExportFilename("nedaa-history", termId),
      format,
      columns,
      rows,
        jsonData: {
          title: "Nedaa History",
          metadata: {
            yearName: academicYears.find((item) => item.id === yearId)?.nameEn || yearId || "",
            termName: selectedTerm?.nameEn || selectedTerm?.name || termId || "",
            viewName: "History",
            exportDate: formatNedaaExportDate("en"),
        },
        filters: { search, status, gate },
        requests: filteredHistory,
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
          {error || loadError || t("messages.load_history_failed")}
        </p>
      </div>
    );
  }

  return (
    <>
      <NedaaHistoryView
        requests={filteredHistory}
        gates={settings.gates}
        selectedRequest={selectedRequest}
        search={search}
        status={status}
        gate={gate}
        gateOptions={gateOptions}
        showFilters={showFilters}
        hasActiveFilters={hasActiveFilters}
        onOpenExport={() => setShowExportModal(true)}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onGateChange={setGate}
        onToggleFilters={() => setShowFilters((current) => !current)}
        onClearFilters={() => {
          setSearch("");
          setStatus("all");
          setGate("all");
        }}
        onSelectRequest={(request) => setSelectedRequestId(request.id)}
      />
      <NedaaGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={filteredHistory.length}
        emptyStateMessage={t("export.errors.noData")}
      />
    </>
  );
}
