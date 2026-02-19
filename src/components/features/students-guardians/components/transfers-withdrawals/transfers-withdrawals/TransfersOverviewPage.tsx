// FILE: src/components/students-guardians/transfers-withdrawals/TransfersOverviewPage.tsx

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import TransfersTrendChart from "./charts/TransfersTrendChart";
import TransfersByStageChart from "../../charts/TransfersByStageChart";
import TransfersByReasonChart from "./charts/TransfersByReasonChart";
import { getAllTransfers } from "@/services/transfersWithdrawalsService";

export default function TransfersOverviewPage() {
  const t = useTranslations("students_guardians.transfers_withdrawals");

  const allTransfers = useMemo(() => getAllTransfers(), []);

  // Calculate KPIs
  const transfersThisMonth = allTransfers.length;
  const internalTransfers = allTransfers.filter(
    (t) => t.type === "internal",
  ).length;
  const externalTransfers = allTransfers.filter(
    (t) => t.type === "external",
  ).length;
  const netChange = internalTransfers - externalTransfers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {t("transfers.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{t("transfers.subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("transfers.kpis.transfers_this_month")}
          value={transfersThisMonth}
          subtitle={t("transfers.kpis.total_transfers")}
          icon={ArrowLeftRight}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 8 },
            { label: "W2", value: 12 },
            { label: "W3", value: 10 },
            { label: "W4", value: transfersThisMonth },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("transfers.kpis.internal_transfers")}
          value={internalTransfers}
          subtitle={t("transfers.kpis.within_school")}
          icon={ArrowRight}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 5 },
            { label: "W2", value: 7 },
            { label: "W3", value: 6 },
            { label: "W4", value: internalTransfers },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("transfers.kpis.external_transfers")}
          value={externalTransfers}
          subtitle={t("transfers.kpis.to_other_schools")}
          icon={ArrowLeft}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 3 },
            { label: "W2", value: 5 },
            { label: "W3", value: 4 },
            { label: "W4", value: externalTransfers },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("transfers.kpis.net_change")}
          value={netChange >= 0 ? `+${netChange}` : netChange}
          subtitle={
            netChange >= 0
              ? t("transfers.kpis.net_positive")
              : t("transfers.kpis.net_negative")
          }
          icon={TrendingUp}
          iconColor={netChange >= 0 ? "#10b981" : "#ef4444"}
          iconBgColor={netChange >= 0 ? "#d1fae5" : "#fee2e2"}
          chartData={[
            { label: "W1", value: 2 },
            { label: "W2", value: 2 },
            { label: "W3", value: 2 },
            { label: "W4", value: Math.abs(netChange) },
          ]}
          chartColor={netChange >= 0 ? "#10b981" : "#ef4444"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TransfersTrendChart />
        </div>
        <TransfersByReasonChart />
      </div>

      <TransfersByStageChart />
    </div>
  );
}
