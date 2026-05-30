// FILE: src/features/admissions/decisions/pages/DecisionsList.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { DataTable, FilterPanel } from "@/components/ui";
import { KPICardV2 } from "@/components/ui/kpi-card";
import { Decision, DecisionType } from "@/features/admissions/types/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import { formatVisibleDecisionsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import { fetchDecisions } from "@/features/admissions/decisions/services/decisionsApiService";
import { useToast } from "@/components/ui/toast/Toast";

export default function DecisionsList() {
  const t = useTranslations("admissions.decisions");
  const locale = useLocale();
  const { isReadOnly } = useAdmissionsYearTermContext();
  const { showToast } = useToast();

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadDecisions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchDecisions();
      setDecisions(data);
    } catch (err) {
      console.error("Failed to fetch decisions:", err);
      showToast("Failed to load decisions", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDecisions();
  }, [loadDecisions]);

  const normalizeQueryValues = useCallback(
    (values: Record<"search" | "decision", string>) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validDecisions = new Set(["all", "accept", "waitlist", "reject"]);

      if (!validDecisions.has(values.decision)) {
        updates.decision = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, reset } = useAdmissionsUrlQueryState<{
    search: string;
    decision: string;
  }>({
    defaults: {
      search: "",
      decision: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const decisionFilter = values.decision as DecisionType | "all";

  // Filter decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((decision) => {
      const matchesSearch =
        searchQuery === "" ||
        decision.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        decision.decidedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        decision.reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDecision =
        decisionFilter === "all" || decision.decision === decisionFilter;

      return matchesSearch && matchesDecision;
    });
  }, [decisions, searchQuery, decisionFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = decisions.length;
    const accepted = decisions.filter((d) => d.decision === "accept").length;
    const waitlisted = decisions.filter((d) => d.decision === "waitlist").length;
    const rejected = decisions.filter((d) => d.decision === "reject").length;
    const acceptanceRate =
      total > 0 ? ((accepted / total) * 100).toFixed(1) : "0.0";

    return { total, accepted, waitlisted, rejected, acceptanceRate };
  }, [decisions]);

  const columns = [
    { key: "applicationId", label: t("application_id"), searchable: true },
    {
      key: "decision",
      label: t("decision"),
      render: (value: unknown) => {
        const decision = value as DecisionType;
        const colors = {
          accept: "bg-green-100 text-green-700",
          waitlist: "bg-amber-100 text-amber-700",
          reject: "bg-red-100 text-red-700",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[decision]}`}
          >
            {decision === "accept" && t("accepted")}
            {decision === "waitlist" && t("waitlisted")}
            {decision === "reject" && t("rejected")}
          </span>
        );
      },
    },
    {
      key: "decisionDate",
      label: t("decision_date"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "-",
    },
    { key: "decidedBy", label: t("decided_by"), searchable: true },
    { key: "reason", label: t("reason") },
  ];

  const hasActiveFilters = searchQuery !== "" || decisionFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    const exportData = filteredDecisions.map((d) => ({
      ...d,
      studentName: "",
      grade: "",
    }));
    downloadAdmissionsExport({
      data: formatVisibleDecisionsForExport(exportData, exportLocale),
      format,
      filenameBase: "decisions",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_decisions"),
    });
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("total_decisions")}
          value={kpis.total}
          subtitle={`${kpis.acceptanceRate}% ${t("acceptance")}`}
          icon={CheckCircle}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 15 },
            { label: "W2", value: 18 },
            { label: "W3", value: 22 },
            { label: "W4", value: kpis.total },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("accepted")}
          value={kpis.accepted}
          subtitle={t("approved_applications")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 10 },
            { label: "W2", value: 12 },
            { label: "W3", value: 15 },
            { label: "W4", value: kpis.accepted },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("waitlisted")}
          value={kpis.waitlisted}
          subtitle={t("pending_final_decision")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 3 },
            { label: "W2", value: 4 },
            { label: "W3", value: 5 },
            { label: "W4", value: kpis.waitlisted },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("rejected")}
          value={kpis.rejected}
          subtitle={t("declined_applications")}
          icon={XCircle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "W1", value: 2 },
            { label: "W2", value: 2 },
            { label: "W3", value: 2 },
            { label: "W4", value: kpis.rejected },
          ]}
          chartColor="#ef4444"
        />
      </div>

      {isReadOnly && <AdmissionsReadOnlyBanner />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
      </div>

      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border placeholder:text-black/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200"
                }`}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                {t("clear_filters")}
              </button>
            )}
          </div>
        }
        filtersSlot={
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("decision")}
            </label>
            <select
              value={decisionFilter}
              onChange={(e) =>
                setValue(
                  "decision",
                  e.target.value as DecisionType | "all",
                  "push",
                )
              }
              className="w-full text-black max-w-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">{t("all_decisions")}</option>
              <option value="accept">{t("accept")}</option>
              <option value="waitlist">{t("waitlist")}</option>
              <option value="reject">{t("reject")}</option>
            </select>
          </div>
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={null}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="p-0 bg-transparent shadow-none"
      />

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">Loading decisions...</p>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_decisions")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:text-hover font-medium text-sm"
            >
              {t("clear_filters")}
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredDecisions as (Decision & { [key: string]: unknown })[]}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "decisionsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredDecisions.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_decisions")}
      />
    </div>
  );
}
