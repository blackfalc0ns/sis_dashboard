"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Lesson, Unit } from "@/services/academics/curriculumService";
import { LessonPlan, WeekInfo, LessonPlanSummary } from "@/services/academics/lessonPlansService";
import LessonLibrary from "./LessonLibrary";
import WeekColumn from "./WeekColumn";
import ProgressSummary from "./ProgressSummary";
import NotesDialog from "./NotesDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useToast } from "@/components/ui/toast/Toast";
import {
  upsertLessonPlanItem,
  deleteLessonPlanItem,
  moveLessonPlanItem,
  reorderLessonPlanItems,
  updateLessonPlanItemStatus,
  updateLessonPlanItemNotes,
} from "@/services/academics/lessonPlansService";

interface LessonPlansBoardProps {
  termId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  lessons: Lesson[];
  units: Unit[];
  plans: LessonPlan[];
  weeks: WeekInfo[];
  summary: LessonPlanSummary | null;
  isReadOnly: boolean;
  onUpdate: () => void;
}

export default function LessonPlansBoard({
  termId,
  sectionId,
  subjectId,
  teacherId,
  lessons,
  units,
  plans,
  weeks,
  summary,
  isReadOnly,
  onUpdate,
}: LessonPlansBoardProps) {
  const t = useTranslations("academics.lessonPlans");
  const { showError, showSuccess } = useToast();

  // Local loading state for operations
  const [isUpdating, setIsUpdating] = useState(false);

  // Dialog states
  const [notesDialog, setNotesDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    notesAr?: string;
    notesEn?: string;
  }>({ isOpen: false, itemId: "" });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "remove" | null;
    itemId?: string;
  }>({ isOpen: false, type: null });

  // Drag state
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    itemId: string;
    fromWeekIndex: number;
  } | null>(null);

  // Handle drag from library
  const handleDragStartLesson = useCallback((lesson: Lesson) => {
    if (isReadOnly) return;
    setDraggedLesson(lesson);
  }, [isReadOnly]);

  const handleDragEndLesson = useCallback(() => {
    setDraggedLesson(null);
  }, []);

  // Handle drag from week
  const handleDragStartItem = useCallback((itemId: string, weekIndex: number) => {
    if (isReadOnly) return;
    setDraggedItem({ itemId, fromWeekIndex: weekIndex });
  }, [isReadOnly]);

  const handleDragEndItem = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // Handle drop on week
  const handleDropOnWeek = useCallback(async (weekIndex: number) => {
    if (isReadOnly || isUpdating) return;

    setIsUpdating(true);
    try {
      if (draggedLesson) {
        // Adding new lesson from library
        await upsertLessonPlanItem({
          termId,
          sectionId,
          subjectId,
          teacherId,
          weekIndex,
          lessonId: draggedLesson.id,
          unitId: draggedLesson.unitId,
          status: "PLANNED",
        });
        setDraggedLesson(null); // Clear drag state immediately
        await onUpdate(); // Wait for update to complete
        showSuccess("Saved successfully");
      } else if (draggedItem) {
        // Moving existing item
        if (draggedItem.fromWeekIndex !== weekIndex) {
          await moveLessonPlanItem(
            termId,
            sectionId,
            subjectId,
            draggedItem.itemId,
            weekIndex
          );
          setDraggedItem(null); // Clear drag state immediately
          await onUpdate(); // Wait for update to complete
          showSuccess("Saved successfully");
        } else {
          setDraggedItem(null); // Clear drag state even if not moved
        }
      }
    } catch (error) {
      console.error("Failed to drop:", error);
      showError("Failed to save");
      // Clear drag state on error too
      setDraggedLesson(null);
      setDraggedItem(null);
    } finally {
      setIsUpdating(false);
    }
  }, [
    isReadOnly,
    isUpdating,
    draggedLesson,
    draggedItem,
    termId,
    sectionId,
    subjectId,
    teacherId,
    showSuccess,
    showError,
    onUpdate,
  ]);

  // Handle reorder within week
  const handleReorderInWeek = useCallback(async (
    weekIndex: number,
    orderedItemIds: string[]
  ) => {
    if (isReadOnly) return;

    try {
      await reorderLessonPlanItems(termId, sectionId, subjectId, weekIndex, orderedItemIds);
      onUpdate();
    } catch (error) {
      console.error("Failed to reorder:", error);
      showError("Failed to save");
    }
  }, [isReadOnly, termId, sectionId, subjectId, showError, onUpdate]);

  // Handle status change
  const handleStatusChange = useCallback(async (
    itemId: string,
    status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED"
  ) => {
    if (isReadOnly || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateLessonPlanItemStatus(termId, sectionId, subjectId, itemId, status);
      await onUpdate(); // Wait for update to complete
      showSuccess("Saved successfully");
    } catch (error) {
      console.error("Failed to update status:", error);
      showError("Failed to save");
    } finally {
      setIsUpdating(false);
    }
  }, [isReadOnly, isUpdating, termId, sectionId, subjectId, showSuccess, showError, onUpdate]);

  // Handle edit notes
  const handleEditNotes = useCallback((
    itemId: string,
    notesAr?: string,
    notesEn?: string
  ) => {
    setNotesDialog({ isOpen: true, itemId, notesAr, notesEn });
  }, []);

  const handleSaveNotes = useCallback(async (notesAr: string, notesEn: string) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateLessonPlanItemNotes(
        termId,
        sectionId,
        subjectId,
        notesDialog.itemId,
        notesAr,
        notesEn
      );
      setNotesDialog({ isOpen: false, itemId: "" });
      await onUpdate(); // Wait for update to complete
      showSuccess("Saved successfully");
    } catch (error) {
      console.error("Failed to save notes:", error);
      showError("Failed to save");
    } finally {
      setIsUpdating(false);
    }
  }, [
    isUpdating,
    termId,
    sectionId,
    subjectId,
    notesDialog.itemId,
    showSuccess,
    showError,
    onUpdate,
  ]);

  // Handle remove
  const handleRemove = useCallback((itemId: string) => {
    setConfirmDialog({ isOpen: true, type: "remove", itemId });
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    if (!confirmDialog.itemId || isUpdating) return;

    setIsUpdating(true);
    try {
      await deleteLessonPlanItem(termId, sectionId, subjectId, confirmDialog.itemId);
      setConfirmDialog({ isOpen: false, type: null });
      await onUpdate(); // Wait for update to complete
      showSuccess("Saved successfully");
    } catch (error) {
      console.error("Failed to remove:", error);
      showError("Failed to save");
    } finally {
      setIsUpdating(false);
    }
  }, [
    isUpdating,
    termId,
    sectionId,
    subjectId,
    confirmDialog.itemId,
    showSuccess,
    showError,
    onUpdate,
  ]);

  // Calculate a hash of planned lesson IDs for key generation
  const plannedLessonsHash = useMemo(() => {
    const allLessonIds: string[] = [];
    plans.forEach((plan) => {
      plan.items.forEach((item) => {
        allLessonIds.push(item.lessonId);
      });
    });
    // Sort to ensure consistent hash
    return allLessonIds.sort().join(',');
  }, [plans]);

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      {summary && <ProgressSummary summary={summary} />}

      {/* Main Board */}
      <div className="flex gap-6">
        {/* Lesson Library */}
        <div className="w-80 shrink-0">
          <LessonLibrary
            key={plannedLessonsHash}
            lessons={lessons}
            units={units}
            plans={plans}
            onDragStart={handleDragStartLesson}
            onDragEnd={handleDragEndLesson}
            isReadOnly={isReadOnly || isUpdating}
          />
        </div>

        {/* Weeks Grid */}
        <div className="flex-1 overflow-x-auto">
          {weeks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("emptyState.noPlan.message")}</p>
            </div>
          ) : (
            <div className="flex gap-4 pb-4 flex-wrap">
              {weeks.map((week) => {
                const weekPlan = plans.find((p) => p.weekIndex === week.weekIndex);
                // Create a unique key that includes the plan items count to force re-render
                const planKey = `${week.weekIndex}-${weekPlan?.items.length || 0}`;
                return (
                  <WeekColumn
                    key={planKey}
                    week={week}
                    plan={weekPlan}
                    lessons={lessons}
                    onDrop={handleDropOnWeek}
                    onDragStartItem={handleDragStartItem}
                    onDragEndItem={handleDragEndItem}
                    onStatusChange={handleStatusChange}
                    onEditNotes={handleEditNotes}
                    onRemove={handleRemove}
                    isReadOnly={isReadOnly || isUpdating}
                    isDragOver={
                      (draggedLesson !== null || draggedItem !== null) &&
                      !isReadOnly &&
                      !isUpdating
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notes Dialog */}
      <NotesDialog
        isOpen={notesDialog.isOpen}
        notesAr={notesDialog.notesAr}
        notesEn={notesDialog.notesEn}
        onClose={() => setNotesDialog({ isOpen: false, itemId: "" })}
        onSave={handleSaveNotes}
      />

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null })}
        onConfirm={handleConfirmRemove}
        title={t("confirmRemove.title")}
        description={t("confirmRemove.message")}
        confirmLabel={t("confirmRemove.confirm")}
        cancelLabel={t("confirmRemove.cancel")}
        severity="danger"
      />
    </div>
  );
}
