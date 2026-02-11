// FILE: src/components/leads/LeadsList.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Plus,
  Upload,
  Search,
  Filter,
  X,
  Users,
  UserCheck,
  Download,
} from "lucide-react";
import DataTable from "@/components/ui/common/DataTable";
import KPICard from "@/components/ui/common/KPICard";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";
import CreateLeadModal from "@/components/leads/CreateLeadModal";
import ImportLeadsModal from "@/components/leads/ImportLeadsModal";
import DateRangeFilter, {
  DateRangeValue,
} from "@/components/admissions/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { formatLeadsForExport } from "@/utils/admissionsExportUtils";
import {
  getLeads,
  createLead,
  convertLeadToApplication,
} from "@/api/mockLeadsApi";
import { Lead, LeadStatus, LeadChannel } from "@/types/leads";

export default function LeadsList() {
  const router = useRouter();
  const t = useTranslations("admissions.leads");
  const [leads, setLeads] = useState<Lead[]>(getLeads());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<LeadChannel | "all">(
    "all",
  );
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Filter leads
  const filteredLeads = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return leads.filter((lead) => {
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
      const matchesOwner = ownerFilter === "all" || lead.owner === ownerFilter;
      const matchesDateRange = isDateInRange(lead.createdAt, filterResult);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesChannel &&
        matchesOwner &&
        matchesDateRange
      );
    });
  }, [
    leads,
    searchQuery,
    statusFilter,
    channelFilter,
    ownerFilter,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // Filter leads by date range
    const leadsInRange = leads.filter((lead) =>
      isDateInRange(lead.createdAt, filterResult),
    );

    const contacted = leadsInRange.filter(
      (l) => l.status === "Contacted",
    ).length;
    const newLeads = leadsInRange.filter((l) => l.status === "New").length;

    return {
      totalLeads: leadsInRange.length,
      contacted,
      newLeads,
    };
  }, [leads, dateRange, customStartDate, customEndDate]);

  // Get unique owners
  const uniqueOwners = useMemo(() => {
    const owners = new Set(leads.map((lead) => lead.owner));
    return Array.from(owners).sort();
  }, [leads]);

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    channelFilter !== "all" ||
    ownerFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setChannelFilter("all");
    setOwnerFilter("all");
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

  const handleExport = () => {
    const formattedData = formatLeadsForExport(filteredLeads);
    const filename = generateFilename("leads", "csv");
    downloadCSV(formattedData, filename);
  };

  const handleRowClick = (lead: Lead) => {
    router.push(`/en/admissions/leads/${lead.id}`);
  };

  const handleConvertToApplication = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Convert lead "${lead.name}" to application?`)) {
      const draft = convertLeadToApplication(lead.id);
      setLeads(getLeads());
      alert(`Lead converted! Application draft created: ${draft.id}`);
      router.push(`/en/admissions/applications`);
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
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <LeadStatusBadge status={value as LeadStatus} />
      ),
    },
    {
      key: "owner",
      label: t("owner"),
    },
    {
      key: "gradeInterest",
      label: t("grade_interest"),
      render: (value: unknown) => (value ? String(value) : "—"),
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
          className="px-3 py-1 bg-[#036b80] hover:bg-[#024d5c] text-white rounded text-xs font-medium transition-colors"
        >
          {t("convert")}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        showAllTime={true}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
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
          icon={Users}
          numbers={t("in_selected_period")}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("new_leads")}
          value={kpis.newLeads}
          icon={Users}
          numbers={t("not_yet_contacted")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("contacted")}
          value={kpis.contacted}
          icon={UserCheck}
          numbers={t("in_progress")}
          iconBgColor="bg-amber-500"
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
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("import_leads")}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("new_lead")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                searchQuery
                  ? "border-[#036b80] ring-2 ring-[#036b80]/20"
                  : "border-gray-200"
              }`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              showFilters
                ? "bg-[#036b80] text-white"
                : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            {t("filters")}
          </button>
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

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as LeadStatus | "all")
                }
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("all_statuses")}</option>
                <option value="New">{t("new")}</option>
                <option value="Contacted">{t("contacted")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("channel")}
              </label>
              <select
                value={channelFilter}
                onChange={(e) =>
                  setChannelFilter(e.target.value as LeadChannel | "all")
                }
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("all_channels")}</option>
                <option value="In-app">{t("in_app")}</option>
                <option value="Referral">{t("referral")}</option>
                <option value="Walk-in">{t("walk_in")}</option>
                <option value="Other">{t("other")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("owner")}
              </label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("all_owners")}</option>
                {uniqueOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_leads")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[#036b80] hover:text-[#024d5c] font-medium text-sm"
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
    </div>
  );
}
