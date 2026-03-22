"use client";

import { useCallback, useState } from "react";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { upsertLessonPlanItem } from "@/features/academics/lesson-plans/services/lessonPlansService";

interface UseLessonPlanMutationsParams {
  termId: string;
  selectedSectionId: string;
  selectedSubjectId: string;
  selectedClassroomId: string;
  assignedTeacherId: string;
  lessons: Lesson[];
  refreshPlans: () => Promise<void>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  onLessonSelected?: () => void;
}

export function useLessonPlanMutations({
  termId,
  selectedSectionId,
  selectedSubjectId,
  selectedClassroomId,
  assignedTeacherId,
  lessons,
  refreshPlans,
  showSuccess,
  showError,
  onLessonSelected,
}: UseLessonPlanMutationsParams) {
  const [addLessonDialog, setAddLessonDialog] = useState<{
    isOpen: boolean;
    lesson: Lesson | null;
    preselectedWeekIndex?: number;
  }>({ isOpen: false, lesson: null });

  const handleSelectLessonFromLibrary = useCallback((lesson: Lesson) => {
    setAddLessonDialog((prev) => ({
      isOpen: true,
      lesson,
      preselectedWeekIndex: prev.preselectedWeekIndex,
    }));
    onLessonSelected?.();
  }, [onLessonSelected]);

  const handleAddLessonFromWeek = useCallback((weekIndex: number) => {
    setAddLessonDialog((prev) => ({ ...prev, preselectedWeekIndex: weekIndex }));
  }, []);

  const closeAddLessonDialog = useCallback(() => {
    setAddLessonDialog({ isOpen: false, lesson: null });
  }, []);

  const handleConfirmAddLesson = useCallback(
    async (lessonId: string, weekIndex: number) => {
      if (!termId || !selectedSectionId || !selectedSubjectId) {
        console.error("Missing required IDs:", {
          termId,
          selectedSectionId,
          selectedSubjectId,
        });
        return;
      }

      try {
        const lesson = lessons.find((item) => item.id === lessonId);
        if (!lesson) {
          console.error("Lesson not found:", lessonId);
          return;
        }

        await upsertLessonPlanItem({
          termId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          classroomId: selectedClassroomId || undefined,
          teacherId: assignedTeacherId || undefined,
          weekIndex,
          lessonId: lesson.id,
          unitId: lesson.unitId,
          status: "PLANNED",
        });

        await refreshPlans();
        showSuccess("Saved successfully");
        setAddLessonDialog({ isOpen: false, lesson: null });
      } catch (error) {
        console.error("Failed to add lesson:", error);
        showError("Failed to save");
      }
    },
    [
      assignedTeacherId,
      lessons,
      refreshPlans,
      selectedSectionId,
      selectedClassroomId,
      selectedSubjectId,
      showError,
      showSuccess,
      termId,
    ]
  );

  return {
    addLessonDialog,
    handleSelectLessonFromLibrary,
    handleAddLessonFromWeek,
    handleConfirmAddLesson,
    closeAddLessonDialog,
  };
}
