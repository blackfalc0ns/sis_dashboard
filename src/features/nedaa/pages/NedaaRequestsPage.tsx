"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaGlobalExportModal from "@/features/nedaa/shared/components/export/NedaaGlobalExportModal";
import {
  fetchNedaaRequests,
  fetchNedaaSettings,
  updateNedaaRequestStatus,
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
  NedaaStatus,
} from "@/features/nedaa/types/nedaa";
import NedaaRequestsView from "@/features/nedaa/views/NedaaRequestsView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import {
  getNedaaGateLabel,
  getNedaaGateOptionIds,
} from "@/features/nedaa/utils/nedaaPresentation";

export default function NedaaRequestsPage() {
  const locale = useLocale();
  const t = useTranslations("nedaa");
  const { showSuccess, showError } = useToast();
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
  const canManageRequests = hasPermission("nedaa.requests.manage");
  const [requests, setRequests] = useState<NedaaRequest[]>([]);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gate, setGate] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
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
        const [nextRequests, nextSettings] = await Promise.all([
          fetchNedaaRequests({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setRequests(nextRequests);
          setSettings(nextSettings);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_requests_failed"),
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

  const visibleRequests = useMemo(
    () =>
      requests.filter((request) => {
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
    [gate, requests, search, status],
  );

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
            { key: "createdAt", label: "تاريخ الإنشاء" },
            { key: "updatedAt", label: "آخر تحديث" },
            { key: "canPickup", label: "يمكنه الاستلام" },
            { key: "canReceiveNotifications", label: "يستقبل الإشعارات" },
            { key: "note", label: "ملاحظة" },
            { key: "distanceMeters", label: "المسافة (متر)" },
            { key: "insideZone", label: "داخل النطاق" },
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
            { key: "updatedAt", label: "Updated At" },
            { key: "canPickup", label: "Can Pickup" },
            { key: "canReceiveNotifications", label: "Can Receive Notifications" },
            { key: "note", label: "Note" },
            { key: "distanceMeters", label: "Distance (Meters)" },
            { key: "insideZone", label: "Inside Zone" },
          ];

    const rows = visibleRequests.map((request) => ({
      requestId: request.id,
      studentId: request.studentId,
      studentName: request.studentName,
      guardianId: request.guardianId,
      guardianName: request.guardianName,
      guardianRelation: request.guardianRelation,
      gate: getNedaaGateLabel(request.gate, settings.gates, locale),
      status: t(`status.${request.status}`),
      createdAt: request.createdAt,
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
      note: request.note || "",
      distanceMeters: request.distanceMeters ?? "",
      insideZone:
        typeof request.insideZone === "boolean"
          ? request.insideZone
            ? locale === "ar"
              ? "نعم"
              : "Yes"
            : locale === "ar"
              ? "لا"
              : "No"
          : "",
    }));

    exportNedaaData({
      title: t("requests.title"),
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        viewName: t("requests.title"),
        exportDate: formatNedaaExportDate(locale),
      },
      filename: generateNedaaExportFilename("nedaa-requests", termId),
      format,
      columns,
      rows,
        jsonData: {
          title: "Nedaa Requests",
          metadata: {
            yearName: academicYears.find((item) => item.id === yearId)?.nameEn || yearId || "",
            termName: selectedTerm?.nameEn || selectedTerm?.name || termId || "",
            viewName: "Requests",
            exportDate: formatNedaaExportDate("en"),
        },
        filters: { search, status, gate },
        requests: visibleRequests,
      },
      locale,
      emptyMessage: t("export.errors.noData"),
    });
  };

  const gateOptions = useMemo(
    () =>
      getNedaaGateOptionIds(
        settings?.gates || [],
        requests.map((request) => request.gate),
      ),
    [requests, settings?.gates],
  );

  const handleStatusUpdate = async (
    requestId: string,
    nextStatus: NedaaStatus,
  ) => {
    if (!canManageRequests || isReadOnly) {
      return;
    }

    setPendingRequestId(requestId);
    try {
      const updatedRequest = await updateNedaaRequestStatus(requestId, nextStatus);
      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? updatedRequest : request,
        ),
      );
      showSuccess(t("messages.request_updated"));
    } catch {
      showError(t("messages.request_update_failed"));
    } finally {
      setPendingRequestId(null);
    }
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
          {error || loadError || t("messages.load_requests_failed")}
        </p>
      </div>
    );
  }

  return (
    <>
      <NedaaRequestsView
        requests={visibleRequests}
        gates={settings.gates}
        search={search}
        status={status}
        gate={gate}
        gateOptions={gateOptions}
        showFilters={showFilters}
        hasActiveFilters={hasActiveFilters}
        canManage={canManageRequests}
        manageNotice={!canManageRequests ? t("access.manage_notice") : null}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onGateChange={setGate}
        onToggleFilters={() => setShowFilters((current) => !current)}
        onClearFilters={() => {
          setSearch("");
          setStatus("all");
          setGate("all");
        }}
        onStatusUpdate={handleStatusUpdate}
        pendingRequestId={pendingRequestId}
        isReadOnly={isReadOnly}
        onOpenExport={() => setShowExportModal(true)}
      />
      <NedaaGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={visibleRequests.length}
        emptyStateMessage={t("export.errors.noData")}
      />
    </>
  );
}
