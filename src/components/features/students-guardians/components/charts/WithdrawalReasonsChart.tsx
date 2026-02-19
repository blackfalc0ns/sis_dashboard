// FILE: src/components/students-guardians/charts/WithdrawalReasonsChart.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PieChart } from "@mui/x-charts/PieChart";
import { FileText } from "lucide-react";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";

type Stage = "all" | "primary" | "preparatory" | "secondary";

export default function WithdrawalReasonsChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("charts.reasons.title")}
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
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">{t("filters.all_stages")}</option>
            <option value="primary">{t("filters.stages.primary")}</option>
            <option value="preparatory">
              {t("filters.stages.preparatory")}
            </option>
            <option value="secondary">{t("filters.stages.secondary")}</option>
          </select>
        </div>
      </div>

      <div className="w-full overflow-x-auto flex justify-center">
        <PieChart
          series={[
            {
              data: chartData,
              highlightScope: { fade: "global", highlight: "item" },
              innerRadius: 60,
              outerRadius: 120,
              paddingAngle: 2,
              cornerRadius: 5,
            },
          ]}
          width={Math.min(width, 500)}
          height={Math.min(height, 300)}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        />
      </div>
    </div>
  );
}
