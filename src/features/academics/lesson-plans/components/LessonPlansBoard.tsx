"use client";

import { useState, useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMediaQuery, useTheme } from "@mui/material";
import {
  Lesson,
  Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  LessonPlan,
  WeekInfo,
  LessonPlanSummary,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import LessonLibrary from "./LessonLibrary";
import WeeksBoardDesktop from "./WeeksBoardDesktop";
import WeeksBoardMobile from "./WeeksBoardMobile";
import ProgressSummary from "./ProgressSummary";
import NotesDialog from "./NotesDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import {
  createLessonPlan,
  createLessonPlanItem,
  deleteLessonPlanItem,
  moveLessonPlanItem,
  updateLessonPlanItem,
  startLessonPlanItem,
  completeLessonPlanItem,
  skipLessonPlanItem,
  cancelLessonPlanItem,
  updateLessonPlan,
  activateLessonPlan,
  archiveLessonPlan,
  deleteLessonPlan,
  reorderLessonPlanItem,
  type UpdateLessonPlanRequest,
  type LessonPlanValidationResponseDto,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import EditLessonPlanDialog from "./EditLessonPlanDialog";
import SkipCancelReasonDialog from "./SkipCancelReasonDialog";
import MoveLessonDialog from "./MoveLessonDialog";
import { lessonPlansUiError } from "../services/lessonPlansErrors";
import { isDateOnlyInside } from "../services/lessonPlanDates";
import {
  deriveIssueWeekIndexes,
  filterLessonPlanWeeks,
  getDateOnlyToday,
  type WeekBoardFilter,
} from "./lessonPlansPresentation";

interface LessonPlansBoardProps {
  academicYearId: string;
  termId: string;
  termStartDate?: string;
  termEndDate?: string;
  teacherSubjectAllocationId: string;
  curriculumId: string;
  subjectId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  teacherId: string;
  lessons: Lesson[];
  units: Unit[];
  plans: LessonPlan[];
  weeks: WeekInfo[];
  summary: LessonPlanSummary | null;
  validation: LessonPlanValidationResponseDto | null;
  isReadOnly: boolean;
  librarySearchQuery: string;
  librarySelectedUnitId: string;
  onLibrarySearchQueryChange: (value: string) => void;
  onLibrarySelectedUnitIdChange: (value: string) => void;
  onUpdate: () => void;
  onSelectLessonFromLibrary?: (lesson: Lesson) => void;
  onAddLessonMobile?: (weekIndex: number) => void;
  validationMessages: {
    noInstructionalDays: string;
    weekOutsideTerm: string;
    plannedDateOutsideTerm: string;
  };
}

export default function LessonPlansBoard({
  termId,
  termStartDate,
  termEndDate,
  academicYearId,
  subjectId,
  teacherSubjectAllocationId,
  curriculumId,
  gradeId,
  sectionId,
  classroomId,
  teacherId,
  lessons,
  units,
  plans,
  weeks,
  summary,
  validation,
  isReadOnly,
  librarySearchQuery,
  librarySelectedUnitId,
  onLibrarySearchQueryChange,
  onLibrarySelectedUnitIdChange,
  onUpdate,
  onSelectLessonFromLibrary,
  onAddLessonMobile,
  validationMessages,
}: LessonPlansBoardProps) {
  const t = useTranslations("academics.lessonPlans");
  const locale = useLocale();
  const { showError, showSuccess } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Local loading state for operations
  const [isUpdating, setIsUpdating] = useState(false);
  const [weekFilter, setWeekFilter] = useState<WeekBoardFilter>("ALL");

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
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [planConfirmation, setPlanConfirmation] = useState<{
    plan: LessonPlan;
    action: "archive" | "delete";
  } | null>(null);
  const [reasonDialog, setReasonDialog] = useState<{
    itemId: string;
    action: "skip" | "cancel";
  } | null>(null);
  const [moveDialog, setMoveDialog] = useState<{
    itemId: string;
    targetWeek: WeekInfo;
    sortOrder: number;
  } | null>(null);

  // Drag state
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    itemId: string;
    fromWeekIndex: number;
  } | null>(null);

  // Handle drag from library
  const handleDragStartLesson = useCallback(
    (lesson: Lesson) => {
      if (isReadOnly) return;
      setDraggedLesson(lesson);
    },
    [isReadOnly],
  );

  const handleDragEndLesson = useCallback(() => {
    setDraggedLesson(null);
  }, []);

  // Handle drag from week
  const handleDragStartItem = useCallback(
    (itemId: string, weekIndex: number) => {
      if (isReadOnly) return;
      setDraggedItem({ itemId, fromWeekIndex: weekIndex });
    },
    [isReadOnly],
  );

  const handleDragEndItem = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // Handle drop on week
  const handleDropOnWeek = useCallback(
    async (weekIndex: number) => {
      if (isReadOnly || isUpdating) return;
      if (draggedLesson && onAddLessonMobile && onSelectLessonFromLibrary) {
        onAddLessonMobile(weekIndex);
        onSelectLessonFromLibrary(draggedLesson);
        setDraggedLesson(null);
        return;
      }
      setIsUpdating(true);
      try {
        if (draggedLesson) {
          // Adding new lesson from library
          const week = weeks.find(
            (candidate) => candidate.weekIndex === weekIndex,
          );
          if (!week) return;
          const plannedDate = week.instructionalDays[0];
          if (!plannedDate) {
            showError(validationMessages.noInstructionalDays);
            return;
          }
          if (
            week.startDate > week.endDate ||
            !isDateOnlyInside(week.startDate, termStartDate, termEndDate) ||
            !isDateOnlyInside(week.endDate, termStartDate, termEndDate)
          ) {
            showError(validationMessages.weekOutsideTerm);
            return;
          }
          if (!isDateOnlyInside(plannedDate, termStartDate, termEndDate)) {
            showError(validationMessages.plannedDateOutsideTerm);
            return;
          }
          let plan = plans.find(
            (candidate) =>
              candidate.weekIndex === weekIndex &&
              candidate.status !== "ARCHIVED",
          );
          if (!plan)
            plan = await createLessonPlan({
              academicYearId,
              termId,
              teacherSubjectAllocationId,
              teacherUserId: teacherId || undefined,
              classroomId: classroomId || undefined,
              subjectId,
              curriculumId,
              title: `${draggedLesson.title} — ${week.startDate}`,
              weekStartDate: week.startDate,
              weekEndDate: week.endDate,
            });
          await createLessonPlanItem({
            lessonPlanId: plan.id,
            payload: {
              unitId: draggedLesson.unitId,
              lessonId: draggedLesson.id,
              plannedDate,
              sortOrder: plan.items.length,
            },
          });
          setDraggedLesson(null); // Clear drag state immediately
          await onUpdate(); // Wait for update to complete
          showSuccess("Saved successfully");
        } else if (draggedItem) {
          // Moving existing item
          if (draggedItem.fromWeekIndex !== weekIndex) {
            const targetWeek = weeks.find(
              (week) => week.weekIndex === weekIndex,
            );
            if (!targetWeek) {
              showError("Target week not found.");
              return;
            }

            if (targetWeek.instructionalDays.length === 0) {
              showError(validationMessages.noInstructionalDays);
              return;
            }

            const targetPlan = plans.find(
              (plan) =>
                plan.weekIndex === weekIndex && plan.status !== "ARCHIVED",
            );

            setMoveDialog({
              itemId: draggedItem.itemId,
              targetWeek,
              sortOrder: targetPlan?.items.length ?? 0,
            });
            setDraggedItem(null);
          } else {
            setDraggedItem(null); // Clear drag state even if not moved
          }
        }
      } catch (error) {
        showError(lessonPlansUiError(error));
        // Clear drag state on error too
        setDraggedLesson(null);
        setDraggedItem(null);
      } finally {
        setIsUpdating(false);
      }
    },
    [
      isReadOnly,
      isUpdating,
      draggedLesson,
      draggedItem,
      termId,
      termStartDate,
      termEndDate,
      academicYearId,
      subjectId,
      classroomId,
      teacherId,
      teacherSubjectAllocationId,
      curriculumId,
      plans,
      weeks,
      validationMessages,
      showSuccess,
      showError,
      onUpdate,
      onAddLessonMobile,
      onSelectLessonFromLibrary,
    ],
  );

  const confirmMove = useCallback(
    async (payload: Parameters<typeof moveLessonPlanItem>[1]) => {
      if (!moveDialog) return;
      setIsUpdating(true);
      try {
        await moveLessonPlanItem(moveDialog.itemId, payload);
        await onUpdate();
        setMoveDialog(null);
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
      }
    },
    [moveDialog, onUpdate, showError, showSuccess],
  );

  // Handle status change
  const handleStatusChange = useCallback(
    async (
      itemId: string,
      status: "IN_PROGRESS" | "DONE" | "SKIPPED" | "CANCELLED",
    ) => {
      if (isReadOnly || isUpdating) return;
      if (status === "SKIPPED" || status === "CANCELLED") {
        setReasonDialog({
          itemId,
          action: status === "SKIPPED" ? "skip" : "cancel",
        });
        return;
      }

      setIsUpdating(true);
      try {
        const plan = plans.find((candidate) =>
          candidate.items.some((item) => item.id === itemId),
        );
        if (!plan) throw new Error("Lesson plan item was not found");
        const command = { lessonPlanId: plan.id, itemId };
        if (status === "IN_PROGRESS") await startLessonPlanItem(command);
        if (status === "DONE") await completeLessonPlanItem(command);
        await onUpdate(); // Wait for update to complete
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
      }
    },
    [isReadOnly, isUpdating, plans, showSuccess, showError, onUpdate],
  );

  const handleReasonConfirm = useCallback(
    async (note: string) => {
      if (!reasonDialog || isUpdating) return;
      const plan = plans.find((candidate) =>
        candidate.items.some((item) => item.id === reasonDialog.itemId),
      );
      if (!plan) return;
      setIsUpdating(true);
      try {
        const command = {
          lessonPlanId: plan.id,
          itemId: reasonDialog.itemId,
          payload: { note: note || null },
        };
        if (reasonDialog.action === "skip") await skipLessonPlanItem(command);
        else await cancelLessonPlanItem(command);
        setReasonDialog(null);
        await onUpdate();
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, onUpdate, plans, reasonDialog, showError, showSuccess],
  );

  const handleReorder = useCallback(
    async (itemId: string, direction: "up" | "down") => {
      if (isReadOnly || isUpdating) return;
      const plan = plans.find((candidate) =>
        candidate.items.some((item) => item.id === itemId),
      );
      if (!plan) return;
      const ordered = [...plan.items].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((item) => item.id === itemId);
      const target = ordered[index + (direction === "up" ? -1 : 1)];
      if (!target) return;
      setIsUpdating(true);
      try {
        await reorderLessonPlanItem({
          lessonPlanId: plan.id,
          itemId,
          payload: { sortOrder: target.order },
        });
        await onUpdate();
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
      }
    },
    [isReadOnly, isUpdating, onUpdate, plans, showError, showSuccess],
  );

  // Handle edit notes
  const handleEditNotes = useCallback(
    (itemId: string, notesAr?: string, notesEn?: string) => {
      setNotesDialog({ isOpen: true, itemId, notesAr, notesEn });
    },
    [],
  );

  const handleSaveNotes = useCallback(
    async (notesAr: string, notesEn: string) => {
      if (isUpdating) return;

      setIsUpdating(true);
      try {
        const plan = plans.find((candidate) =>
          candidate.items.some((item) => item.id === notesDialog.itemId),
        );
        if (!plan) throw new Error("Lesson plan item was not found");
        const notes =
          (locale === "ar" ? notesAr || notesEn : notesEn || notesAr) || null;
        await updateLessonPlanItem({
          lessonPlanId: plan.id,
          itemId: notesDialog.itemId,
          payload: { notes },
        });
        setNotesDialog({ isOpen: false, itemId: "" });
        await onUpdate(); // Wait for update to complete
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
      }
    },
    [
      isUpdating,
      locale,
      plans,
      notesDialog.itemId,
      showSuccess,
      showError,
      onUpdate,
    ],
  );

  // Handle remove
  const handleRemove = useCallback((itemId: string) => {
    setConfirmDialog({ isOpen: true, type: "remove", itemId });
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    if (!confirmDialog.itemId || isUpdating) return;

    setIsUpdating(true);
    try {
      const plan = plans.find((candidate) =>
        candidate.items.some((item) => item.id === confirmDialog.itemId),
      );
      if (!plan) throw new Error("Lesson plan item was not found");
      await deleteLessonPlanItem({
        lessonPlanId: plan.id,
        itemId: confirmDialog.itemId,
      });
      setConfirmDialog({ isOpen: false, type: null });
      await onUpdate(); // Wait for update to complete
      showSuccess("Saved successfully");
    } catch (error) {
      showError(lessonPlansUiError(error));
    } finally {
      setIsUpdating(false);
    }
  }, [
    isUpdating,
    plans,
    confirmDialog.itemId,
    showSuccess,
    showError,
    onUpdate,
  ]);

  const refreshAfterPlanMutation = useCallback(
    async (mutation: () => Promise<unknown>) => {
      if (isReadOnly || isUpdating) return;
      setIsUpdating(true);
      try {
        await mutation();
        await onUpdate();
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
      }
    },
    [isReadOnly, isUpdating, onUpdate, showError, showSuccess],
  );
  const handleSavePlan = useCallback(
    (payload: UpdateLessonPlanRequest) => {
      if (!editingPlan) return;
      void refreshAfterPlanMutation(async () => {
        await updateLessonPlan(editingPlan.id, payload);
        setEditingPlan(null);
      });
    },
    [editingPlan, refreshAfterPlanMutation],
  );
  const handleActivatePlan = useCallback(
    (plan: LessonPlan) =>
      void refreshAfterPlanMutation(() => activateLessonPlan(plan.id)),
    [refreshAfterPlanMutation],
  );
  const handleConfirmPlanAction = useCallback(() => {
    if (!planConfirmation) return;
    const { plan, action } = planConfirmation;
    void refreshAfterPlanMutation(async () => {
      if (action === "archive") await archiveLessonPlan(plan.id);
      else await deleteLessonPlan(plan.id);
      setPlanConfirmation(null);
    });
  }, [planConfirmation, refreshAfterPlanMutation]);

  // Calculate a hash of planned lesson IDs for key generation
  const plannedLessonsHash = useMemo(() => {
    const allLessonIds: string[] = [];
    plans.forEach((plan) => {
      plan.items.forEach((item) => {
        allLessonIds.push(item.lessonId);
      });
    });
    // Sort to ensure consistent hash
    return allLessonIds.sort().join(",");
  }, [plans]);

  const issueWeekIndexes = useMemo(
    () =>
      deriveIssueWeekIndexes({
        plans,
        issues: validation?.issues ?? [],
      }),
    [plans, validation?.issues],
  );
  const today = useMemo(() => getDateOnlyToday(), []);
  const visibleWeeks = useMemo(
    () =>
      filterLessonPlanWeeks({
        weeks,
        plans,
        issueWeekIndexes,
        filter: weekFilter,
        today,
      }),
    [issueWeekIndexes, plans, today, weekFilter, weeks],
  );
  const weekFilterOptions: Array<{ value: WeekBoardFilter; label: string }> = [
    { value: "ALL", label: t("boardFilters.all") },
    {
      value: "CURRENT_UPCOMING",
      label: t("boardFilters.currentUpcoming"),
    },
    { value: "PLANNED", label: t("boardFilters.planned") },
    { value: "ISSUES", label: t("boardFilters.issues") },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      {summary && <ProgressSummary summary={summary} />}

      {/* Main Board */}
      <div className={isMobile ? "space-y-4" : "flex gap-6"}>
        {/* Lesson Library - Desktop Only */}
        {!isMobile && (
          <div className="w-80 shrink-0 self-start sticky top-[calc(var(--header-height) + 1rem)]">
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
              onSelectLesson={onSelectLessonFromLibrary}
              isReadOnly={isReadOnly || isUpdating}
            />
          </div>
        )}

        {/* Weeks Grid/List */}
        <div className="flex-1">
          <p className="mb-3 text-sm text-gray-600">
            {t("week.totalWeeks", { count: weeks.length })}
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {weekFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={weekFilter === option.value ? "primary" : "secondary"}
                size="sm"
                type="button"
                aria-pressed={weekFilter === option.value}
                onClick={() => setWeekFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {weeks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("emptyState.noPlan.message")}</p>
            </div>
          ) : visibleWeeks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-gray-900">
                {t("week.noMatchingWeeks")}
              </p>
            </div>
          ) : isMobile ? (
            <WeeksBoardMobile
              key={plannedLessonsHash}
              weeks={visibleWeeks}
              plans={plans}
              lessons={lessons}
              issueWeekIndexes={issueWeekIndexes}
              today={today}
              isReadOnly={isReadOnly || isUpdating}
              onStatusChange={handleStatusChange}
              onEditPlan={setEditingPlan}
              onActivatePlan={handleActivatePlan}
              onArchivePlan={(plan) =>
                setPlanConfirmation({ plan, action: "archive" })
              }
              onDeletePlan={(plan) =>
                setPlanConfirmation({ plan, action: "delete" })
              }
              onReorder={handleReorder}
              onEditNotes={handleEditNotes}
              onRemove={handleRemove}
              onAddLesson={onAddLessonMobile || (() => {})}
            />
          ) : (
            <WeeksBoardDesktop
              weeks={visibleWeeks}
              plans={plans}
              lessons={lessons}
              issueWeekIndexes={issueWeekIndexes}
              today={today}
              draggedLesson={draggedLesson}
              draggedItem={draggedItem}
              isReadOnly={isReadOnly || isUpdating}
              onDropOnWeek={handleDropOnWeek}
              onDragStartItem={handleDragStartItem}
              onDragEndItem={handleDragEndItem}
              onStatusChange={handleStatusChange}
              onEditPlan={setEditingPlan}
              onActivatePlan={handleActivatePlan}
              onArchivePlan={(plan) =>
                setPlanConfirmation({ plan, action: "archive" })
              }
              onDeletePlan={(plan) =>
                setPlanConfirmation({ plan, action: "delete" })
              }
              onReorder={handleReorder}
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
      {editingPlan && (
        <EditLessonPlanDialog
          key={editingPlan.id}
          plan={editingPlan}
          termStartDate={termStartDate}
          termEndDate={termEndDate}
          onClose={() => setEditingPlan(null)}
          onSave={handleSavePlan}
          loading={isUpdating}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(planConfirmation)}
        onClose={() => setPlanConfirmation(null)}
        onConfirm={handleConfirmPlanAction}
        title={
          planConfirmation?.action === "delete"
            ? t("planConfirm.deleteTitle")
            : t("planConfirm.archiveTitle")
        }
        description={t("planConfirm.description")}
        confirmLabel={
          planConfirmation?.action === "delete"
            ? t("planConfirm.deleteConfirm")
            : t("planConfirm.archiveConfirm")
        }
        cancelLabel={t("planConfirm.cancel")}
        loading={isUpdating}
        severity={planConfirmation?.action === "delete" ? "danger" : "warning"}
      />
      <SkipCancelReasonDialog
        key={reasonDialog?.itemId ?? "reason-dialog"}
        action={reasonDialog?.action ?? null}
        onClose={() => setReasonDialog(null)}
        onConfirm={handleReasonConfirm}
        loading={isUpdating}
      />
      {moveDialog && (
        <MoveLessonDialog
          isOpen
          targetWeek={moveDialog.targetWeek}
          termStartDate={termStartDate}
          termEndDate={termEndDate}
          academicYearId={academicYearId}
          termId={termId}
          gradeId={gradeId}
          sectionId={sectionId}
          classroomId={classroomId}
          teacherUserId={teacherId}
          subjectId={subjectId}
          teacherSubjectAllocationId={teacherSubjectAllocationId}
          sortOrder={moveDialog.sortOrder}
          onClose={() => setMoveDialog(null)}
          onConfirm={confirmMove}
        />
      )}
    </div>
  );
}
