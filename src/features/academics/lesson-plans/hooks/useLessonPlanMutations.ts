"use client";

import { useCallback, useState } from "react";
import type { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import {
  createLessonPlan,
  createLessonPlanItem,
  type LessonPlan,
  type WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import { lessonPlansUiError } from "@/features/academics/lesson-plans/services/lessonPlansErrors";

interface Params {
  academicYearId: string;
  termId: string;
  selectedSubjectId: string;
  selectedClassroomId: string;
  assignedTeacherId: string;
  teacherSubjectAllocationId: string;
  curriculumId: string;
  lessons: Lesson[];
  plans: LessonPlan[];
  weeks: WeekInfo[];
  refreshPlans: () => Promise<void>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  onLessonSelected?: () => void;
}

export function useLessonPlanMutations(params: Params) {
  const [addLessonDialog, setAddLessonDialog] = useState<{
    isOpen: boolean;
    lesson: Lesson | null;
    preselectedWeekIndex?: number;
  }>({ isOpen: false, lesson: null });
  const handleSelectLessonFromLibrary = useCallback(
    (lesson: Lesson) => {
      setAddLessonDialog((current) => ({
        isOpen: true,
        lesson,
        preselectedWeekIndex: current.preselectedWeekIndex,
      }));
      params.onLessonSelected?.();
    },
    [params],
  );
  const handleAddLessonFromWeek = useCallback(
    (weekIndex: number) =>
      setAddLessonDialog((current) => ({
        ...current,
        preselectedWeekIndex: weekIndex,
      })),
    [],
  );
  const closeAddLessonDialog = useCallback(
    () => setAddLessonDialog({ isOpen: false, lesson: null }),
    [],
  );
  const handleConfirmAddLesson = useCallback(
    async (lessonId: string, weekIndex: number) => {
      const lesson = params.lessons.find(
        (candidate) => candidate.id === lessonId,
      );
      const week = params.weeks.find(
        (candidate) => candidate.weekIndex === weekIndex,
      );
      if (
        !lesson ||
        !week ||
        !params.teacherSubjectAllocationId ||
        !params.curriculumId
      ) {
        params.showError("Missing lesson plan context");
        return;
      }
      try {
        let plan = params.plans.find(
          (candidate) => candidate.weekIndex === weekIndex,
        );
        if (!plan)
          plan = await createLessonPlan({
            academicYearId: params.academicYearId,
            termId: params.termId,
            teacherSubjectAllocationId: params.teacherSubjectAllocationId,
            teacherUserId: params.assignedTeacherId || undefined,
            classroomId: params.selectedClassroomId || undefined,
            subjectId: params.selectedSubjectId || undefined,
            curriculumId: params.curriculumId,
            title: `${lesson.title} — ${week.startDate}`,
            weekStartDate: week.startDate,
            weekEndDate: week.endDate,
          });
        await createLessonPlanItem({
          lessonPlanId: plan.id,
          payload: {
            unitId: lesson.unitId,
            lessonId: lesson.id,
            plannedDate: week.startDate,
            sortOrder: plan.items.length,
          },
        });
        await params.refreshPlans();
        params.showSuccess("Saved successfully");
        setAddLessonDialog({ isOpen: false, lesson: null });
      } catch (error) {
        params.showError(lessonPlansUiError(error));
      }
    },
    [params],
  );
  return {
    addLessonDialog,
    handleSelectLessonFromLibrary,
    handleAddLessonFromWeek,
    handleConfirmAddLesson,
    closeAddLessonDialog,
  };
}
