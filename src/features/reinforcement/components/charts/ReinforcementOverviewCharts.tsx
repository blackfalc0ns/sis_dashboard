"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import type { ReinforcementOverview } from "../../types/reinforcement";
import type { ReinforcementOverviewChartKey } from "../../utils/reinforcementQueryState";

interface ReinforcementOverviewChartsProps {
  overview: ReinforcementOverview;
  focusedChart?: ReinforcementOverviewChartKey;
}

function ChartCard({
  title,
  subtitle,
  isFocused = false,
  children,
}: {
  title: string;
  subtitle: string;
  isFocused?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl bg-white p-4 shadow-sm ${
        isFocused ? "ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ChartLegendList({
  items,
}: {
  items: Array<{ id: string; label: string; value: number; color: string }>;
}) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReinforcementOverviewCharts({
  overview,
  focusedChart = "status",
}: ReinforcementOverviewChartsProps) {
  const t = useTranslations("reinforcement.charts");
  const reinforcementT = useTranslations("reinforcement");
  const pieColors = [
    "#036b80",
    "#0ea5e9",
    "#14b8a6",
    "#f59e0b",
    "#22c55e",
    "#ef4444",
    "#94a3b8",
  ];
  const sourceChartData = overview.tasksBySource.map((item, index) => ({
    ...item,
    label: reinforcementT(`source.${item.id}`),
    color: pieColors[index % pieColors.length],
  }));
  const rewardTypeChartData = overview.rewardsByType.map((item, index) => ({
    ...item,
    label: reinforcementT(`rewardType.${item.id}`),
    color: pieColors[index % pieColors.length],
  }));

  const cards = [
    (
      <ChartCard
        key="status"
        title={t("tasksByStatus")}
        subtitle={t("tasksByStatusSubtitle")}
        isFocused={focusedChart === "status"}
      >
        <PieChart
          height={260}
          series={[
            {
              data: overview.tasksByStatus.map((item, index) => ({
                id: item.id,
                value: item.value,
                label: reinforcementT(`status.${item.id}`),
                color: pieColors[index % pieColors.length],
              })),
              innerRadius: 45,
              outerRadius: 90,
            },
          ]}
        />
      </ChartCard>
    ),
    (
      <ChartCard
        key="source"
        title={t("tasksBySource")}
        subtitle={t("tasksBySourceSubtitle")}
        isFocused={focusedChart === "source"}
      >
        <>
          <BarChart
            dataset={sourceChartData as unknown as Array<Record<string, string | number>>}
            xAxis={[{ scaleType: "band", dataKey: "label" }]}
            series={[{ dataKey: "value", color: "#036b80" }]}
            height={260}
            margin={{ top: 16, right: 20, left: 32, bottom: 36 }}
          />
          <ChartLegendList items={sourceChartData} />
        </>
      </ChartCard>
    ),
    (
      <ChartCard
        key="rewardType"
        title={t("rewardsByType")}
        subtitle={t("rewardsByTypeSubtitle")}
        isFocused={focusedChart === "rewardType"}
      >
        <>
          <BarChart
            dataset={
              rewardTypeChartData as unknown as Array<Record<string, string | number>>
            }
            xAxis={[{ scaleType: "band", dataKey: "label" }]}
            series={[{ dataKey: "value", color: "#0ea5e9" }]}
            height={260}
            margin={{ top: 16, right: 20, left: 32, bottom: 36 }}
          />
          <ChartLegendList items={rewardTypeChartData} />
        </>
      </ChartCard>
    ),
    (
      <ChartCard
        key="topPerformance"
        title={t("topPerformance")}
        subtitle={t("topPerformanceSubtitle")}
        isFocused={focusedChart === "topPerformance"}
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
    ),
  ];

  const sortedCards = [
    ...cards.filter((card) => card.key === focusedChart),
    ...cards.filter((card) => card.key !== focusedChart),
  ];

  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{sortedCards}</div>;
}
