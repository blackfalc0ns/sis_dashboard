// FILE: src/components/students-guardians/charts/WithdrawalReasonsChart.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PieChart } from "@mui/x-charts/PieChart";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

type Stage = "all" | "primary" | "preparatory" | "secondary";

export default function WithdrawalReasonsChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width } = useResponsiveChart();
  const [selectedStage, setSelectedStage] = useState<Stage>("all");

  // TODO: Replace with actual API data
  const mockReasonsData = [
    { reason: "relocation", value: 35, color: "#036b80" },
    { reason: "financial", value: 25, color: "#3b82f6" },
    { reason: "academic", value: 20, color: "#8b5cf6" },
    { reason: "behavior", value: 12, color: "#ef4444" },
    { reason: "other", value: 8, color: "#6b7280" },
  ];

  // TODO: Filter data based on selected stage when API is integrated
  const chartData = mockReasonsData.map((item, index) => ({
    id: index,
    value: item.value,
    label: t(`filters.reasons.${item.reason}`),
    color: item.color,
  }));

  const stageOptions: DropdownItem[] = [
    { label: t("filters.all_stages"), value: "all" },
    { label: t("filters.stages.primary"), value: "primary" },
    { label: t("filters.stages.preparatory"), value: "preparatory" },
    { label: t("filters.stages.secondary"), value: "secondary" },
  ];

  return (
    <ChartCard
      title={t("charts.reasons.title")}
      description={t("charts.reasons.description")}
      periodOptions={stageOptions}
      defaultPeriod={selectedStage}
      onPeriodChange={(value) => setSelectedStage(value as Stage)}
      bgColor="#fef3c7"
    >
      <div className="w-full flex flex-col items-center mt-4">
        <PieChart
          series={[
            {
              data: chartData,
              highlightScope: { fade: "global", highlight: "item" },
              innerRadius: 60,
              outerRadius: 120,
              paddingAngle: 2,
              cornerRadius: 5,
              arcLabel: (item) => `${item.value}%`,
              arcLabelMinAngle: 35,
            },
          ]}
          width={Math.min(width, 500)}
          height={300}
          margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
          slotProps={{
            legend: {
              direction: "horizontal",
              position: { vertical: 'bottom', horizontal: 'center' },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}
