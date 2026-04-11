"use client";

import {
  CheckCircle2,
  ClipboardList,
  Download,
  RadioTower,
  Workflow,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import NedaaFilters from "@/features/nedaa/components/NedaaFilters";
import NedaaRequestsTable from "@/features/nedaa/components/NedaaRequestsTable";
import type {
  NedaaGate,
  NedaaGateId,
  NedaaRequest,
  NedaaStatus,
} from "@/features/nedaa/types/nedaa";
import { getNedaaGateLabel } from "@/features/nedaa/utils/nedaaPresentation";

interface NedaaRequestsViewProps {
  requests: NedaaRequest[];
  gates: NedaaGate[];
  search: string;
  status: string;
  gate: string;
  gateOptions: NedaaGateId[];
  showFilters: boolean;
  hasActiveFilters: boolean;
  canManage?: boolean;
  manageNotice?: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onGateChange: (value: string) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  onStatusUpdate: (requestId: string, status: NedaaStatus) => void;
  pendingRequestId?: string | null;
  isReadOnly?: boolean;
  onOpenExport: () => void;
}

export default function NedaaRequestsView({
  requests,
  gates,
  search,
  status,
  gate,
  gateOptions,
  showFilters,
  hasActiveFilters,
  canManage = true,
  manageNotice = null,
  onSearchChange,
  onStatusChange,
  onGateChange,
  onToggleFilters,
  onClearFilters,
  onStatusUpdate,
  pendingRequestId = null,
  isReadOnly = false,
  onOpenExport,
}: NedaaRequestsViewProps) {
  const locale = useLocale();
  const t = useTranslations("nedaa");

  const totals = {
    visible: requests.length,
    pending: requests.filter((request) => request.status === "pending").length,
    ready: requests.filter((request) => request.status === "ready").length,
    completed: requests.filter((request) => request.status === "completed")
      .length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("requests.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("requests.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
        >
          <Download className="h-4 w-4" />
          {t("export.button")}
        </button>
      </div>

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("read_only_notice")}
        </div>
      ) : null}

      {!isReadOnly && !canManage && manageNotice ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {manageNotice}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICardV2
          title={t("kpis.total_visible_requests")}
          value={totals.visible}
          subtitle={t("requests.visible_subtitle")}
          icon={ClipboardList}
          iconColor="#2563eb"
          iconBgColor="#dbeafe"
          showChart={false}
        />
        <KPICardV2
          title={t("status.pending")}
          value={totals.pending}
          subtitle={t("requests.pending_subtitle")}
          icon={RadioTower}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          showChart={false}
        />
        <KPICardV2
          title={t("status.ready")}
          value={totals.ready}
          subtitle={t("requests.ready_subtitle")}
          icon={Workflow}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          showChart={false}
        />
        <KPICardV2
          title={t("status.completed")}
          value={totals.completed}
          subtitle={t("requests.completed_subtitle")}
          icon={CheckCircle2}
          iconColor="#16a34a"
          iconBgColor="#dcfce7"
          showChart={false}
        />
      </div>

      <NedaaFilters
        search={search}
        onSearchChange={onSearchChange}
        status={status}
        onStatusChange={onStatusChange}
        gate={gate}
        onGateChange={onGateChange}
        statusOptions={[
          "pending",
          "acknowledged",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        ]}
        gateOptions={gateOptions}
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
        searchPlaceholder={t("filters.search_placeholder")}
        toggleTitle={t("requests.filter_summary")}
        allStatusesLabel={t("filters.all_statuses")}
        allGatesLabel={t("filters.all_gates")}
        statusLabel={t("filters.status")}
        gateLabel={t("filters.gate")}
        filterButtonLabel={t("filters.show_filters")}
        clearFiltersLabel={t("filters.clear_filters")}
        gateLabelForValue={(value) => getNedaaGateLabel(value, gates, locale)}
        statusLabelForValue={(value) => t(`status.${value}`)}
      />

      <NedaaRequestsTable
        requests={requests}
        gates={gates}
        searchQuery={search}
        mode="operations"
        onStatusChange={onStatusUpdate}
        pendingRequestId={pendingRequestId}
        isReadOnly={isReadOnly || !canManage}
      />
    </div>
  );
}
