// FILE: src/components/students-guardians/charts/TransfersByStageChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";

// TODO: Replace with actual API data
const mockStageData = [
  { stage: "Primary", transfers: 25, withdrawals: 12 },
  { stage: "Preparatory", transfers: 18, withdrawals: 15 },
  { stage: "Secondary", transfers: 15, withdrawals: 10 },
];

export default function TransfersByStageChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();

  const stages = mockStageData.map((d) => t(`filters.stages.${d.stage.toLowerCase()}`));
  const transfers = mockStageData.map((d) => d.transfers);
  const withdrawals = mockStageData.map((d) => d.withdrawals);

  return (
    <ChartCard
      title={t("charts.by_stage.title")}
      description={t("charts.by_stage.description")}
      bgColor="#d1fae5"
    >
      <div className="w-full overflow-x-auto mt-4">
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
          xAxis={[
            {
              scaleType: "band",
              data: stages,
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          yAxis={[
            {
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
          slotProps={{
            legend: {
              labelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}
