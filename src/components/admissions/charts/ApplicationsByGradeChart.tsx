// FILE: src/components/admissions/charts/ApplicationsByGradeChart.tsx

"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface GradeData {
  grade: string;
  count: number;
}

interface ApplicationsByGradeChartProps {
  data: GradeData[];
}

// Define logical grade order
const GRADE_ORDER = [
  "KG1",
  "KG2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export default function ApplicationsByGradeChart({
  data,
}: ApplicationsByGradeChartProps) {
  const t = useTranslations("admissions.charts");
  const t_grades = useTranslations("admissions.grades");

  // Helper function to convert grade name to translation key
  const getGradeKey = (grade: string): string => {
    // Convert "Grade 6" to "grade_6", "KG1" to "kg1", etc.
    return grade.toLowerCase().replace(/\s+/g, "_");
  };

  // Sort data by logical grade order
  const sortedData = [...data].sort((a, b) => {
    const indexA = GRADE_ORDER.indexOf(a.grade);
    const indexB = GRADE_ORDER.indexOf(b.grade);

    // If both grades are in the order list, sort by index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one is in the list, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // If neither is in the list, sort alphabetically
    return a.grade.localeCompare(b.grade);
  });

  const grades = sortedData.map((item) => item.grade);
  const counts = sortedData.map((item) => item.count);
  const total = counts.reduce((sum, count) => sum + count, 0);

  // Get translated grade labels for display
  const translatedGrades = useMemo(
    () =>
      grades.map((grade) => {
        const key = getGradeKey(grade);
        const translated = t_grades(key);
        return translated !== key ? translated : grade;
      }),
    [grades, t_grades],
  );

  // Get most requested grade with translation
  const mostRequestedGrade = useMemo(() => {
    const mostRequested = sortedData.reduce((max, item) =>
      item.count > max.count ? item : max,
    );
    const key = getGradeKey(mostRequested.grade);
    const translated = t_grades(key);
    return translated !== key ? translated : mostRequested.grade;
  }, [sortedData, t_grades]);

  if (total === 0 || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm h-full">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {t("applications_by_grade")}
          </h3>
          <p className="text-sm text-gray-500">{t("grade_distribution")}</p>
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
          {t("applications_by_grade")}
        </h3>
        <p className="text-sm text-gray-500">{t("grade_distribution")}</p>
      </div>

      <div className="flex items-center justify-center">
        <BarChart
          xAxis={[
            {
              scaleType: "band",
              data: translatedGrades,
              categoryGapRatio: 0.3,
              barGapRatio: 0.1,
            },
          ]}
          series={[
            {
              data: counts,
              color: "#036b80",
              label: t("applications"),
            },
          ]}
          height={300}
          margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("total_applications")}</p>
            <p className="text-lg font-bold text-gray-900">{total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("grade_levels")}</p>
            <p className="text-lg font-bold text-gray-900">{grades.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("most_requested")}</p>
            <p className="text-lg font-bold text-[#036b80]">
              {mostRequestedGrade}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("highest_demand")}</p>
            <p className="text-lg font-bold text-[#036b80]">
              {Math.max(...counts)} {t("apps")}
            </p>
          </div>
        </div>
      </div>

      {/* Grade Distribution List */}
      <div className="mt-4 space-y-2">
        {sortedData.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          const key = getGradeKey(item.grade);
          const translatedGrade = t_grades(key);
          const displayGrade =
            translatedGrade !== key ? translatedGrade : item.grade;

          return (
            <div
              key={item.grade}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700 font-medium">{displayGrade}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#036b80] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-900 font-semibold w-8 text-right">
                  {item.count}
                </span>
                <span className="text-gray-500 text-xs w-12 text-right">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
