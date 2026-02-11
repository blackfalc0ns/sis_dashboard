"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

type ReasonKey = "medical" | "permission" | "no_excuse";

export default function AbsenceReasonsChart() {
  const t = useTranslations("absence_reasons");

  const data = useMemo(
    () => [
      { id: 0, key: "medical" as const, value: 45, color: "#10b981" },
      { id: 1, key: "permission" as const, value: 30, color: "#f59e0b" },
      { id: 2, key: "no_excuse" as const, value: 25, color: "#ef4444" },
    ],
    [],
  );

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        id: item.id,
        value: item.value,
        label: t(`types.${item.key}`),
        color: item.color,
      })),
    [data, t],
  );

  const noExcuse = useMemo(
    () => data.find((x) => x.key === "no_excuse")?.value ?? 0,
    [data],
  );

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{t("title")}</h3>
        <p className="text-xs text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="flex items-center justify-center">
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 50,
              outerRadius: 80,
              paddingAngle: 2,
              cornerRadius: 4,
            },
          ]}
          width={280}
          height={200}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">
              {t(`types.${item.key}`)} ({item.value}%)
            </span>
          </div>
        ))}
      </div>

      {/* Action Flow */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-600">{noExcuse}%</span>{" "}
            {t("insight.without_valid_excuse")}
          </p>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-(--primary-color) text-white rounded-lg text-xs font-medium hover:bg-(--hover-color) transition-colors flex items-center gap-1">
              {t("actions.contact_parents")}
              <ArrowRight className="w-3 h-3" />
            </button>

            <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
              {t("actions.create_plan")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
