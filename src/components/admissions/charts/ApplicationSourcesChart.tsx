// FILE: src/components/admissions/charts/ApplicationSourcesChart.tsx

"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { useTranslations } from "next-intl";

interface ApplicationSourcesChartProps {
  data: { source: string; count: number }[];
}

const SOURCE_COLORS: Record<string, string> = {
  "In App": "#036b80", // primary teal
  Referral: "#10b981", // green
  "Walk-in": "#f59e0b", // amber
  Other: "#6b7280", // gray
};

export default function ApplicationSourcesChart({
  data,
}: ApplicationSourcesChartProps) {
  const t = useTranslations("admissions.charts");

  const chartData = data.map((item, index) => ({
    id: index,
    value: item.count,
    label: item.source,
    color: SOURCE_COLORS[item.source] || SOURCE_COLORS["Other"],
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm h-full">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {t("application_sources")}
          </h3>
          <p className="text-sm text-gray-500">{t("source_distribution")}</p>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {t("application_sources")}
        </h3>
        <p className="text-sm text-gray-500">{t("source_distribution")}</p>
      </div>

      <div className="flex items-center justify-center">
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 60,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
              faded: { innerRadius: 30, additionalRadius: -10, color: "gray" },
            },
          ]}
          height={280}
          slotProps={{
            legend: {
              hidden: true,
            } as any,
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-3">
        {data.map((item) => (
          <div key={item.source} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    SOURCE_COLORS[item.source] || SOURCE_COLORS["Other"],
                }}
              />
              <span className="text-sm text-gray-700">{item.source}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900">
                {item.count}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
