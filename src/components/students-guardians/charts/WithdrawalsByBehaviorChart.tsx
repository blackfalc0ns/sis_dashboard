// FILE: src/components/students-guardians/charts/WithdrawalsByBehaviorChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { Award } from "lucide-react";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";

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
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-5 h-5 text-[#036b80]" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t("charts.behavior.title")}
        </h2>
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          {t("charts.behavior.description")}
        </p>
      </div>

      <div className="w-full overflow-x-auto">
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
            },
          ]}
          yAxis={[
            {
              label: t("charts.behavior.y_axis"),
            },
          ]}
          margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
        />
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">{t("charts.behavior.insight_title")}:</p>
        <p className="mt-1">{t("charts.behavior.insight_text")}</p>
      </div>
    </div>
  );
}
