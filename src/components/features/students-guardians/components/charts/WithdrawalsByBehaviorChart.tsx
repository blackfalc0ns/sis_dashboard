// FILE: src/components/students-guardians/charts/WithdrawalsByBehaviorChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";

// TODO: Replace with actual API data from behavior evaluation system
const mockBehaviorData = [
  { range: "0-20", withdrawals: 8, label: "0-20" },
  { range: "21-40", withdrawals: 12, label: "21-40" },
  { range: "41-60", withdrawals: 6, label: "41-60" },
  { range: "61-80", withdrawals: 3, label: "61-80" },
  { range: "81-100", withdrawals: 1, label: "81-100" },
];

export default function WithdrawalsByBehaviorChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();

  const ranges = mockBehaviorData.map((d) => d.label);
  const withdrawals = mockBehaviorData.map((d) => d.withdrawals);

  return (
    <ChartCard
      title={t("charts.behavior.title")}
      description={t("charts.behavior.description")}
      bgColor="#ede9fe"
    >
      <div className="w-full overflow-x-auto mt-4">
        <BarChart
          width={width}
          height={height}
          series={[
            {
              data: withdrawals,
              label: t("charts.behavior.withdrawals"),
              color: "#ef4444",
            },
          ]}
          xAxis={[
            {
              scaleType: "band",
              data: ranges,
              label: t("charts.behavior.x_axis"),
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          yAxis={[
            {
              label: t("charts.behavior.y_axis"),
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
        />
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900">
          {t("charts.behavior.insight_title")}:
        </p>
        <p className="text-sm text-blue-800 mt-1">
          {t("charts.behavior.insight_text")}
        </p>
      </div>
    </ChartCard>
  );
}
