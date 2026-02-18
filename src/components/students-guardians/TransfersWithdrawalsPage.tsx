// FILE: src/components/students-guardians/TransfersWithdrawalsPage.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  UserMinus,
  TrendingDown,
  AlertTriangle,
  Clock,
  Award,
  Plus,
} from "lucide-react";
import KPICard from "@/components/ui/common/KPICard";
import TransfersWithdrawalsTrendChart from "./charts/TransfersWithdrawalsTrendChart";
import TransfersByStageChart from "./charts/TransfersByStageChart";
import WithdrawalReasonsChart from "./charts/WithdrawalReasonsChart";
import WithdrawalsByBehaviorChart from "./charts/WithdrawalsByBehaviorChart";
import TransfersWithdrawalsTable from "./tables/TransfersWithdrawalsTable";
import CreateTransferWithdrawalModal from "./modals/CreateTransferWithdrawalModal";

// TODO: Replace with actual API integration
// Mock data for demonstration
const mockData = {
  transfersThisMonth: 12,
  withdrawalsThisMonth: 8,
  pendingRequests: 5,
  dropoutRate: 3.2,
  behaviorRelatedWithdrawals: 25, // percentage
};

export default function TransfersWithdrawalsPage() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calculate net change
  const netChange = mockData.transfersThisMonth - mockData.withdrawalsThisMonth;

  // Determine if dropout rate exceeds threshold
  const dropoutThreshold = 5;
  const showDropoutAlert = mockData.dropoutRate > dropoutThreshold;

  const handleCreateApplication = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={handleCreateApplication}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("create_application")}
        </button>
      </div>

      {/* Dropout Alert */}
      {showDropoutAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">
              {t("alerts.high_dropout_rate")}
            </p>
            <p className="text-sm text-red-700 mt-1">
              {t("alerts.dropout_message", { rate: mockData.dropoutRate })}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <KPICard
          title={t("kpis.transfers_this_month")}
          value={mockData.transfersThisMonth}
          icon={ArrowLeftRight}
          numbers={t("kpis.incoming_students")}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("kpis.withdrawals_this_month")}
          value={mockData.withdrawalsThisMonth}
          icon={UserMinus}
          numbers={t("kpis.outgoing_students")}
          iconBgColor="bg-red-500"
        />
        <KPICard
          title={t("kpis.net_change")}
          value={netChange >= 0 ? `+${netChange}` : netChange}
          icon={TrendingDown}
          numbers={t("kpis.transfers_minus_withdrawals")}
          iconBgColor={netChange >= 0 ? "bg-green-500" : "bg-orange-500"}
        />
        <KPICard
          title={t("kpis.dropout_rate")}
          value={`${mockData.dropoutRate}%`}
          icon={AlertTriangle}
          numbers={
            mockData.dropoutRate > dropoutThreshold
              ? t("kpis.above_threshold")
              : t("kpis.within_normal")
          }
          iconBgColor={
            mockData.dropoutRate > dropoutThreshold
              ? "bg-red-500"
              : "bg-green-500"
          }
        />
        <KPICard
          title={t("kpis.pending_requests")}
          value={mockData.pendingRequests}
          icon={Clock}
          numbers={t("kpis.awaiting_review")}
          iconBgColor="bg-yellow-500"
        />
        <KPICard
          title={t("kpis.behavior_related")}
          value={`${mockData.behaviorRelatedWithdrawals}%`}
          icon={Award}
          numbers={t("kpis.low_behavior_score")}
          iconBgColor="bg-purple-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-fr">
        <TransfersWithdrawalsTrendChart />
        <TransfersByStageChart />
        <WithdrawalReasonsChart />
        <WithdrawalsByBehaviorChart />
      </div>

      <TransfersWithdrawalsTable />

      {/* Create Application Modal */}
      {showCreateModal && (
        <CreateTransferWithdrawalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            console.log("Application submitted:", data);
            // TODO: Implement API call to create application
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
