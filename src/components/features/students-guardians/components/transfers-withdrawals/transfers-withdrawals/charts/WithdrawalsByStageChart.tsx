// FILE: src/components/students-guardians/transfers-withdrawals/charts/WithdrawalsByStageChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { BarChart3 } from "lucide-react";

export default function WithdrawalsByStageChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals.charts");

  // TODO: Replace with actual API data
  const stages = [
    t("stages.primary"),
    t("stages.preparatory"),
    t("stages.secondary"),
  ];
  const behaviorData = [3, 5, 4];
  const financialData = [2, 3, 2];
  const otherData = [4, 2, 3];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("by_stage.title")}
        </h3>
      </div>

      <BarChart
        height={300}
        series={[
          { data: behaviorData, label: t("behavior_related"), stack: "total" },
          {
            data: financialData,
            label: t("financial_related"),
            stack: "total",
          },
          { data: otherData, label: t("other_reasons"), stack: "total" },
        ]}
        xAxis={[{ scaleType: "band", data: stages }]}
      />
    </div>
  );
}
