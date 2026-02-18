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
import KPICard from "@/components/ui/common/KPICard";
import TransfersTrendChart from "./charts/TransfersTrendChart";
import TransfersByStageChart from "../charts/TransfersByStageChart";
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
        <KPICard
          title={t("transfers.kpis.transfers_this_month")}
          value={transfersThisMonth}
          icon={ArrowLeftRight}
          numbers={t("transfers.kpis.total_transfers")}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("transfers.kpis.internal_transfers")}
          value={internalTransfers}
          icon={ArrowRight}
          numbers={t("transfers.kpis.within_school")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("transfers.kpis.external_transfers")}
          value={externalTransfers}
          icon={ArrowLeft}
          numbers={t("transfers.kpis.to_other_schools")}
          iconBgColor="bg-orange-500"
        />
        <KPICard
          title={t("transfers.kpis.net_change")}
          value={netChange >= 0 ? `+${netChange}` : netChange}
          icon={TrendingUp}
          numbers={
            netChange >= 0
              ? t("transfers.kpis.net_positive")
              : t("transfers.kpis.net_negative")
          }
          iconBgColor={netChange >= 0 ? "bg-emerald-500" : "bg-red-500"}
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
