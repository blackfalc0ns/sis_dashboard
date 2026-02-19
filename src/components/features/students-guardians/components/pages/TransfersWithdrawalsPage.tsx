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
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import TransfersWithdrawalsTrendChart from "../charts/TransfersWithdrawalsTrendChart";
import TransfersByStageChart from "../charts/TransfersByStageChart";
import WithdrawalReasonsChart from "../charts/WithdrawalReasonsChart";
import WithdrawalsByBehaviorChart from "../charts/WithdrawalsByBehaviorChart";
import TransfersWithdrawalsTable from "../tables/TransfersWithdrawalsTable";
import CreateTransferWithdrawalModal from "../modals/CreateTransferWithdrawalModal";

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
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
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
        <KPICardV2
          title={t("kpis.transfers_this_month")}
          value={mockData.transfersThisMonth}
          subtitle={t("kpis.incoming_students")}
          icon={ArrowLeftRight}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 8 },
            { label: "W2", value: 10 },
            { label: "W3", value: 11 },
            { label: "W4", value: mockData.transfersThisMonth },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("kpis.withdrawals_this_month")}
          value={mockData.withdrawalsThisMonth}
          subtitle={t("kpis.outgoing_students")}
          icon={UserMinus}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "W1", value: 5 },
            { label: "W2", value: 6 },
            { label: "W3", value: 7 },
            { label: "W4", value: mockData.withdrawalsThisMonth },
          ]}
          chartColor="#ef4444"
        />
        <KPICardV2
          title={t("kpis.net_change")}
          value={netChange >= 0 ? `+${netChange}` : netChange}
          subtitle={t("kpis.transfers_minus_withdrawals")}
          icon={TrendingDown}
          iconColor={netChange >= 0 ? "#10b981" : "#f59e0b"}
          iconBgColor={netChange >= 0 ? "#d1fae5" : "#fef3c7"}
          chartData={[
            { label: "W1", value: 3 },
            { label: "W2", value: 4 },
            { label: "W3", value: 4 },
            { label: "W4", value: Math.abs(netChange) },
          ]}
          chartColor={netChange >= 0 ? "#10b981" : "#f59e0b"}
        />
        <KPICardV2
          title={t("kpis.dropout_rate")}
          value={`${mockData.dropoutRate}%`}
          subtitle={
            mockData.dropoutRate > dropoutThreshold
              ? t("kpis.above_threshold")
              : t("kpis.within_normal")
          }
          icon={AlertTriangle}
          iconColor={
            mockData.dropoutRate > dropoutThreshold ? "#ef4444" : "#10b981"
          }
          iconBgColor={
            mockData.dropoutRate > dropoutThreshold ? "#fee2e2" : "#d1fae5"
          }
          chartData={[
            { label: "M1", value: 2.8 },
            { label: "M2", value: 3.1 },
            { label: "M3", value: 2.9 },
            { label: "M4", value: mockData.dropoutRate },
          ]}
          chartColor={
            mockData.dropoutRate > dropoutThreshold ? "#ef4444" : "#10b981"
          }
        />
        <KPICardV2
          title={t("kpis.pending_requests")}
          value={mockData.pendingRequests}
          subtitle={t("kpis.awaiting_review")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 3 },
            { label: "W2", value: 4 },
            { label: "W3", value: 4 },
            { label: "W4", value: mockData.pendingRequests },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("kpis.behavior_related")}
          value={`${mockData.behaviorRelatedWithdrawals}%`}
          subtitle={t("kpis.low_behavior_score")}
          icon={Award}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "M1", value: 22 },
            { label: "M2", value: 24 },
            { label: "M3", value: 23 },
            { label: "M4", value: mockData.behaviorRelatedWithdrawals },
          ]}
          chartColor="#8b5cf6"
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
