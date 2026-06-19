"use client";

import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import {
  LessonPlan,
  WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import WeekColumn from "./WeekColumn";
import { getWeekPresentation } from "./lessonPlansPresentation";

interface DraggedPlanItem {
  itemId: string;
  fromWeekIndex: number;
}

interface WeeksBoardDesktopProps {
  weeks: WeekInfo[];
  plans: LessonPlan[];
  lessons: Lesson[];
  issueWeekIndexes: Set<number>;
  today: string;
  draggedLesson: Lesson | null;
  draggedItem: DraggedPlanItem | null;
  isReadOnly: boolean;
  onDropOnWeek: (weekIndex: number) => void;
  onDragStartItem: (itemId: string, weekIndex: number) => void;
  onDragEndItem: () => void;
  onStatusChange: (
    itemId: string,
    status: "IN_PROGRESS" | "DONE" | "SKIPPED" | "CANCELLED",
  ) => void;
  onEditNotes: (itemId: string, notesAr?: string, notesEn?: string) => void;
  onRemove: (itemId: string) => void;
  onEditPlan: (plan: LessonPlan) => void;
  onActivatePlan: (plan: LessonPlan) => void;
  onArchivePlan: (plan: LessonPlan) => void;
  onDeletePlan: (plan: LessonPlan) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
}

export default function WeeksBoardDesktop({
  weeks,
  plans,
  lessons,
  issueWeekIndexes,
  today,
  draggedLesson,
  draggedItem,
  isReadOnly,
  onDropOnWeek,
  onDragStartItem,
  onDragEndItem,
  onStatusChange,
  onEditNotes,
  onRemove,
  onEditPlan,
  onActivatePlan,
  onArchivePlan,
  onDeletePlan,
  onReorder,
}: WeeksBoardDesktopProps) {
  return (
    <div className="grid grid-cols-1 gap-3 pb-4 md:grid-cols-2 2xl:grid-cols-3">
      {weeks.map((week) => {
        const weekPlan = plans.find((p) => p.weekIndex === week.weekIndex);
        const planKey = `${week.weekIndex}-${weekPlan?.items.length || 0}`;
        const presentation = getWeekPresentation({
          week,
          itemCount: weekPlan?.items.length ?? 0,
          hasIssue: issueWeekIndexes.has(week.weekIndex),
          today,
        });

        return (
          <WeekColumn
            key={planKey}
            week={week}
            plan={weekPlan}
            lessons={lessons}
            isCurrent={presentation.isCurrent}
            hasIssue={presentation.hasIssue}
            onDrop={onDropOnWeek}
            onDragStartItem={onDragStartItem}
            onDragEndItem={onDragEndItem}
            onStatusChange={onStatusChange}
            onEditNotes={onEditNotes}
            onRemove={onRemove}
            onEditPlan={onEditPlan}
            onActivatePlan={onActivatePlan}
            onArchivePlan={onArchivePlan}
            onDeletePlan={onDeletePlan}
            onReorder={onReorder}
            isReadOnly={isReadOnly}
            isDragOver={
              (draggedLesson !== null || draggedItem !== null) && !isReadOnly
            }
          />
        );
      })}
    </div>
  );
}
