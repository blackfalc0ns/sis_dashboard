"use client";

import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import NedaaFilters from "@/features/nedaa/components/NedaaFilters";
import NedaaRequestsTable from "@/features/nedaa/components/NedaaRequestsTable";
import NedaaTimeline from "@/features/nedaa/components/NedaaTimeline";
import type {
  NedaaGate,
  NedaaGateId,
  NedaaRequest,
} from "@/features/nedaa/types/nedaa";
import { getNedaaGateLabel } from "@/features/nedaa/utils/nedaaPresentation";

interface NedaaHistoryViewProps {
  requests: NedaaRequest[];
  gates: NedaaGate[];
  selectedRequest: NedaaRequest | null;
  search: string;
  status: string;
  gate: string;
  gateOptions: NedaaGateId[];
  showFilters: boolean;
  hasActiveFilters: boolean;
  onOpenExport: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onGateChange: (value: string) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  onSelectRequest: (request: NedaaRequest) => void;
}

export default function NedaaHistoryView({
  requests,
  gates,
  selectedRequest,
  search,
  status,
  gate,
  gateOptions,
  showFilters,
  hasActiveFilters,
  onOpenExport,
  onSearchChange,
  onStatusChange,
  onGateChange,
  onToggleFilters,
  onClearFilters,
  onSelectRequest,
}: NedaaHistoryViewProps) {
  const locale = useLocale();
  const t = useTranslations("nedaa");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("history.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("history.subtitle")}</p>
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

      <NedaaFilters
        search={search}
        onSearchChange={onSearchChange}
        status={status}
        onStatusChange={onStatusChange}
        gate={gate}
        onGateChange={onGateChange}
        statusOptions={["completed", "cancelled"]}
        gateOptions={gateOptions}
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
        searchPlaceholder={t("filters.history_search_placeholder")}
        toggleTitle={t("history.filter_summary")}
        allStatusesLabel={t("filters.all_statuses")}
        allGatesLabel={t("filters.all_gates")}
        statusLabel={t("filters.status")}
        gateLabel={t("filters.gate")}
        filterButtonLabel={t("filters.show_filters")}
        clearFiltersLabel={t("filters.clear_filters")}
        gateLabelForValue={(value) => getNedaaGateLabel(value, gates, locale)}
        statusLabelForValue={(value) => t(`status.${value}`)}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr,1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("history.records")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("history.records_subtitle")}
            </p>
          </div>
          <NedaaRequestsTable
            requests={requests}
            gates={gates}
            mode="history"
            searchQuery={search}
            onRowClick={onSelectRequest}
          />
        </section>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("history.selected_request")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedRequest
                ? `${selectedRequest.id} • ${selectedRequest.studentName}`
                : t("history.no_selection")}
            </p>
          </div>
          <NedaaTimeline events={selectedRequest?.timeline || []} />
        </div>
      </div>
    </div>
  );
}
