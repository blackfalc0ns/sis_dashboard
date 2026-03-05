"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

type Period = "days_30" | "week" | "term" | "academic_year";

export default function AttendanceTrendChart() {
  const t = useTranslations("attendance_trend");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("days_30");

  // Custom period options with translations
  const periodOptions: DropdownItem[] = useMemo(
    () => [
      { label: t("period.days_30"), value: "days_30" },
      { label: t("period.week"), value: "week" },
      { label: t("period.term"), value: "term" },
      { label: t("period.academic_year"), value: "academic_year" },
    ],
    [t],
  );

  const { days, attendanceData, average, belowDays } = useMemo(() => {
    // استبدل الداتا دي ببياناتك الحقيقية
    if (period === "week") {
      const d = Array.from({ length: 7 }, (_, i) => i + 1);
      const data = [92, 94, 91, 95, 93, 96, 94];
      const avg = 94;
      const below = 1;
      return { days: d, attendanceData: data, average: avg, belowDays: below };
    }

    if (period === "term") {
      const d = Array.from({ length: 12 }, (_, i) => i + 1); // مثال: 12 أسبوع
      const data = [93, 92, 94, 95, 93, 94, 96, 95, 94, 93, 94, 95];
      const avg = 94;
      const below = 2;
      return { days: d, attendanceData: data, average: avg, belowDays: below };
    }

    if (period === "academic_year") {
      const d = Array.from({ length: 12 }, (_, i) => i + 1); // 12 شهر
      const data = [93, 94, 92, 95, 94, 96, 95, 94, 93, 95, 94, 96];
      const avg = 94;
      const below = 2;
      return { days: d, attendanceData: data, average: avg, belowDays: below };
    }

    // default 30 days
    const d = Array.from({ length: 30 }, (_, i) => i + 1);
    const data = [
      92, 94, 91, 95, 93, 96, 94, 92, 95, 94, 93, 96, 95, 94, 92, 93, 95, 94,
      96, 93, 94, 95, 92, 94, 93, 95, 94, 96, 93, 94.5,
    ];
    const avg = 94;
    const below = 3;
    return { days: d, attendanceData: data, average: avg, belowDays: below };
  }, [period]);

  const avgLine = useMemo(
    () => Array(days.length).fill(average),
    [days.length, average],
  );

  const handlePeriodChange = (value: string) => {
    setPeriod(value as Period);
  };

  return (
    <ChartCard
      title={t("title", { period: t(`period.${period}`) })}
      subtitle={t("subtitle")}
      description={t("description")}
      periodOptions={periodOptions}
      onPeriodChange={handlePeriodChange}
      defaultPeriod={period}
      bgColor="#d1fae5"
      className="h-full flex flex-col justify-between"
    >
      <div className="flex justify-end mb-2">
        <div className="text-right">
          <p className="text-xs text-gray-500">{t("average_label")}</p>
          <p className="text-lg font-bold text-primary-600">{average}%</p>
        </div>
      </div>

      <div className="">
        <LineChart
          xAxis={[{ data: days, scaleType: "linear" }]}
          series={[
            {
              data: attendanceData,
              label: t("series.attendance"),
              color: "#036b80",
              curve: "natural",
            },
            {
              data: avgLine,
              label: t("series.average"),
              color: "#f59e0b",
              curve: "linear",
            },
          ]}
          height={300}
          margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
      </div>

      {/* Action Flow */}
      <div className="mt-4 pt-4 border-t border-gray-200 align-bottom">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-600">
              {t("below_days", { days: belowDays })}
            </span>{" "}
            {t("below_threshold_suffix")}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              rightIcon={
                locale === "ar" ? (
                  <ArrowLeft className="w-3 h-3" />
                ) : (
                  <ArrowRight className="w-3 h-3" />
                )
              }
            >
              {t("actions.view_details")}
            </Button>

            <Button size="sm" variant="secondary">
              {t("actions.send_alert")}
            </Button>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
