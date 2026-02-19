// FILE: src/components/students-guardians/charts/TransfersByStageChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { GraduationCap } from "lucide-react";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";

// TODO: Replace with actual API data
const mockStageData = [
  { stage: "Primary", transfers: 25, withdrawals: 12 },
  { stage: "Preparatory", transfers: 18, withdrawals: 15 },
  { stage: "Secondary", transfers: 15, withdrawals: 10 },
];

export default function TransfersByStageChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();

  const stages = mockStageData.map((d) => d.stage);
  const transfers = mockStageData.map((d) => d.transfers);
  const withdrawals = mockStageData.map((d) => d.withdrawals);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t("charts.by_stage.title")}
        </h2>
      </div>

      <div className="w-full overflow-x-auto">
        <BarChart
          width={width}
          height={height}
          series={[
            {
              data: transfers,
              label: t("charts.by_stage.transfers"),
              color: "#036b80",
              stack: "total",
            },
            {
              data: withdrawals,
              label: t("charts.by_stage.withdrawals"),
              color: "#ef4444",
              stack: "total",
            },
          ]}
          xAxis={[{ scaleType: "band", data: stages }]}
          margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
        />
      </div>
    </div>
  );
}
