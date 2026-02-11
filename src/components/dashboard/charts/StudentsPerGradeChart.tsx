"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type Filter = "all" | "new" | "existing";

export default function StudentsPerGradeChart() {
  const t = useTranslations("students_per_grade");

  const [filter, setFilter] = useState<Filter>("all");

  // keys ثابتة عشان الترجمة
  const gradeKeys = ["g1", "g2", "g3", "g4", "g5", "g6"] as const;

  const grades = useMemo(() => gradeKeys.map((k) => t(`grades.${k}`)), [t]);

  const newStudents = [45, 52, 48, 50, 46, 44];
  const existingStudents = [180, 175, 182, 178, 185, 180];

  const data = useMemo(() => {
    if (filter === "new") return newStudents;
    if (filter === "existing") return existingStudents;
    return newStudents.map((val, idx) => val + existingStudents[idx]);
  }, [filter]);

  const highestIndex = useMemo(() => {
    let maxIdx = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }, [data]);

  const highestGradeLabel = grades[highestIndex];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-gray-900">{t("title")}</h3>
          <p className="text-xs text-gray-500">{t("subtitle")}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["all", "new", "existing"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              {t(`filter.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48">
        <BarChart
          xAxis={[{ data: grades, scaleType: "band" }]}
          series={[{ data, color: "#036b80" }]}
          height={180}
          margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
      </div>

      {/* Action Flow */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            {t("insight.prefix", { grade: highestGradeLabel })}{" "}
            <span className="font-semibold text-(--primary-color)">
              {t("insight.highlight")}
            </span>
          </p>

          <button className="px-3 py-1.5 bg-(--primary-color) text-white rounded-lg text-xs font-medium hover:bg-(--hover-color) transition-colors flex items-center gap-1">
            {t("actions.view_class_distribution")}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
