"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import { Curriculum, Unit, Lesson } from "@/features/academics/curriculum/services/curriculumService";

interface CurriculumPlanProps {
  curriculum: Curriculum;
  units: Unit[];
  lessons: Lesson[];
  termWeeks: number;
  onRefresh: () => Promise<void>;
  isReadOnly: boolean;
  showProgressOnly?: boolean;
}

export default function CurriculumPlan({
  units,
  lessons,
  termWeeks,
  showProgressOnly = false,
}: CurriculumPlanProps) {
  const t = useTranslations("academics.curriculum.plan");

  const stats = useMemo(() => {
    const total = lessons.length;
    const done = lessons.filter((l) => l.status === "done").length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;

    const weeklyData = Array.from({ length: termWeeks }, (_, i) => {
      const week = i + 1;
      const planned = lessons.filter((l) => l.plannedWeek <= week).length;
      const completed = lessons.filter(
        (l) => l.status === "done" && l.plannedWeek <= week
      ).length;
      return { week, planned, completed };
    });

    return { total, done, completion, weeklyData };
  }, [lessons, termWeeks]);

  const lessonsByWeek = useMemo(() => {
    const map: Record<number, Lesson[]> = {};
    lessons.forEach((lesson) => {
      if (!map[lesson.plannedWeek]) {
        map[lesson.plannedWeek] = [];
      }
      map[lesson.plannedWeek].push(lesson);
    });
    return map;
  }, [lessons]);

  return (
    <div className="flex flex-col h-full">
      {/* Progress Summary */}
      <div className="p-6 border-b border-border bg-white">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("title")}</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">{t("total_lessons")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="text-sm text-gray-600">{t("done_lessons")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.completion}%</div>
            <div className="text-sm text-gray-600">{t("completion")}</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${stats.completion}%` }}
          />
        </div>
      </div>

      {/* Weekly Plan */}
      {!showProgressOnly && (
        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">{t("weekly_plan")}</h3>

          <div className="space-y-4">
            {Array.from({ length: termWeeks }, (_, i) => {
              const week = i + 1;
              const weekLessons = lessonsByWeek[week] || [];

              return (
                <div key={week} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {t("week")} {week}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {weekLessons.length} {t("lessons")}
                    </span>
                  </div>

                  {weekLessons.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("no_lessons")}</p>
                  ) : (
                    <div className="space-y-2">
                      {weekLessons.map((lesson) => {
                        const unit = units.find((u) => u.id === lesson.unitId);
                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-2 p-2 rounded ${
                              lesson.status === "done"
                                ? "bg-green-50 border border-green-200"
                                : "bg-gray-50"
                            }`}
                          >
                            {lesson.status === "done" && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {lesson.title}
                              </div>
                              <div className="text-xs text-gray-500">{unit?.title}</div>
                            </div>
                            {lesson.durationMinutes && (
                              <span className="text-xs text-gray-500">
                                {lesson.durationMinutes}min
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Chart */}
      {showProgressOnly && (
        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            {t("planned_vs_done")}
          </h3>

          <div className="space-y-2">
            {stats.weeklyData.map((data) => (
              <div key={data.week} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">
                  {t("week")} {data.week}
                </div>
                <div className="flex-1">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">
                        {t("planned")}: {data.planned}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? (data.planned / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">
                        {t("done")}: {data.completed}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? (data.completed / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
