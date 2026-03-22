"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { Search, GripVertical } from "lucide-react";
import { Lesson, Unit } from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlan } from "@/features/academics/lesson-plans/services/lessonPlansService";

interface LessonLibraryProps {
  lessons: Lesson[];
  units: Unit[];
  plans: LessonPlan[];
  searchQuery: string;
  selectedUnitId: string;
  onSearchQueryChange: (value: string) => void;
  onSelectedUnitIdChange: (value: string) => void;
  onDragStart: (lesson: Lesson) => void;
  onDragEnd: () => void;
  isReadOnly: boolean;
}

export default function LessonLibrary({
  lessons,
  units,
  plans,
  searchQuery,
  selectedUnitId,
  onSearchQueryChange,
  onSelectedUnitIdChange,
  onDragStart,
  onDragEnd,
  isReadOnly,
}: LessonLibraryProps) {
  const t = useTranslations("academics.lessonPlans.library");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Get planned lesson IDs - recalculate whenever plans change
  const plannedLessonIds = useMemo(() => {
    const ids = new Set<string>();
    plans.forEach((plan) => {
      plan.items.forEach((item) => {
        ids.add(item.lessonId);
      });
    });
    return ids;
  }, [plans]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // Filter by unit
      if (selectedUnitId && lesson.unitId !== selectedUnitId) {
        return false;
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleAr = lesson.titleAr?.toLowerCase() || "";
        const titleEn = lesson.titleEn?.toLowerCase() || "";
        return titleAr.includes(query) || titleEn.includes(query);
      }

      return true;
    });
  }, [lessons, selectedUnitId, searchQuery]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("title")}</h3>

        {/* Search */}
        <div className="mb-3">
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            inputSize="sm"
          />
        </div>

        {/* Unit Filter */}
        <Select
          label={t("filterByUnit")}
          value={selectedUnitId}
          onChange={onSelectedUnitIdChange}
          options={[
            { value: "", label: t("allUnits") },
            ...units.map((unit) => ({
              value: unit.id,
              label: isRTL ? unit.titleAr : unit.titleEn,
            })),
          ]}
          selectSize="sm"
        />
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">{t("noLessons")}</p>
          </div>
        ) : (
          filteredLessons.map((lesson) => {
            const isPlanned = plannedLessonIds.has(lesson.id);
            const unit = units.find((u) => u.id === lesson.unitId);

            return (
              <div
                key={lesson.id}
                draggable={!isReadOnly && !isPlanned}
                onDragStart={() => onDragStart(lesson)}
                onDragEnd={onDragEnd}
                className={`
                  p-3 rounded-lg border transition-all
                  ${isPlanned
                    ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                    : isReadOnly
                    ? "bg-white border-gray-200 cursor-default"
                    : "bg-white border-gray-200 hover:border-primary hover:shadow-sm cursor-grab active:cursor-grabbing"
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  {!isReadOnly && !isPlanned && (
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {isRTL ? lesson.titleAr : lesson.titleEn}
                    </p>
                    {unit && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {isRTL ? unit.titleAr : unit.titleEn}
                      </p>
                    )}
                    {isPlanned && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        {t("planned")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      {!isReadOnly && filteredLessons.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">{t("dragToAdd")}</p>
        </div>
      )}
    </div>
  );
}
