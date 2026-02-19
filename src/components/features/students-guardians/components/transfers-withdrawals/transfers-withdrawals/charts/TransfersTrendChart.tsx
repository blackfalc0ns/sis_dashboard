// FILE: src/components/students-guardians/transfers-withdrawals/charts/TransfersTrendChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { LineChart } from "@mui/x-charts/LineChart";
import { TrendingUp } from "lucide-react";

export default function TransfersTrendChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals.charts");

  // TODO: Replace with actual API data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const internalData = [5, 8, 6, 10, 7, 9];
  const externalData = [3, 4, 5, 3, 6, 4];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("transfers_trend")}
        </h3>
      </div>

      <LineChart
        height={300}
        series={[
          {
            data: internalData,
            label: t("internal_transfers"),
            color: "#10b981",
          },
          {
            data: externalData,
            label: t("external_transfers"),
            color: "#f59e0b",
          },
        ]}
        xAxis={[{ scaleType: "point", data: months }]}
        sx={{
          "& .MuiLineElement-root": {
            strokeWidth: 2,
          },
        }}
      />
    </div>
  );
}
