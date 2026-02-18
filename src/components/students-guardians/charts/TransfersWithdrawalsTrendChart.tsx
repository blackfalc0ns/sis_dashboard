// FILE: src/components/students-guardians/charts/TransfersWithdrawalsTrendChart.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { LineChart } from "@mui/x-charts/LineChart";
import { TrendingUp } from "lucide-react";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";

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
    return mockMonthlyData;
  }, [selectedStage]);

  const months = chartData.map((d) => d.month);
  const transfers = chartData.map((d) => d.transfers);
  const withdrawals = chartData.map((d) => d.withdrawals);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#036b80]" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("charts.trend.title")}
          </h2>
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {t("filters.stage")}:
          </label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as Stage)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          >
            <option value="all">{t("filters.all_stages")}</option>
            <option value="primary">{t("filters.primary")}</option>
            <option value="preparatory">{t("filters.preparatory")}</option>
            <option value="secondary">{t("filters.secondary")}</option>
          </select>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
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
          xAxis={[{ scaleType: "point", data: months }]}
          margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
        />
      </div>
    </div>
  );
}
