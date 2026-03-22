"use client";

import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlan, WeekInfo } from "@/features/academics/lesson-plans/services/lessonPlansService";
import WeekColumn from "./WeekColumn";

interface DraggedPlanItem {
  itemId: string;
  fromWeekIndex: number;
}

interface WeeksBoardDesktopProps {
  weeks: WeekInfo[];
  plans: LessonPlan[];
  lessons: Lesson[];
  draggedLesson: Lesson | null;
  draggedItem: DraggedPlanItem | null;
  isReadOnly: boolean;
  onDropOnWeek: (weekIndex: number) => void;
  onDragStartItem: (itemId: string, weekIndex: number) => void;
  onDragEndItem: () => void;
  onStatusChange: (itemId: string, status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED") => void;
  onEditNotes: (itemId: string, notesAr?: string, notesEn?: string) => void;
  onRemove: (itemId: string) => void;
}

export default function WeeksBoardDesktop({
  weeks,
  plans,
  lessons,
  draggedLesson,
  draggedItem,
  isReadOnly,
  onDropOnWeek,
  onDragStartItem,
  onDragEndItem,
  onStatusChange,
  onEditNotes,
  onRemove,
}: WeeksBoardDesktopProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
      {weeks.map((week) => {
        const weekPlan = plans.find((p) => p.weekIndex === week.weekIndex);
        const planKey = `${week.weekIndex}-${weekPlan?.items.length || 0}`;
        
        return (
          <WeekColumn
            key={planKey}
            week={week}
            plan={weekPlan}
            lessons={lessons}
            onDrop={onDropOnWeek}
            onDragStartItem={onDragStartItem}
            onDragEndItem={onDragEndItem}
            onStatusChange={onStatusChange}
            onEditNotes={onEditNotes}
            onRemove={onRemove}
            isReadOnly={isReadOnly}
            isDragOver={
              (draggedLesson !== null || draggedItem !== null) &&
              !isReadOnly
            }
          />
        );
      })}
    </div>
  );
}
