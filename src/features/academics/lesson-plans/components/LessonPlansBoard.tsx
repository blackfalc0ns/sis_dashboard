"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useMediaQuery, useTheme } from "@mui/material";
import { Lesson, Unit } from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlan, WeekInfo, LessonPlanSummary } from "@/features/academics/lesson-plans/services/lessonPlansService";
import LessonLibrary from "./LessonLibrary";
import WeeksBoardDesktop from "./WeeksBoardDesktop";
import WeeksBoardMobile from "./WeeksBoardMobile";
import ProgressSummary from "./ProgressSummary";
import NotesDialog from "./NotesDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useToast } from "@/components/ui/toast/Toast";
import {
  upsertLessonPlanItem,
  deleteLessonPlanItem,
  moveLessonPlanItem,
  updateLessonPlanItemStatus,
  updateLessonPlanItemNotes,
} from "@/features/academics/lesson-plans/services/lessonPlansService";

interface LessonPlansBoardProps {
  termId: string;
  sectionId: string;
  subjectId: string;
  classroomId: string;
  teacherId: string;
  lessons: Lesson[];
  units: Unit[];
  plans: LessonPlan[];
  weeks: WeekInfo[];
  summary: LessonPlanSummary | null;
  isReadOnly: boolean;
  librarySearchQuery: string;
  librarySelectedUnitId: string;
  onLibrarySearchQueryChange: (value: string) => void;
  onLibrarySelectedUnitIdChange: (value: string) => void;
  onUpdate: () => void;
  onAddLessonMobile?: (weekIndex: number) => void;
}

export default function LessonPlansBoard({
  termId,
  sectionId,
  subjectId,
  classroomId,
  teacherId,
  lessons,
  units,
  plans,
  weeks,
  summary,
  isReadOnly,
  librarySearchQuery,
  librarySelectedUnitId,
  onLibrarySearchQueryChange,
  onLibrarySelectedUnitIdChange,
  onUpdate,
  onAddLessonMobile,
}: LessonPlansBoardProps) {
  const t = useTranslations("academics.lessonPlans");
  const { showError, showSuccess } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
          classroomId: classroomId || undefined,
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
            weekIndex,
            undefined,
            classroomId || undefined
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
    classroomId,
    teacherId,
    showSuccess,
    showError,
    onUpdate,
  ]);

  // Handle status change
  const handleStatusChange = useCallback(async (
    itemId: string,
    status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED"
  ) => {
    if (isReadOnly || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateLessonPlanItemStatus(
        termId,
        sectionId,
        subjectId,
        itemId,
        status,
        classroomId || undefined
      );
      await onUpdate(); // Wait for update to complete
      showSuccess("Saved successfully");
    } catch (error) {
      console.error("Failed to update status:", error);
      showError("Failed to save");
    } finally {
      setIsUpdating(false);
    }
  }, [isReadOnly, isUpdating, termId, sectionId, subjectId, classroomId, showSuccess, showError, onUpdate]);

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
        notesEn,
        classroomId || undefined
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
    classroomId,
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
      await deleteLessonPlanItem(
        termId,
        sectionId,
        subjectId,
        confirmDialog.itemId,
        classroomId || undefined
      );
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
    classroomId,
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
      <div className={isMobile ? "space-y-4" : "flex gap-6"}>
        {/* Lesson Library - Desktop Only */}
        {!isMobile && (
          <div className="w-80 shrink-0">
            <LessonLibrary
              key={plannedLessonsHash}
              lessons={lessons}
              units={units}
              plans={plans}
              searchQuery={librarySearchQuery}
              selectedUnitId={librarySelectedUnitId}
              onSearchQueryChange={onLibrarySearchQueryChange}
              onSelectedUnitIdChange={onLibrarySelectedUnitIdChange}
              onDragStart={handleDragStartLesson}
              onDragEnd={handleDragEndLesson}
              isReadOnly={isReadOnly || isUpdating}
            />
          </div>
        )}

        {/* Weeks Grid/List */}
        <div className="flex-1">
          {weeks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("emptyState.noPlan.message")}</p>
            </div>
          ) : isMobile ? (
            <WeeksBoardMobile
              key={plannedLessonsHash}
              weeks={weeks}
              plans={plans}
              lessons={lessons}
              isReadOnly={isReadOnly || isUpdating}
              onStatusChange={handleStatusChange}
              onEditNotes={handleEditNotes}
              onRemove={handleRemove}
              onAddLesson={onAddLessonMobile || (() => {})}
            />
          ) : (
            <WeeksBoardDesktop
              weeks={weeks}
              plans={plans}
              lessons={lessons}
              draggedLesson={draggedLesson}
              draggedItem={draggedItem}
              isReadOnly={isReadOnly || isUpdating}
              onDropOnWeek={handleDropOnWeek}
              onDragStartItem={handleDragStartItem}
              onDragEndItem={handleDragEndItem}
              onStatusChange={handleStatusChange}
              onEditNotes={handleEditNotes}
              onRemove={handleRemove}
            />
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
