// FILE: src/components/leads/LeadsList.tsx

"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Plus,
  Upload,
  Search,
  X,
  Users,
  UserCheck,
  Download,
} from "lucide-react";
import { DataTable, FilterPanel } from "@/components/ui";
import { KPICardV2 } from "@/components/ui/kpi-card";
import LeadStatusBadge from "@/features/admissions/leads/components/LeadStatusBadge";
import CreateLeadModal from "@/features/admissions/leads/components/CreateLeadModal";
import ImportLeadsModal from "@/features/admissions/leads/components/ImportLeadsModal";
import DateRangeFilter, {
  DateRangeValue,
} from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { formatLeadsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import {
  getLeads,
  createLead,
  convertLeadToApplication,
} from "@/features/admissions/leads/services/mockLeadsApi";
import { mockLeadConversations } from "@/data/mockLeadMessages";
import { Lead, LeadStatus, LeadChannel } from "@/features/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import MainLoader from "@/components/ui/loaders/MainLoader";
import {
  filterAdmissionsRecordsByDateContext,
  resolveAdmissionsContextScope,
} from "@/features/admissions/shared/utils/admissionsContextScope";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";

export default function LeadsList() {
  const router = useRouter();
  const t = useTranslations("admissions.leads");
  const t_grades = useTranslations("admissions.grades");
  const locale = useLocale();
  const { yearId, termId, isReadOnly, isLoading, error } =
    useAdmissionsYearTermContext();
  const [leads, setLeads] = useState<Lead[]>(getLeads());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const admissionsScope = useMemo(
    () => resolveAdmissionsContextScope(yearId, termId),
    [termId, yearId],
  );
  const scopedLeads = useMemo(
    () =>
      filterAdmissionsRecordsByDateContext(
        leads,
        (lead) => lead.createdAt,
        admissionsScope,
      ),
    [admissionsScope, leads],
  );
  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "status" | "channel" | "dateRange" | "startDate" | "endDate",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set(["all", "New", "Contacted", "Converted", "Closed"]);
      const validChannels = new Set(["all", "In-app", "Referral", "Walk-in", "Other"]);
      const validDateRanges = new Set(["all", "7", "14", "30", "60", "90", "custom"]);

      if (!validStatuses.has(values.status)) {
        updates.status = null;
      }
      if (!validChannels.has(values.channel)) {
        updates.channel = null;
      }
      if (!validDateRanges.has(values.dateRange)) {
        updates.dateRange = null;
      }
      if (values.dateRange !== "custom") {
        if (values.startDate) updates.startDate = null;
        if (values.endDate) updates.endDate = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, setValues, reset } = useAdmissionsUrlQueryState<{
    search: string;
    status: string;
    channel: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      status: "all",
      channel: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const statusFilter = values.status as LeadStatus | "all";
  const channelFilter = values.channel as LeadChannel | "all";
  const dateRange = values.dateRange as DateRangeValue;
  const customStartDate = values.startDate;
  const customEndDate = values.endDate;

  // Filter leads
  const filteredLeads = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return scopedLeads.filter((lead) => {
      const matchesSearch =
        searchQuery === "" ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        (lead.email &&
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      const matchesChannel =
        channelFilter === "all" || lead.channel === channelFilter;
      const matchesDateRange = isDateInRange(lead.createdAt, filterResult);

      return (
        matchesSearch && matchesStatus && matchesChannel && matchesDateRange
      );
    });
  }, [
    channelFilter,
    customEndDate,
    customStartDate,
    dateRange,
    scopedLeads,
    searchQuery,
    statusFilter,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // Filter leads by date range
    const leadsInRange = scopedLeads.filter((lead) =>
      isDateInRange(lead.createdAt, filterResult),
    );

    const contacted = leadsInRange.filter(
      (l) => l.status === "Contacted",
    ).length;
    const newLeads = leadsInRange.filter((l) => l.status === "New").length;
    const converted = leadsInRange.filter(
      (l) => l.status === "Converted",
    ).length;

    return {
      totalLeads: leadsInRange.length,
      contacted,
      newLeads,
      converted,
    };
  }, [customEndDate, customStartDate, dateRange, scopedLeads]);

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || channelFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleCreateLead = (data: Omit<Lead, "id" | "createdAt">) => {
    const newLead = createLead(data);
    setLeads(getLeads());
    setIsCreateModalOpen(false);
    alert(`Lead ${newLead.id} created successfully!`);
  };

  const handleImportLeads = (file: File) => {
    console.log("Importing file:", file.name);
    alert(`File "${file.name}" uploaded. Import functionality is a stub.`);
    setIsImportModalOpen(false);
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatLeadsForExport(filteredLeads, exportLocale),
      format,
      filenameBase: "leads",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_leads"),
    });
  };

  const handleRowClick = (lead: Lead) => {
    router.push(`/${locale}/admissions/leads/${lead.id}`);
  };

  const handleConvertToApplication = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Convert lead "${lead.name}" to application?`)) {
      const draft = convertLeadToApplication(lead.id);
      setLeads(getLeads());
      alert(`Lead converted! Application draft created: ${draft.id}`);
      router.push(`/${locale}/admissions/applications`);
    }
  };

  const columns = [
    {
      key: "id",
      label: t("lead_id"),
      searchable: true,
    },
    {
      key: "name",
      label: t("name"),
      searchable: true,
      render: (value: unknown, row: Lead) => {
        const conversation = mockLeadConversations.find(
          (conv) => conv.leadId === row.id,
        );
        const unreadCount = conversation?.unreadCount || 0;

        return (
          <div className="flex items-center gap-2">
            <span>{String(value)}</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "phone",
      label: t("phone"),
      searchable: true,
    },
    {
      key: "email",
      label: t("email"),
      render: (value: unknown) => (value ? String(value) : "—"),
    },
    {
      key: "channel",
      label: t("channel"),
      render: (value: unknown) => {
        const channel = String(value);
        // Map channel values to translation keys
        const channelMap: Record<string, string> = {
          "In-app": "in_app",
          Referral: "referral",
          "Walk-in": "walk_in",
          Other: "other",
        };
        const translationKey = channelMap[channel] || "other";
        return t(translationKey);
      },
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <LeadStatusBadge status={value as LeadStatus} />
      ),
    },
    {
      key: "gradeInterest",
      label: t("grade_interest"),
      render: (value: unknown) => {
        if (!value) return "—";
        const grade = String(value);
        // Convert grade to translation key (e.g., "Grade 6" -> "grade_6")
        const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
        const translated = t_grades(gradeKey);
        return translated !== gradeKey ? translated : grade;
      },
    },
    {
      key: "createdAt",
      label: t("created"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: Lead) => (
        <button
          onClick={(e) => handleConvertToApplication(row, e)}
          className="px-3 py-1 bg-primary hover:bg-hover text-white rounded text-xs font-medium transition-colors"
        >
          {t("convert")}
        </button>
      ),
    },
  ];

  if (isLoading) {
    return <MainLoader />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={(nextRange) => {
          const shouldResetCustom = nextRange !== "custom";
          setValues(
            {
              dateRange: nextRange,
              startDate: shouldResetCustom ? null : customStartDate || null,
              endDate: shouldResetCustom ? null : customEndDate || null,
            },
            "push",
          );
        }}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setValues(
            {
              dateRange: "custom",
              startDate: start || null,
              endDate: end || null,
            },
            "replace",
          );
        }}
        showAllTime={true}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={
            dateRange === "all"
              ? t("total_leads")
              : t("leads_period", {
                  period:
                    dateRange === "custom"
                      ? t("custom")
                      : t("days", { days: dateRange }),
                })
          }
          value={kpis.totalLeads}
          subtitle={t("in_selected_period")}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 20 },
            { label: "W2", value: 25 },
            { label: "W3", value: 30 },
            { label: "W4", value: kpis.totalLeads },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("new_leads")}
          value={kpis.newLeads}
          subtitle={t("not_yet_contacted")}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 8 },
            { label: "W2", value: 10 },
            { label: "W3", value: 12 },
            { label: "W4", value: kpis.newLeads },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("contacted")}
          value={kpis.contacted}
          subtitle={t("in_progress")}
          icon={UserCheck}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 10 },
            { label: "W2", value: 12 },
            { label: "W3", value: 15 },
            { label: "W4", value: kpis.contacted },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("converted")}
          value={kpis.converted}
          subtitle={t("became_applications")}
          icon={UserCheck}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 5 },
            { label: "W2", value: 7 },
            { label: "W3", value: 9 },
            { label: "W4", value: kpis.converted },
          ]}
          chartColor="#10b981"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("import_leads")}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("new_lead")}
          </button>
        </div>
      </div>

      {isReadOnly && <AdmissionsReadOnlyBanner />}

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
                {t("clear")}
              </button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setValue("status", e.target.value as LeadStatus | "all", "push")
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_statuses")}</option>
                <option value="New">{t("new")}</option>
                <option value="Contacted">{t("contacted")}</option>
                <option value="Converted">{t("converted")}</option>
                <option value="Closed">{t("closed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("channel")}
              </label>
              <select
                value={channelFilter}
                onChange={(e) =>
                  setValue("channel", e.target.value as LeadChannel | "all", "push")
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_channels")}</option>
                <option value="In-app">{t("in_app")}</option>
                <option value="Referral">{t("referral")}</option>
                <option value="Walk-in">{t("walk_in")}</option>
                <option value="Other">{t("other")}</option>
              </select>
            </div>
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
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_leads")}
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
          data={filteredLeads}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "leadsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Modals */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
      />
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImportLeads}
      />
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredLeads.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_leads")}
      />
    </div>
  );
}
