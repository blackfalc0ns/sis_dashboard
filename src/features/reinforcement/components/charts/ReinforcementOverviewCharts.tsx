"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import type { ReinforcementOverview } from "../../types/reinforcement";

interface ReinforcementOverviewChartsProps {
  overview: ReinforcementOverview;
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function ReinforcementOverviewCharts({
  overview,
}: ReinforcementOverviewChartsProps) {
  const t = useTranslations("reinforcement.charts");
  const pieColors = [
    "#036b80",
    "#0ea5e9",
    "#14b8a6",
    "#f59e0b",
    "#22c55e",
    "#ef4444",
    "#94a3b8",
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard
        title={t("tasksByStatus")}
        subtitle={t("tasksByStatusSubtitle")}
      >
        <PieChart
          height={260}
          series={[
            {
              data: overview.tasksByStatus.map((item, index) => ({
                id: item.id,
                value: item.value,
                label: item.label,
                color: pieColors[index % pieColors.length],
              })),
              innerRadius: 45,
              outerRadius: 90,
            },
          ]}
        />
      </ChartCard>

      <ChartCard
        title={t("tasksBySource")}
        subtitle={t("tasksBySourceSubtitle")}
      >
        <BarChart
          dataset={
            overview.tasksBySource as unknown as Array<
              Record<string, string | number>
            >
          }
          xAxis={[{ scaleType: "band", dataKey: "label" }]}
          series={[{ dataKey: "value", color: "#036b80" }]}
          height={260}
          margin={{ top: 16, right: 20, left: 32, bottom: 36 }}
        />
      </ChartCard>

      <ChartCard
        title={t("rewardsByType")}
        subtitle={t("rewardsByTypeSubtitle")}
      >
        <BarChart
          dataset={
            overview.rewardsByType as unknown as Array<
              Record<string, string | number>
            >
          }
          xAxis={[{ scaleType: "band", dataKey: "label" }]}
          series={[{ dataKey: "value", color: "#0ea5e9" }]}
          height={260}
          margin={{ top: 16, right: 20, left: 32, bottom: 36 }}
        />
      </ChartCard>

      <ChartCard
        title={t("topPerformance")}
        subtitle={t("topPerformanceSubtitle")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-700">
              {t("topClasses")}
            </h4>
            <ul className="space-y-3">
              {overview.topClasses.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-semibold text-primary">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-700">
              {t("topStudents")}
            </h4>
            <ul className="space-y-3">
              {overview.topStudents.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-semibold text-primary">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
