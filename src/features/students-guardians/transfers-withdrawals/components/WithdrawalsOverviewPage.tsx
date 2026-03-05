// FILE: src/components/students-guardians/transfers-withdrawals/WithdrawalsOverviewPage.tsx

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { UserMinus, TrendingDown, AlertTriangle } from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import WithdrawalsTrendChart from "./charts/WithdrawalsTrendChart";
import WithdrawalsByStageChart from "./charts/WithdrawalsByStageChart";
import WithdrawalReasonsChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalReasonsChart";
import WithdrawalsByBehaviorChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalsByBehaviorChart";
import { getAllWithdrawals } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";

export default function WithdrawalsOverviewPage() {
  const t = useTranslations("students_guardians.transfers_withdrawals");

  const allWithdrawals = useMemo(() => getAllWithdrawals(), []);

  // Calculate KPIs
  const withdrawalsThisMonth = allWithdrawals.length;
  const dropoutRate = 3.2; // TODO: Calculate from actual data
  const behaviorRelated = allWithdrawals.filter(
    (w) => w.reason === "behavior",
  ).length;

  // Show alert if dropout rate exceeds threshold
  const dropoutThreshold = 5;
  const showDropoutAlert = dropoutRate > dropoutThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {t("withdrawals.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t("withdrawals.subtitle")}
        </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={t("withdrawals.kpis.withdrawals_this_month")}
          value={withdrawalsThisMonth}
          subtitle={t("withdrawals.kpis.total_withdrawals")}
          icon={UserMinus}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "W1", value: 12 },
            { label: "W2", value: 15 },
            { label: "W3", value: 18 },
            { label: "W4", value: withdrawalsThisMonth },
          ]}
          chartColor="#ef4444"
        />
        <KPICardV2
          title={t("withdrawals.kpis.dropout_rate")}
          value={`${dropoutRate}%`}
          subtitle={
            dropoutRate > dropoutThreshold
              ? t("withdrawals.kpis.above_threshold")
              : t("withdrawals.kpis.within_normal")
          }
          icon={TrendingDown}
          iconColor={dropoutRate > dropoutThreshold ? "#ef4444" : "#10b981"}
          iconBgColor={dropoutRate > dropoutThreshold ? "#fee2e2" : "#d1fae5"}
          chartData={[
            { label: "M1", value: 2.8 },
            { label: "M2", value: 3.1 },
            { label: "M3", value: 2.9 },
            { label: "M4", value: dropoutRate },
          ]}
          chartColor={dropoutRate > dropoutThreshold ? "#ef4444" : "#10b981"}
        />
        <KPICardV2
          title={t("withdrawals.kpis.behavior_related")}
          value={behaviorRelated}
          subtitle={t("withdrawals.kpis.low_behavior_score")}
          icon={AlertTriangle}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "W1", value: 3 },
            { label: "W2", value: 5 },
            { label: "W3", value: 4 },
            { label: "W4", value: behaviorRelated },
          ]}
          chartColor="#8b5cf6"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WithdrawalsTrendChart />
        <WithdrawalsByStageChart />
        <WithdrawalReasonsChart />
        <WithdrawalsByBehaviorChart />
      </div>
    </div>
  );
}
