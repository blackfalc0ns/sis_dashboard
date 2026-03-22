"use client";

import { useTranslations, useLocale } from "next-intl";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ChevronDown, Calendar, AlertTriangle, Plus } from "lucide-react";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlan, WeekInfo } from "@/features/academics/lesson-plans/services/lessonPlansService";
import LessonPlanItemCard from "./LessonPlanItemCard";

interface WeeksBoardMobileProps {
  weeks: WeekInfo[];
  plans: LessonPlan[];
  lessons: Lesson[];
  isReadOnly: boolean;
  onStatusChange: (itemId: string, status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED") => void;
  onEditNotes: (itemId: string, notesAr?: string, notesEn?: string) => void;
  onRemove: (itemId: string) => void;
  onAddLesson: (weekIndex: number) => void;
}

export default function WeeksBoardMobile({
  weeks,
  plans,
  lessons,
  isReadOnly,
  onStatusChange,
  onEditNotes,
  onRemove,
  onAddLesson,
}: WeeksBoardMobileProps) {
  const t = useTranslations("academics.lessonPlans");
  const tMobile = useTranslations("academics.lessonPlans.mobile");
  const locale = useLocale();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
  };

  return (
    <div className="space-y-2">
      {weeks.map((week) => {
        const weekPlan = plans.find((p) => p.weekIndex === week.weekIndex);
        const items = weekPlan ? [...weekPlan.items].sort((a, b) => a.order - b.order) : [];

        return (
          <Accordion
            key={week.weekIndex}
            defaultExpanded={false}
            sx={{
              boxShadow: "none",
              border: "1px solid #e5e7eb",
              borderRadius: "8px !important",
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: "0 !important" },
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown className="w-5 h-5 text-gray-600" />}
              sx={{
                minHeight: "auto !important",
                padding: "12px 16px",
                "& .MuiAccordionSummary-content": {
                  margin: "0 !important",
                },
              }}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {tMobile("weekAccordion", { index: week.weekIndex })}
                  </h4>
                  <div className="flex items-center gap-2">
                    {week.hasHolidays && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                          <AlertTriangle className="w-3 h-3" />
                          {week.lostTeachingDays}
                        </span>
                      )}
                    <span className="px-2 py-0.5 text-xs font-medium text-primary border border-primary rounded-full">
                      {items.length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(week.startDate)} - {formatDate(week.endDate)}
                  </span>
                </div>
              </div>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                padding: "12px 16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400">
                      {isReadOnly ? "-" : t("week.plannedItems", { count: 0 })}
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
                        onDragStart={() => {}}
                        onDragEnd={() => {}}
                        onStatusChange={onStatusChange}
                        onEditNotes={onEditNotes}
                        onRemove={onRemove}
                        isReadOnly={isReadOnly}
                      />
                    );
                  })
                )}

                {/* Add Lesson Button */}
                {!isReadOnly && (
                  <button
                    onClick={() => onAddLesson(week.weekIndex)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {tMobile("addLesson")}
                  </button>
                )}
              </div>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}
