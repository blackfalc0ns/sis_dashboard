"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, Calendar } from "lucide-react";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlan, WeekInfo } from "@/features/academics/lesson-plans/services/lessonPlansService";
import LessonPlanItemCard from "./LessonPlanItemCard";

interface WeekColumnProps {
  week: WeekInfo;
  plan: LessonPlan | undefined;
  lessons: Lesson[];
  onDrop: (weekIndex: number) => void;
  onDragStartItem: (itemId: string, weekIndex: number) => void;
  onDragEndItem: () => void;
  onStatusChange: (itemId: string, status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED") => void;
  onEditNotes: (itemId: string, notesAr?: string, notesEn?: string) => void;
  onRemove: (itemId: string) => void;
  isReadOnly: boolean;
  isDragOver: boolean;
}

export default function WeekColumn({
  week,
  plan,
  lessons,
  onDrop,
  onDragStartItem,
  onDragEndItem,
  onStatusChange,
  onEditNotes,
  onRemove,
  isReadOnly,
  isDragOver,
}: WeekColumnProps) {
  const t = useTranslations("academics.lessonPlans.week");
  const locale = useLocale();

  const [dragOverColumn, setDragOverColumn] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) {
      setDragOverColumn(true);
    }
  }, [isReadOnly]);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(false);
    if (!isReadOnly) {
      onDrop(week.weekIndex);
    }
  }, [isReadOnly, onDrop, week.weekIndex]);

  const items = plan ? [...plan.items].sort((a, b) => a.order - b.order) : [];

  // Format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
  };

  return (
    <div
      className={`
         shrink-0 bg-white rounded-lg border transition-all
        ${dragOverColumn && isDragOver
          ? "border-primary border-2 bg-primary/5"
          : "border-gray-200"
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">
            {t("label", { index: week.weekIndex })}
          </h4>
          <span className="px-2 py-0.5 text-xs font-medium text-primary border border-primary rounded-full">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>
            {t("dateRange", {
              start: formatDate(week.startDate),
              end: formatDate(week.endDate),
            })}
          </span>
        </div>

        {/* Holiday Warning */}
        {week.hasHolidays && (
          <div className="mt-2 px-2 py-1 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center gap-1 text-xs text-orange-800">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{t("holidayWarning", { count: week.lostTeachingDays })}</span>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="p-3 space-y-2 min-h-[200px]">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">
              {isReadOnly ? "-" : t("plannedItems", { count: 0 })}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const lesson = lessons.find((l) => l.id === item.lessonId);
            if (!lesson) return null;

            return (
              <LessonPlanItemCard
                key={item.id}
                item={item}
                lesson={lesson}
                onDragStart={() => onDragStartItem(item.id, week.weekIndex)}
                onDragEnd={onDragEndItem}
                onStatusChange={onStatusChange}
                onEditNotes={onEditNotes}
                onRemove={onRemove}
                isReadOnly={isReadOnly}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
