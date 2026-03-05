"use client";

import { useMemo, useState } from "react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { useTranslations } from "next-intl";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

type StatType = "positive" | "negative";
type Period = "today" | "this_week" | "this_term";

interface StatCardProps {
  labelKey: StatType;
  value: string;
  change: string;
  isPositive: boolean;
}

const StatCard = ({ labelKey, value, change, isPositive }: StatCardProps) => {
  const t = useTranslations("charts");

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex-1">
      <p className="text-black text-xs font-medium uppercase mb-2">
        {t(labelKey)}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-black">{value}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            isPositive ? "positive-tag" : "negative-tag"
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
};

export default function AcademicPerformanceCard() {
  const t = useTranslations("charts");

  const [period, setPeriod] = useState<Period>("today");

  // Custom period options with translations
  const periodOptions: DropdownItem[] = useMemo(
    () => [
      { label: t("period.today"), value: "today" },
      { label: t("period.this_week"), value: "this_week" },
      { label: t("period.this_term"), value: "this_term" },
    ],
    [t],
  );

  const chartData = useMemo(() => {
    // مثال: غيّر الداتا حسب الفترة (بدّلها ببياناتك الحقيقية)
    if (period === "today")
      return [1, 4, 2, 5, 7, 2, 4, 6, 8, 9, 1, 7, 12, 5, 3, 8];
    if (period === "this_week")
      return [2, 3, 4, 3, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10];
    return [3, 2, 5, 4, 6, 8, 7, 9, 10, 8, 7, 11, 12, 10, 9, 13]; // term
  }, [period]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value as Period);
  };

  return (
    <ChartCard
      title={t("academic_performance")}
      subtitle={t("academic_performance_subtitle")}
      description={t("academic_performance_description")}
      periodOptions={periodOptions}
      onPeriodChange={handlePeriodChange}
      defaultPeriod={period}
      bgColor="#dbeafe"
      customFilter={
        <div className="flex items-center gap-1.5 positive-tag px-3 py-1 rounded-full">
          <CheckCircleIcon className="w-4 h-4" />
          <span className="text-sm font-bold">{t("good")}</span>
        </div>
      }
    >
      {/* Stats Section */}
      <div className="flex gap-4 mb-6">
        <StatCard labelKey="positive" value="93%" change="+10.45%" isPositive />
        <StatCard
          labelKey="negative"
          value="7%"
          change="-4.75%"
          isPositive={false}
        />
      </div>

      {/* Chart */}
      <div className="w-full">
        <SparkLineChart
          data={chartData}
          height={180}
          color={"#036b80"}
          curve="natural"
          showTooltip
          showHighlight
          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
          slotProps={{
            line: {
              filter: "url(#lineShadow)",
              stroke: "url(#lineGradient)",
            },
          }}
          sx={{
            "& .MuiLineElement-root": {
              strokeWidth: 2.5,
              strokeLinejoin: "round",
              strokeLinecap: "round",
            },
          }}
        >
          <defs>
            <filter
              id="lineShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="4"
                floodColor="#036b80"
                floodOpacity="0.2"
              />
            </filter>

            <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0" y2="0">
              <stop offset="0%" stopColor="#036b80" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#036b80" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#036b80" stopOpacity="1" />
            </linearGradient>
          </defs>
        </SparkLineChart>
      </div>
    </ChartCard>
  );
}
