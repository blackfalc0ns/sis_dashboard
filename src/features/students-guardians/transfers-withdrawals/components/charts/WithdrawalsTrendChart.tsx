// FILE: src/components/students-guardians/transfers-withdrawals/charts/WithdrawalsTrendChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { LineChart } from "@mui/x-charts/LineChart";
import { TrendingDown } from "lucide-react";

export default function WithdrawalsTrendChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals.charts");

  // TODO: Replace with actual API data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const withdrawalsData = [4, 6, 5, 8, 7, 6];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("withdrawals_trend")}
        </h3>
      </div>

      <LineChart
        height={300}
        series={[
          {
            data: withdrawalsData,
            label: t("total_withdrawals"),
            color: "#ef4444",
            area: true,
          },
        ]}
        xAxis={[{ scaleType: "point", data: months }]}
        sx={{
          "& .MuiLineElement-root": {
            strokeWidth: 2,
          },
          "& .MuiAreaElement-root": {
            fill: "rgba(239, 68, 68, 0.1)",
          },
        }}
      />
    </div>
  );
}
