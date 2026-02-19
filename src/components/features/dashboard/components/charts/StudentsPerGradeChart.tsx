"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { mockStudents } from "@/data/mockStudents";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";

type Filter = "all" | "new" | "existing";

export default function StudentsPerGradeChart() {
  const t = useTranslations("students_per_grade");
  const t_grades = useTranslations("admissions.grades");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");

  // Helper function to convert grade name to translation key
  const getGradeKey = (grade: string): string => {
    // Convert "Grade 6" to "grade_6", "KG1" to "kg1", etc.
    return grade.toLowerCase().replace(/\s+/g, "_");
  };

  // Calculate real data from mockStudents
  const { grades, newStudents, existingStudents } = useMemo(() => {
    // Group students by grade
    const gradeGroups = mockStudents.reduce(
      (acc, student) => {
        const grade = student.gradeRequested;
        if (!acc[grade]) {
          acc[grade] = { new: 0, existing: 0 };
        }
        // Students with recent submission dates are "new", others are "existing"
        const submittedYear = new Date(student.submittedDate).getFullYear();
        if (submittedYear >= 2026) {
          acc[grade].new++;
        } else {
          acc[grade].existing++;
        }
        return acc;
      },
      {} as Record<string, { new: number; existing: number }>,
    );

    // Sort grades
    const sortedGrades = Object.keys(gradeGroups).sort();
    const newStudents = sortedGrades.map((g) => gradeGroups[g].new);
    const existingStudents = sortedGrades.map((g) => gradeGroups[g].existing);

    return { grades: sortedGrades, newStudents, existingStudents };
  }, []);

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

  const data = useMemo(() => {
    if (filter === "new") return newStudents;
    if (filter === "existing") return existingStudents;
    return newStudents.map((val, idx) => val + existingStudents[idx]);
  }, [filter, newStudents, existingStudents]);

  const highestIndex = useMemo(() => {
    let maxIdx = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }, [data]);

  const highestGradeLabel = translatedGrades[highestIndex];

  // Custom filter component
  const filterComponent = (
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
  );

  return (
    <ChartCard
      title={t("title")}
      subtitle={t("subtitle")}
      description={t("description")}
      showPeriodFilter={false}
      customFilter={filterComponent}
      className="h-full flex flex-col justify-between"
    >
      <BarChart
        xAxis={[{ data: translatedGrades, scaleType: "band" }]}
        series={[{ data, color: "#036b80" }]}
        height={180}
        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
      />

      {/* Action Flow */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            {t("insight.prefix", { grade: highestGradeLabel })}{" "}
            <span className="font-semibold text-(--primary-color)">
              {t("insight.highlight")}
            </span>
          </p>

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
            {" "}
            {t("actions.view_class_distribution")}
          </Button>
        </div>
      </div>
    </ChartCard>
  );
}
