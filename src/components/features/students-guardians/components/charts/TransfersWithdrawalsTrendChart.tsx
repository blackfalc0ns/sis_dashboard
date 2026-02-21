// FILE: src/components/students-guardians/charts/TransfersWithdrawalsTrendChart.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { LineChart } from "@mui/x-charts/LineChart";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

// TODO: Replace with actual API data
const mockMonthlyData = [
  { month: "Sep", transfers: 15, withdrawals: 8 },
  { month: "Oct", transfers: 12, withdrawals: 10 },
  { month: "Nov", transfers: 18, withdrawals: 7 },
  { month: "Dec", transfers: 10, withdrawals: 12 },
  { month: "Jan", transfers: 14, withdrawals: 9 },
  { month: "Feb", transfers: 12, withdrawals: 8 },
];

type Stage = "all" | "primary" | "preparatory" | "secondary";

export default function TransfersWithdrawalsTrendChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const [selectedStage, setSelectedStage] = useState<Stage>("all");

  // TODO: Filter data based on selected stage when API is integrated
  const chartData = useMemo(() => {
    // Currently returning all data, will filter by selectedStage when API is ready
    return mockMonthlyData;
  }, []);

  const months = chartData.map((d) => d.month);
  const transfers = chartData.map((d) => d.transfers);
  const withdrawals = chartData.map((d) => d.withdrawals);

  const stageOptions: DropdownItem[] = [
    { label: t("filters.all_stages"), value: "all" },
    { label: t("filters.stages.primary"), value: "primary" },
    { label: t("filters.stages.preparatory"), value: "preparatory" },
    { label: t("filters.stages.secondary"), value: "secondary" },
  ];

  return (
    <ChartCard
      title={t("charts.trend.title")}
      description={t("charts.trend.description")}
      periodOptions={stageOptions}
      defaultPeriod={selectedStage}
      onPeriodChange={(value) => setSelectedStage(value as Stage)}
      bgColor="#dbeafe"
    >
      <div className="w-full overflow-x-auto mt-4">
        <LineChart
          width={width}
          height={height}
          series={[
            {
              data: transfers,
              label: t("charts.trend.transfers"),
              color: "#036b80",
              curve: "linear",
            },
            {
              data: withdrawals,
              label: t("charts.trend.withdrawals"),
              color: "#ef4444",
              curve: "linear",
            },
          ]}
          xAxis={[
            {
              scaleType: "point",
              data: months,
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
