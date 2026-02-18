// FILE: src/components/students-guardians/transfers-withdrawals/WithdrawalsTab.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  UserMinus,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Search,
  Filter,
  X,
} from "lucide-react";
import KPICard from "@/components/ui/common/KPICard";
import WithdrawalsTable from "./WithdrawalsTable";
import CreateWithdrawalModal from "./modals/CreateWithdrawalModal";
import WithdrawalsTrendChart from "./charts/WithdrawalsTrendChart";
import WithdrawalsByStageChart from "./charts/WithdrawalsByStageChart";
import WithdrawalReasonsChart from "../charts/WithdrawalReasonsChart";
import WithdrawalsByBehaviorChart from "../charts/WithdrawalsByBehaviorChart";
import type { WithdrawalsFilters as FiltersType } from "@/types/students/transfers-withdrawals";
import { filterWithdrawals } from "@/services/transfersWithdrawalsService";

export default function WithdrawalsTab() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersType>({
    stage: "all",
    reason: "all",
    status: "all",
    behaviorBand: "all",
    financialClearance: "all",
  });

  const filteredData = useMemo(
    () => filterWithdrawals({ ...filters, searchQuery }),
    [filters, searchQuery],
  );

  // Calculate KPIs
  const withdrawalsThisMonth = filteredData.length;
  const dropoutRate = 3.2; // TODO: Calculate from actual data
  const behaviorRelated = filteredData.filter(
    (w) => w.reason === "behavior",
  ).length;
  const financialPending = filteredData.filter(
    (w) => w.financialClearance === "pending",
  ).length;

  // Show alert if dropout rate exceeds threshold
  const dropoutThreshold = 5;
  const showDropoutAlert = dropoutRate > dropoutThreshold;

  const hasActiveFilters =
    searchQuery !== "" ||
    filters.stage !== "all" ||
    filters.reason !== "all" ||
    filters.status !== "all" ||
    filters.behaviorBand !== "all" ||
    filters.financialClearance !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      stage: "all",
      reason: "all",
      status: "all",
      behaviorBand: "all",
      financialClearance: "all",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("withdrawals.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("withdrawals.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("withdrawals.new_withdrawal")}
        </button>
      </div>

      {/* Dropout Alert */}
      {showDropoutAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">
              {t("withdrawals.alerts.high_dropout_rate")}
            </p>
            <p className="text-sm text-red-700 mt-1">
              {t("withdrawals.alerts.dropout_message", { rate: dropoutRate })}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("withdrawals.kpis.withdrawals_this_month")}
          value={withdrawalsThisMonth}
          icon={UserMinus}
          numbers={t("withdrawals.kpis.total_withdrawals")}
          iconBgColor="bg-red-500"
        />
        <KPICard
          title={t("withdrawals.kpis.dropout_rate")}
          value={`${dropoutRate}%`}
          icon={TrendingDown}
          numbers={
            dropoutRate > dropoutThreshold
              ? t("withdrawals.kpis.above_threshold")
              : t("withdrawals.kpis.within_normal")
          }
          iconBgColor={
            dropoutRate > dropoutThreshold ? "bg-red-500" : "bg-green-500"
          }
        />
        <KPICard
          title={t("withdrawals.kpis.behavior_related")}
          value={behaviorRelated}
          icon={AlertTriangle}
          numbers={t("withdrawals.kpis.low_behavior_score")}
          iconBgColor="bg-purple-500"
        />
        <KPICard
          title={t("withdrawals.kpis.financial_pending")}
          value={financialPending}
          icon={DollarSign}
          numbers={t("withdrawals.kpis.awaiting_clearance")}
          iconBgColor="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WithdrawalsTrendChart />
        <WithdrawalsByStageChart />
        <WithdrawalReasonsChart />
        <WithdrawalsByBehaviorChart />
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("filters.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-white border placeholder:text-black/60 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
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
            {t("filters.filters_button")}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Stage */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.stage")}
              </label>
              <select
                value={filters.stage || "all"}
                onChange={(e) =>
                  setFilters({ ...filters, stage: e.target.value as any })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("filters.all_stages")}</option>
                <option value="primary">{t("filters.stages.primary")}</option>
                <option value="preparatory">
                  {t("filters.stages.preparatory")}
                </option>
                <option value="secondary">
                  {t("filters.stages.secondary")}
                </option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.reason")}
              </label>
              <select
                value={filters.reason || "all"}
                onChange={(e) =>
                  setFilters({ ...filters, reason: e.target.value as any })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("filters.all_reasons")}</option>
                <option value="relocation">
                  {t("filters.reasons.relocation")}
                </option>
                <option value="financial">
                  {t("filters.reasons.financial")}
                </option>
                <option value="academic">
                  {t("filters.reasons.academic")}
                </option>
                <option value="behavior">
                  {t("filters.reasons.behavior")}
                </option>
                <option value="health">{t("filters.reasons.health")}</option>
                <option value="other">{t("filters.reasons.other")}</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.status")}
              </label>
              <select
                value={filters.status || "all"}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as any })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("filters.all_statuses")}</option>
                <option value="draft">{t("filters.statuses.draft")}</option>
                <option value="submitted">
                  {t("filters.statuses.submitted")}
                </option>
                <option value="under_review">
                  {t("filters.statuses.under_review")}
                </option>
                <option value="finance_clearance">
                  {t("filters.statuses.finance_clearance")}
                </option>
                <option value="behavior_review">
                  {t("filters.statuses.behavior_review")}
                </option>
                <option value="approved">
                  {t("filters.statuses.approved")}
                </option>
                <option value="rejected">
                  {t("filters.statuses.rejected")}
                </option>
                <option value="executed">
                  {t("filters.statuses.executed")}
                </option>
              </select>
            </div>

            {/* Behavior Band */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.behavior_band")}
              </label>
              <select
                value={filters.behaviorBand || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    behaviorBand: e.target.value as any,
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("filters.all_bands")}</option>
                <option value="low">{t("filters.behavior_bands.low")}</option>
                <option value="medium">
                  {t("filters.behavior_bands.medium")}
                </option>
                <option value="high">{t("filters.behavior_bands.high")}</option>
              </select>
            </div>

            {/* Financial Clearance */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.financial_clearance")}
              </label>
              <select
                value={filters.financialClearance || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    financialClearance: e.target.value as any,
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("filters.all_clearances")}</option>
                <option value="pending">
                  {t("filters.financial_clearances.pending")}
                </option>
                <option value="cleared">
                  {t("filters.financial_clearances.cleared")}
                </option>
                <option value="blocked">
                  {t("filters.financial_clearances.blocked")}
                </option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <WithdrawalsTable data={filteredData} />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWithdrawalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            console.log("Withdrawal created:", data);
            // TODO: Implement API call
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
