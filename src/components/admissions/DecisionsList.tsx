// FILE: src/components/admissions/DecisionsList.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import DataTable from "../ui/common/DataTable";
import KPICard from "../ui/common/KPICard";
import DecisionModal from "./DecisionModal";
import DateRangeFilter, { DateRangeValue } from "./DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { formatDecisionsForExport } from "@/utils/admissionsExportUtils";
import { mockApplications, mockDecisions } from "@/data/mockAdmissions";
import { Decision, DecisionType, Application } from "@/types/admissions";

export default function DecisionsList() {
  const t = useTranslations("admissions.decisions");
  const locale = useLocale();
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<DecisionType | "all">(
    "all",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Get applications with decisions by linking decisions array to applications
  const applicationsWithDecisions = useMemo(() => {
    return mockDecisions
      .map((decision) => {
        const application = mockApplications.find(
          (app) => app.id === decision.applicationId,
        );

        if (!application) {
          return null;
        }

        return {
          ...decision,
          studentName:
            locale === "ar"
              ? application.full_name_ar ||
                application.studentNameArabic ||
                application.studentName
              : application.full_name_en || application.studentName,
          grade: application.gradeRequested,
          application: application,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [locale]);

  // Filter and search decisions
  const filteredDecisions = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return applicationsWithDecisions.filter((decision) => {
      const matchesSearch =
        searchQuery === "" ||
        decision.studentName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        decision.applicationId
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        decision.decidedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDecision =
        decisionFilter === "all" || decision.decision === decisionFilter;
      const matchesDateRange = isDateInRange(
        decision.decisionDate,
        filterResult,
      );

      return matchesSearch && matchesDecision && matchesDateRange;
    });
  }, [
    applicationsWithDecisions,
    searchQuery,
    decisionFilter,
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

    const decisionsInRange = applicationsWithDecisions.filter((decision) =>
      isDateInRange(decision.decisionDate, filterResult),
    );

    const total = decisionsInRange.length;
    const accepted = decisionsInRange.filter(
      (d) => d.decision === "accept",
    ).length;
    const waitlisted = decisionsInRange.filter(
      (d) => d.decision === "waitlist",
    ).length;
    const rejected = decisionsInRange.filter(
      (d) => d.decision === "reject",
    ).length;

    const acceptanceRate =
      total > 0 ? ((accepted / total) * 100).toFixed(1) : "0.0";

    return { total, accepted, waitlisted, rejected, acceptanceRate };
  }, [applicationsWithDecisions, dateRange, customStartDate, customEndDate]);

  const columns = [
    { key: "applicationId", label: t("application_id"), searchable: true },
    { key: "studentName", label: t("student_name"), searchable: true },
    { key: "grade", label: t("grade") },
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
        new Date(value as string).toLocaleDateString(),
    },
    { key: "decidedBy", label: t("decided_by"), searchable: true },
    { key: "reason", label: t("reason") },
  ];

  const hasActiveFilters = searchQuery !== "" || decisionFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setDecisionFilter("all");
  };

  const handleRowClick = (
    decision: Decision & {
      studentName: string;
      application: Application;
      [key: string]: unknown;
    },
  ) => {
    setSelectedApplication(decision.application);
    setIsDecisionModalOpen(true);
  };

  const handleDecisionSubmit = (
    decision: DecisionType,
    reason: string,
    date: string,
  ) => {
    console.log("Decision made:", { decision, reason, date });
    alert(`Decision recorded: ${decision.toUpperCase()}`);
    setIsDecisionModalOpen(false);
  };

  const handleExport = () => {
    const formattedData = formatDecisionsForExport(
      mockApplications,
      mockDecisions,
    );
    const filename = generateFilename("decisions", "csv");
    downloadCSV(formattedData, filename);
  };

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
          title={t("total_decisions")}
          value={kpis.total}
          icon={CheckCircle}
          numbers={`${kpis.acceptanceRate}% ${t("acceptance")}`}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("accepted")}
          value={kpis.accepted}
          icon={CheckCircle}
          numbers={t("approved_applications")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("waitlisted")}
          value={kpis.waitlisted}
          icon={Clock}
          numbers={t("pending_final_decision")}
          iconBgColor="bg-amber-500"
        />
        <KPICard
          title={t("rejected")}
          value={kpis.rejected}
          icon={XCircle}
          numbers={t("declined_applications")}
          iconBgColor="bg-red-500"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
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
            {searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs text-[#036b80] font-medium">
                  {filteredDecisions.length} {t("found")}
                </span>
              </div>
            )}
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
              {t("clear_filters")}
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("decision")}
            </label>
            <select
              value={decisionFilter}
              onChange={(e) =>
                setDecisionFilter(e.target.value as DecisionType | "all")
              }
              className="w-full max-w-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
            >
              <option value="all">{t("all_decisions")}</option>
              <option value="accept">{t("accept")}</option>
              <option value="waitlist">{t("waitlist")}</option>
              <option value="reject">{t("reject")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredDecisions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_decisions")}
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
        <DataTable<
          Decision & {
            studentName: string;
            grade: string;
            application: Application;
            [key: string]: unknown;
          }
        >
          columns={columns}
          data={filteredDecisions}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
        />
      )}

      {/* Decision Modal */}
      {selectedApplication && (
        <DecisionModal
          application={selectedApplication}
          isOpen={isDecisionModalOpen}
          onClose={() => {
            setIsDecisionModalOpen(false);
            setSelectedApplication(null);
          }}
          onSubmit={handleDecisionSubmit}
        />
      )}
    </div>
  );
}
