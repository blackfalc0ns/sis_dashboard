// FILE: src/components/students-guardians/charts/AbsenceHeatmap.tsx

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useOptionalStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface HeatmapData {
  week: string;
  data: number[];
}

interface AbsenceHeatmapProps {
  data?: HeatmapData[];
}

export default function AbsenceHeatmap({ data }: AbsenceHeatmapProps) {
  const t = useTranslations("students_guardians.overview");
  const context = useOptionalStudentsGuardiansYearTermContext();
  const yearId = context?.yearId ?? null;
  const termId = context?.termId ?? null;
  const isContextLoading = context?.isLoading ?? false;

  // Get all students
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    if (isContextLoading) {
      setIsLoading(true);
      return () => {
        isCancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        if (yearId && termId) {
          await studentsService.fetchStudentsWithEnrollmentForContext(
            yearId,
            termId,
          );
        } else {
          await studentsService.fetchStudentsWithEnrollment();
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isContextLoading, termId, yearId]);

  // Default data if none provided - 6 days starting from Saturday
  // In a real implementation, this would be calculated from filteredStudents
  // For now, using mock data
  const heatmapData: HeatmapData[] = data || [
    { week: t("weeks.week_1"), data: [2, 3, 1, 4, 2, 3] },
    { week: t("weeks.week_2"), data: [3, 2, 5, 3, 4, 2] },
    { week: t("weeks.week_3"), data: [1, 4, 2, 2, 3, 4] },
    { week: t("weeks.week_4"), data: [4, 3, 3, 5, 6, 3] },
    { week: t("weeks.week_5"), data: [2, 1, 4, 3, 2, 5] },
    { week: t("weeks.week_6"), data: [3, 5, 2, 4, 3, 2] },
  ];

  const days = [
    t("days.sat"),
    t("days.sun"),
    t("days.mon"),
    t("days.tue"),
    t("days.wed"),
    t("days.thu"),
  ];

  const getIntensityClass = (value: number): string => {
    if (value <= 2) {
      return "bg-green-100 text-green-800";
    } else if (value <= 4) {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-main space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900">
        {t("charts.absence_heatmap")}
      </h3>
      {isLoading ? (
        <PartialLoader />
      ) : (
      <div className="overflow-x-auto overflow-y-hidden -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="min-w-[480px] sm:min-w-[500px]">
          {/* Heatmap Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-600"></div>
            {days.map((day) => (
              <div
                key={day}
                className="text-[10px] sm:text-xs font-medium text-gray-600 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap Rows */}
          {heatmapData.map((row) => (
            <div
              key={row.week}
              className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2"
            >
              <div className="text-[10px] sm:text-xs font-medium text-gray-600 flex items-center">
                {row.week}
              </div>
              {row.data.map((value, idx) => (
                <div
                  key={idx}
                  className={`h-10 sm:h-12 rounded flex items-center justify-center text-xs sm:text-sm font-semibold ${getIntensityClass(value)}`}
                >
                  {value}
                </div>
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs flex-wrap">
            <span className="text-gray-600">{t("heatmap.absences")}:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">{t("heatmap.low")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 rounded"></div>
              <span className="text-gray-600">{t("heatmap.medium")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 rounded"></div>
              <span className="text-gray-600">{t("heatmap.high")}</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
