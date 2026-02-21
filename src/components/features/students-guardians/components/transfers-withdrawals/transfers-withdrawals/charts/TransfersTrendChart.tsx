// FILE: src/components/students-guardians/transfers-withdrawals/charts/TransfersTrendChart.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LineChart } from "@mui/x-charts/LineChart";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

type Period = "6months" | "year" | "all";

export default function TransfersTrendChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("6months");

  // TODO: Replace with actual API data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const internalData = [5, 8, 6, 10, 7, 9];
  const externalData = [3, 4, 5, 3, 6, 4];

  const periodOptions: DropdownItem[] = [
    { label: t("filters.period.6months"), value: "6months" },
    { label: t("filters.period.year"), value: "year" },
    { label: t("filters.period.all"), value: "all" },
  ];

  return (
    <ChartCard
      title={t("charts.transfers_trend_title")}
      description={t("charts.transfers_trend_description")}
      periodOptions={periodOptions}
      defaultPeriod={selectedPeriod}
      onPeriodChange={(value) => setSelectedPeriod(value as Period)}
      bgColor="#d1fae5"
    >
      <div className="w-full overflow-x-auto mt-4">
        <LineChart
          width={width}
          height={height}
          series={[
            {
              data: internalData,
              label: t("charts.internal_transfers"),
              color: "#10b981",
              curve: "linear",
            },
            {
              data: externalData,
              label: t("charts.external_transfers"),
              color: "#f59e0b",
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
          sx={{
            "& .MuiLineElement-root": {
              strokeWidth: 2,
            },
          }}
        />
      </div>
    </ChartCard>
  );
}
