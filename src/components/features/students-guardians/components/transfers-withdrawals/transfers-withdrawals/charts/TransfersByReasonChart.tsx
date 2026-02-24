// FILE: src/components/students-guardians/transfers-withdrawals/charts/TransfersByReasonChart.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PieChart } from "@mui/x-charts/PieChart";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

type TransferType = "all" | "internal" | "external";

export default function TransfersByReasonChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const [selectedType, setSelectedType] = useState<TransferType>("all");

  // TODO: Replace with actual API data
  const mockData = [
    { reason: "academic", value: 35, color: "#3b82f6" },
    { reason: "relocation", value: 25, color: "#f59e0b" },
    { reason: "better_fit", value: 20, color: "#ef4444" },
    { reason: "other", value: 20, color: "#14b8a6" },
  ];

  const chartData = mockData.map((item, index) => ({
    id: index,
    value: item.value,
    label: t(`charts.reasons.${item.reason}`),
    color: item.color,
  }));

  const typeOptions: DropdownItem[] = [
    { label: t("filters.all_types"), value: "all" },
    { label: t("filters.types.internal"), value: "internal" },
    { label: t("filters.types.external"), value: "external" },
  ];

  return (
    <ChartCard
      title={t("charts.transfers_by_reason.title")}
      description={t("charts.transfers_by_reason.description")}
      periodOptions={typeOptions}
      defaultPeriod={selectedType}
      onPeriodChange={(value) => setSelectedType(value as TransferType)}
      bgColor="#dbeafe"
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
          height={Math.min(height, 300)}
          margin={{ top: 100, right: 70, bottom: 100, left: 70 }}
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
