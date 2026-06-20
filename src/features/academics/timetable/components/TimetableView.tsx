"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import {
  AlertCircle,
  Save,
  RotateCcw,
  Settings,
  Sparkles,
  Send,
  EyeOff,
  CheckCircle,
  Printer,
} from "lucide-react";
import FilterBar from "./FilterBar";
import TimetableGrid from "./TimetableGrid";
import ValidationPanel from "./ValidationPanel";
import EditSlotDialog from "./EditSlotDialog";
import GenerateDialog from "./GenerateDialog";
import TimetableConfigDialog from "./TimetableConfigDialog";
import { AccessDenied, Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useBrandingProfile } from "@/features/settings/hooks/useBrandingProfile";
import { resolveTeacherAllocationForTarget } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { type RoomAssignmentSource } from "@/features/academics/rooms/services/roomsService";
import { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import {
  timetableErrorMessage,
  type TimetableErrorCode,
} from "@/features/academics/timetable/services/timetableErrorHandling";
import { hasBlockingValidation } from "@/features/academics/timetable/services/timetableValidationSummary";
import {
  getDefaultRoomSuggestion as getSuggestedDefaultRoom,
  getRoomSource as resolveRoomSource,
} from "@/features/academics/timetable/utils/roomRecommendations";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { useTimetableData } from "@/features/academics/timetable/hooks/useTimetableData";
import { useTimetableGeneration } from "@/features/academics/timetable/hooks/useTimetableGeneration";
import type {
  Stage,
  Grade,
  Section,
  Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface TimetableViewProps {
  schoolId: string;
  termId: string;
  termStatus: "open" | "closed";
  isReadOnly: boolean;
  onDirtyChange: (dirty: boolean) => void;
  academicYearId?: string;
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  onStageChange: (stageId: string) => void;
  onGradeChange: (gradeId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onClassroomChange: (classroomId: string) => void;
  onNormalizeSelection: (selection: {
    stageId: string;
    gradeId: string;
    sectionId: string;
    classroomId: string;
  }) => void;
}

export default function TimetableView({
  schoolId,
  termId,
  termStatus,
  isReadOnly,
  onDirtyChange,
  academicYearId = "",
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  onStageChange,
  onGradeChange,
  onSectionChange,
  onClassroomChange,
  onNormalizeSelection,
}: TimetableViewProps) {
  const t = useTranslations("academics.timetable");
  const tRoot = useTranslations();
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { profile: brandingProfile } = useBrandingProfile();
  const canViewTimetable = hasPermission("academics.structure.view");
  const translateTimetableError = useCallback(
    (code: TimetableErrorCode) =>
      t(`errors.${code.replace("academics.timetable.", "")}`),
    [t],
  );
  const timetableMessages = useMemo(
    () => ({
      loadFailed: t("errors.loadFailed"),
      saveFailed: t("errors.saveFailed"),
      publishFailed: t("errors.publishFailed"),
      unpublishFailed: t("errors.unpublishFailed"),
      noConfigSelected: t("errors.noConfigSelected"),
      noFilledSlotsToSave: t("errors.noFilledSlotsToSave"),
      noFilledSlotsToPublish: t("errors.noFilledSlotsToPublish"),
      resolveConflictsBeforeSaving: t("errors.resolveConflictsBeforeSaving"),
      resolveConflictsBeforePublishing: t(
        "errors.resolveConflictsBeforePublishing",
      ),
      missingTeacherAllocation: t("errors.invalid_teacher_allocation"),
    }),
    [t],
  );

  const [isDirty, setIsDirty] = useState(false);
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [printTimestamp, setPrintTimestamp] = useState("");
  const printMatrixRef = useRef<HTMLDivElement | null>(null);

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    dayKey: string;
    periodIndex: number;
    sectionId: string;
    classroomId: string;
    entry?: TimetableEntry;
  } | null>(null);

  // Generate Dialog State
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Confirm Dialog State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishWithErrors, setPublishWithErrors] = useState(false);

  // We need to fetch dependencies before we can normalize.
  // We can pass a preliminary normalized state to useTimetableData to prevent premature timetable loading.
  const [internalStages, setInternalStages] = useState<Stage[]>([]);
  const [internalGrades, setInternalGrades] = useState<Grade[]>([]);
  const [internalSections, setInternalSections] = useState<Section[]>([]);
  const [internalClassrooms, setInternalClassrooms] = useState<Classroom[]>([]);

  const isScopeSelectionNormalized = useMemo(() => {
    // If dependencies haven't loaded yet, return false UNLESS we have NO selection at all
    if (
      internalStages.length === 0 &&
      internalGrades.length === 0 &&
      internalSections.length === 0
    ) {
      return (
        !selectedStageId &&
        !selectedGradeId &&
        !selectedSectionId &&
        !selectedClassroomId
      );
    }

    const normalizedStageId = internalStages.some(
      (stage) => stage.id === selectedStageId,
    )
      ? selectedStageId
      : "";
    const normalizedGradeId = internalGrades.some(
      (grade) =>
        grade.id === selectedGradeId &&
        (!normalizedStageId || grade.stageId === normalizedStageId),
    )
      ? selectedGradeId
      : "";
    const normalizedSectionId = internalSections.some(
      (section) =>
        section.id === selectedSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId),
    )
      ? selectedSectionId
      : "";
    const normalizedClassroomId = internalClassrooms.some(
      (classroom) =>
        classroom.id === selectedClassroomId &&
        (!normalizedSectionId || classroom.sectionId === normalizedSectionId),
    )
      ? selectedClassroomId
      : "";

    return (
      normalizedStageId === selectedStageId &&
      normalizedGradeId === selectedGradeId &&
      normalizedSectionId === selectedSectionId &&
      normalizedClassroomId === selectedClassroomId
    );
  }, [
    internalStages,
    internalGrades,
    internalSections,
    internalClassrooms,
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
  ]);

  const {
    stages,
    grades,
    sections,
    classrooms,
    subjects,
    subjectAllocations,
    teachers,
    teacherAllocations,
    rooms,
    roomDefaults,
    timetableEntries,
    setTimetableEntries,
    allTermEntries,
    resolvedConfig,
    config,
    periods,
    apiError,
    isLoading,
    dependenciesLoading,
    timetableLoading,
    isSaving,
    isPublished,
    conflicts: backendConflicts,
    validationSummary,
    reloadConfigs,
    loadTimetable,
    loadConflicts,
    loadValidation,
    loadPublication,
    saveTimetable,
    publishCurrentTimetable,
    unpublishCurrentTimetable,
  } = useTimetableData({
    schoolId,
    termId,
    academicYearId,
    enabled: canViewTimetable,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    isScopeSelectionNormalized,
    showToast,
    translateErrorCode: translateTimetableError,
    messages: timetableMessages,
  });

  // Sync internal refs for normalization
  useEffect(() => {
    setInternalStages(stages);
    setInternalGrades(grades);
    setInternalSections(sections);
    setInternalClassrooms(classrooms);
  }, [stages, grades, sections, classrooms]);
  const { handleGenerate, applyGenerated } = useTimetableGeneration({
    termId,
    selectedSectionId,
    selectedClassroomId,
    resolvedConfig,
    sections,
    subjects,
    subjectAllocations,
    teacherAllocations,
    teachers,
    rooms,
    roomDefaults,
    allTermEntries,
    setTimetableEntries,
    markDirty: () => setIsDirty(true),
    showApplied: (count) =>
      showToast(t("generate.result.applied", { count }), "success"),
  });
  const configIsDraft =
    !config || String(config.status).toLowerCase() === "draft";
  const canManageTimetable =
    canViewTimetable && hasPermission("academics.structure.manage");
  const canWriteTimetable =
    canManageTimetable && termStatus !== "closed" && !isReadOnly;
  const canCreateConfig = canWriteTimetable && configIsDraft;
  const canEditTimetable = canWriteTimetable && configIsDraft;
  const readOnlyBanner = readOnlyBannerMessage({
    configStatus: config?.status,
    termStatus,
    closedTermMessage: t("readOnly.closedTerm"),
    publishedLockedMessage: t("readOnly.publishedLocked"),
  });

  // Update dirty state
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (stages.length === 0 && grades.length === 0 && sections.length === 0) {
      return;
    }

    const normalizedStageId = stages.some(
      (stage) => stage.id === selectedStageId,
    )
      ? selectedStageId
      : "";

    const normalizedGradeId = grades.some(
      (grade) =>
        grade.id === selectedGradeId &&
        (!normalizedStageId || grade.stageId === normalizedStageId),
    )
      ? selectedGradeId
      : "";

    const normalizedSectionId = sections.some(
      (section) =>
        section.id === selectedSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId),
    )
      ? selectedSectionId
      : "";

    const normalizedClassroomId = classrooms.some(
      (classroom) =>
        classroom.id === selectedClassroomId &&
        (!normalizedSectionId || classroom.sectionId === normalizedSectionId),
    )
      ? selectedClassroomId
      : "";

    if (
      normalizedStageId === selectedStageId &&
      normalizedGradeId === selectedGradeId &&
      normalizedSectionId === selectedSectionId &&
      normalizedClassroomId === selectedClassroomId
    ) {
      return;
    }

    onNormalizeSelection({
      stageId: normalizedStageId,
      gradeId: normalizedGradeId,
      sectionId: normalizedSectionId,
      classroomId: normalizedClassroomId,
    });
  }, [
    classrooms,
    grades,
    onNormalizeSelection,
    sections,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    selectedStageId,
    stages,
  ]);

  // Helper function to check if a day is a holiday
  const isHolidayDay = useCallback(
    (dayKey: string): boolean => {
      if (!resolvedConfig) {
        return dayKey === "fri" || dayKey === "sat";
      }
      const day = resolvedConfig.days.find((item) => item.key === dayKey);
      return day ? !day.isActive : false;
    },
    [resolvedConfig],
  );

  const handleSlotClick = (
    dayKey: string,
    periodIndex: number,
    targetClassroomId = selectedClassroomId,
  ) => {
    if (!canEditTimetable) return;

    const targetClassroom = classrooms.find(
      (classroom) => classroom.id === targetClassroomId,
    );
    if (!targetClassroom) {
      showToast(t("validation.selectClassroomBeforeEdit"), "error");
      return;
    }

    const period = resolvedConfig?.periods.find(
      (item) => item.index === periodIndex,
    );
    if (period?.isInstructional === false) {
      return;
    }

    // Prevent editing on holiday days
    if (isHolidayDay(dayKey)) {
      showToast(t("validation.cannotEditHoliday"), "error");
      return;
    }

    const entry = timetableEntries.find(
      (e) =>
        e.classroomId === targetClassroom.id &&
        e.dayKey === dayKey &&
        e.periodIndex === periodIndex,
    );
    setEditingSlot({
      dayKey,
      periodIndex,
      sectionId: targetClassroom.sectionId,
      classroomId: targetClassroom.id,
      entry,
    });
    setEditDialogOpen(true);
  };

  const handleSlotSave = async (
    dayKey: string,
    periodIndex: number,
    subjectId: string | null,
    teacherId: string | null,
    roomId: string | null,
    slotType?: "CLASS" | "BREAK",
    breakLabelAr?: string,
    breakLabelEn?: string,
  ) => {
    // Update local state
    if (!editingSlot) {
      return;
    }

    const updatedEntries = [...timetableEntries];
    const existingIndex = updatedEntries.findIndex(
      (e) =>
        e.classroomId === editingSlot.classroomId &&
        e.dayKey === dayKey &&
        e.periodIndex === periodIndex,
    );

    const newEntry: TimetableEntry = {
      id:
        existingIndex >= 0
          ? updatedEntries[existingIndex].id
          : `temp-${Date.now()}`,
      termId,
      sectionId: editingSlot.sectionId,
      classroomId: editingSlot.classroomId,
      dayKey,
      periodIndex,
      slotType: slotType || "CLASS",
      subjectId,
      teacherId,
      roomId,
      breakLabelAr,
      breakLabelEn,
      status: "DRAFT",
    };

    if (existingIndex >= 0) {
      updatedEntries[existingIndex] = newEntry;
    } else {
      updatedEntries.push(newEntry);
    }

    setTimetableEntries(updatedEntries);
    setIsDirty(true);
    setEditDialogOpen(false);
  };

  const handleSave = async () => {
    if (!hasTimetableTarget || !canEditTimetable) return;

    const saveResult = await saveTimetable(timetableEntries);
    if (saveResult.ok) {
      setIsDirty(false);
      showToast(t("actions.saveSuccess"), "success");
    } else {
      if (saveResult.hasConflicts) {
        setValidationPanelOpen(true);
      }
      showToast(saveResult.error ?? t("actions.saveError"), "error");
    }
  };

  const handlePublish = async () => {
    if (!hasTimetableTarget || !canWriteTimetable) return;

    // Check for unsaved changes
    if (isDirty) {
      showToast(t("publish.unsavedChanges"), "error");
      return;
    }

    setIsPublishing(true);
    try {
      const [publicationReadiness, nextValidation, nextConflicts] =
        await Promise.all([
          loadPublication(),
          loadValidation(),
          loadConflicts(),
        ]);
      if (
        publicationReadiness?.canPublish !== true ||
        hasBlockingValidation(nextValidation) ||
        nextConflicts.length > 0
      ) {
        setValidationPanelOpen(true);
        showToast(
          readinessReasonText(publicationReadiness?.blockingReasons?.[0]) ??
            nextValidation.blockingReasons[0] ??
            t("publish.notReady"),
          "error",
        );
        return;
      }
      setPublishWithErrors(nextValidation.warnings.length > 0);
      setPublishConfirmOpen(true);
    } catch (error) {
      console.error("Failed to check timetable publication readiness:", error);
      showToast(
        timetableErrorMessage(
          error,
          t("publish.readinessError"),
          translateTimetableError,
        ),
        "error",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const readinessReasonText = (
    reason: string | { message?: string } | undefined,
  ): string | undefined =>
    typeof reason === "string" ? reason : reason?.message;

  const confirmPublish = async () => {
    if (!hasTimetableTarget || !canWriteTimetable) return;

    setIsPublishing(true);
    try {
      const publishResult = await publishCurrentTimetable(timetableEntries);
      if (!publishResult.ok) {
        if (publishResult.hasConflicts) {
          setValidationPanelOpen(true);
        }
        showToast(publishResult.error ?? t("publish.error"), "error");
        return;
      }
      showToast(t("publish.success"), "success");
    } catch (error) {
      console.error("Failed to publish timetable:", error);
      showToast(
        timetableErrorMessage(
          error,
          t("publish.error"),
          translateTimetableError,
        ),
        "error",
      );
    } finally {
      setIsPublishing(false);
      setPublishConfirmOpen(false);
    }
  };

  const handleUnpublish = async () => {
    if (!hasTimetableTarget || !canWriteTimetable) return;

    setIsUnpublishing(true);
    try {
      const unpublished = await unpublishCurrentTimetable();
      if (!unpublished) {
        throw new Error("UNPUBLISH_FAILED");
      }
      showToast(t("unpublish.success"), "success");
    } catch (error) {
      console.error("Failed to unpublish timetable:", error);
      showToast(
        apiError ??
          timetableErrorMessage(
            error,
            t("unpublish.error"),
            translateTimetableError,
          ),
        "error",
      );
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleReset = () => {
    if (!canEditTimetable) return;
    setResetConfirmOpen(true);
  };

  const confirmReset = async () => {
    if (!hasTimetableTarget || !canEditTimetable) return;

    try {
      await loadTimetable();
      setIsDirty(false);
      showToast(t("actions.resetSuccess"), "success");
    } catch (error) {
      console.error("Failed to reset timetable:", error);
      showToast(
        timetableErrorMessage(
          error,
          t("actions.resetError"),
          translateTimetableError,
        ),
        "error",
      );
    } finally {
      setResetConfirmOpen(false);
    }
  };

  const getDefaultTeacher = (subjectId: string): string | null => {
    const targetSectionId = editingSlot?.sectionId || selectedSectionId;
    const targetClassroomId = editingSlot?.classroomId || selectedClassroomId;
    if (!targetSectionId || !targetClassroomId) return null;

    const allocation = resolveTeacherAllocationForTarget(teacherAllocations, {
      sectionId: targetSectionId,
      classroomId: targetClassroomId,
      subjectId,
    });
    return allocation?.teacherId || null;
  };

  const getDefaultRoomSuggestion = (
    subjectId: string,
  ): {
    roomId: string | null;
    source: Exclude<RoomAssignmentSource, "MANUAL"> | null;
  } =>
    getSuggestedDefaultRoom({
      subjectId,
      subjects,
      rooms,
      roomDefaults,
      selectedSectionId:
        editingSlot?.sectionId || selectedSectionId || undefined,
      selectedClassroomId:
        editingSlot?.classroomId || selectedClassroomId || undefined,
      selectedClassroom: editingClassroom,
    });

  const getRoomSource = (
    roomId: string | null,
    subjectId?: string,
  ): RoomAssignmentSource | null =>
    resolveRoomSource({
      roomId,
      subjectId,
      subjects,
      rooms,
      roomDefaults,
      selectedSectionId:
        editingSlot?.sectionId || selectedSectionId || undefined,
      selectedClassroomId:
        editingSlot?.classroomId || selectedClassroomId || undefined,
      selectedClassroom: editingClassroom,
    });

  const selectedStage = selectedStageId
    ? stages.find((item) => item.id === selectedStageId)
    : undefined;
  const selectedGrade = selectedGradeId
    ? grades.find((item) => item.id === selectedGradeId)
    : undefined;
  const selectedSection = selectedSectionId
    ? sections.find((item) => item.id === selectedSectionId)
    : undefined;
  const selectedClassroom = selectedClassroomId
    ? classrooms.find((item) => item.id === selectedClassroomId)
    : undefined;
  const hasTimetableTarget = Boolean(
    selectedGradeId || selectedSectionId || selectedClassroomId,
  );
  const editingClassroom = editingSlot
    ? classrooms.find((item) => item.id === editingSlot.classroomId)
    : selectedClassroom;
  const displayedClassrooms = useMemo(() => {
    if (selectedClassroom) {
      return [selectedClassroom];
    }
    if (selectedSectionId) {
      return classrooms.filter(
        (classroom) => classroom.sectionId === selectedSectionId,
      );
    }
    if (selectedGradeId) {
      const sectionIdsForGrade = new Set(
        sections
          .filter((section) => section.gradeId === selectedGradeId)
          .map((section) => section.id),
      );
      return classrooms.filter((classroom) =>
        sectionIdsForGrade.has(classroom.sectionId),
      );
    }
    return [];
  }, [
    classrooms,
    sections,
    selectedClassroom,
    selectedGradeId,
    selectedSectionId,
  ]);

  const handleValidationOpen = useCallback(async () => {
    setIsValidating(true);
    try {
      await Promise.all([loadValidation(), loadConflicts()]);
    } catch (error) {
      console.error("Failed to load timetable conflicts:", error);
      showToast(t("validation.loadError"), "error");
    } finally {
      setIsValidating(false);
      setValidationPanelOpen(true);
    }
  }, [loadConflicts, loadValidation, showToast, t]);

  const hasRoomConflictForSlot = useCallback(
    (
      dayKey: string,
      periodIndex: number,
      roomId: string,
      entryId?: string,
    ): boolean =>
      timetableEntries.some(
        (entry) =>
          entry.roomId === roomId &&
          entry.dayKey === dayKey &&
          entry.periodIndex === periodIndex &&
          entry.id !== entryId,
      ),
    [timetableEntries],
  );

  const getDisplayName = useCallback(
    (entity?: { name?: string; nameAr?: string; nameEn?: string }) => {
      if (!entity) return "";
      return locale === "ar"
        ? entity.nameAr || entity.nameEn || entity.name || ""
        : entity.nameEn || entity.nameAr || entity.name || "";
    },
    [locale],
  );

  const configSourceLabel = resolvedConfig
    ? t(`config.scope.${resolvedConfig.source.scope.toLowerCase()}`)
    : "";

  const handleExport = (format: AcademicsExportFormat) => {
    if (!hasTimetableTarget || !resolvedConfig) return;

    const columns: ExportColumn[] = [
      { key: "classroom", label: t("target.classroom") },
      { key: "day", label: t("grid.day") },
      { key: "period", label: t("grid.period") },
      { key: "slotType", label: t("editSlot.slotType") },
      { key: "subject", label: t("editSlot.subject") },
      { key: "teacher", label: t("editSlot.teacher") },
      { key: "room", label: t("editSlot.room") },
      { key: "status", label: t("export.status") },
    ];

    const rows = displayedClassrooms.flatMap((classroom) =>
      resolvedConfig.days
        .filter((day) => day.isActive)
        .flatMap((day) =>
          resolvedConfig.periods.map((period) => {
            const entry = timetableEntries.find(
              (item) =>
                item.classroomId === classroom.id &&
                item.dayKey === day.key &&
                item.periodIndex === period.index,
            );
            const subject = entry?.subjectId
              ? subjects.find((item) => item.id === entry.subjectId)
              : undefined;
            const teacher = entry?.teacherId
              ? teachers.find((item) => item.id === entry.teacherId)
              : undefined;
            const room = entry?.roomId
              ? rooms.find((item) => item.id === entry.roomId)
              : undefined;

            return {
              classroom: getDisplayName(classroom),
              day: locale === "ar" ? day.nameAr : day.nameEn,
              period: locale === "ar" ? period.nameAr : period.nameEn,
              slotType:
                entry?.slotType === "BREAK"
                  ? t("editSlot.break")
                  : t("editSlot.class"),
              subject: subject ? getDisplayName(subject) : "",
              teacher: teacher ? getDisplayName(teacher) : "",
              room: room ? getDisplayName(room) : "",
              status:
                entry?.status === "PUBLISHED"
                  ? t("export.published")
                  : t("export.draft"),
            };
          }),
        ),
    );

    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      stageName: getDisplayName(selectedStage) || undefined,
      termName: termId,
      gradeName: getDisplayName(selectedGrade) || undefined,
      sectionName: getDisplayName(selectedSection) || undefined,
      classroomName: getDisplayName(selectedClassroom) || undefined,
      configSource: configSourceLabel || undefined,
      exportDate: formatExportDate(locale),
    };

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename(
        "timetable",
        termId,
        selectedClassroomId ||
          selectedSectionId ||
          selectedGradeId ||
          undefined,
      ),
      format,
      columns,
      rows,
      locale,
      jsonData: {
        title: t("title"),
        metadata,
        rows,
      },
    });
  };

  const schoolName = brandingProfile?.schoolName.trim() || tRoot("school_name");
  const printLogoUrl = "/images/logo/moazzez_logo.svg";

  const selectedPrintTarget = useMemo(() => {
    if (selectedClassroom) {
      return {
        label: t("target.classroom"),
        name: getDisplayName(selectedClassroom),
      };
    }
    if (selectedSection) {
      return {
        label: t("target.section"),
        name: getDisplayName(selectedSection),
      };
    }
    if (selectedGrade) {
      return {
        label: t("target.grade"),
        name: getDisplayName(selectedGrade),
      };
    }
    if (selectedStage) {
      return {
        label: t("target.stage"),
        name: getDisplayName(selectedStage),
      };
    }
    return null;
  }, [
    getDisplayName,
    selectedClassroom,
    selectedGrade,
    selectedSection,
    selectedStage,
    t,
  ]);

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printedAt = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
    setPrintTimestamp(printedAt);

    const originalTitle = document.title;
    document.title = "\u00A0";
    const periodCount = resolvedConfig?.periods.length ?? 1;
    const estimatedMatrixHeight = 54 + periodCount * 34;
    const printableHeight = 710;
    const scale = Math.min(1, printableHeight / estimatedMatrixHeight);
    printMatrixRef.current?.style.setProperty(
      "--timetable-print-scale",
      String(Math.max(0.35, Number(scale.toFixed(2)))),
    );

    window.setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 0);
  };

  if (!canViewTimetable) {
    return (
      <div className="flex h-full items-start justify-center p-6">
        <AccessDenied
          className="max-w-md"
          title={t("accessDenied.title")}
          description={t("accessDenied.description")}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <MainLoader />
      </div>
    );
  }

  if (grades.length === 0 && stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("emptyState.noGrades.title")}
        </h3>
        <p className="text-gray-500 mb-4">{t("emptyState.noGrades.message")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 3mm;
          }

          html,
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden !important;
          }

          .timetable-print-matrix,
          .timetable-print-matrix * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .timetable-print-matrix {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            font-size: 8px !important;
            display: block !important;
            direction: ltr !important;
          }

          .timetable-print-page-inner {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 3mm !important;
            box-sizing: border-box !important;
            position: relative !important;
            transform: scale(var(--timetable-print-scale, 1)) !important;
            transform-origin: top center !important;
          }

          .timetable-print-header {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 12px !important;
            margin-bottom: 4px !important;
            padding-bottom: 3px !important;
            border-bottom: 1px solid #d1d5db !important;
          }

          .timetable-print-school {
            max-width: 45% !important;
            text-align: start !important;
          }

          .timetable-print-logo {
            width: 64px !important;
            height: auto !important;
            object-fit: contain !important;
          }

          .timetable-print-target {
            display: block !important;
            margin: 0 0 4px !important;
            padding: 3px 6px !important;
            border: 1px solid #d1d5db !important;
            background: #f8fafc !important;
            text-align: center !important;
            font-weight: 600 !important;
            color: #111827 !important;
            font-size: 9px !important;
          }

          .timetable-print-footer {
            position: absolute !important;
            bottom: 1mm !important;
            inset-inline-start: 3mm !important;
            display: block !important;
            color: #4b5563 !important;
            font-size: 8px !important;
          }

          .timetable-print-content {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          .timetable-print-matrix .hidden.lg\\:block {
            display: block !important;
          }

          .timetable-print-matrix .lg\\:hidden {
            display: none !important;
          }

          .timetable-print-matrix .overflow-x-auto {
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .timetable-print-matrix table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            font-size: 7px !important;
            line-height: 1.08 !important;
          }

          .timetable-print-rtl table {
            direction: rtl !important;
          }

          .timetable-print-ltr table {
            direction: ltr !important;
          }

          .timetable-print-matrix th,
          .timetable-print-matrix td {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            padding: 0 !important;
            vertical-align: top !important;
            overflow: hidden !important;
          }

          .timetable-print-matrix th {
            padding: 2px 3px !important;
            min-width: 0 !important;
            text-align: center !important;
          }

          .timetable-print-matrix [class*="min-w-"] {
            min-width: 0 !important;
          }

          .timetable-print-matrix td > div {
            min-height: 0 !important;
            padding: 2px 3px !important;
          }

          .timetable-print-matrix td,
          .timetable-print-matrix th,
          .timetable-print-matrix td * {
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }

          .timetable-print-matrix th:first-child,
          .timetable-print-matrix td:first-child {
            width: 16mm !important;
            min-width: 16mm !important;
            max-width: 16mm !important;
          }

          .timetable-print-matrix [class*="min-h-"] {
            min-height: 0 !important;
          }

          .timetable-print-matrix .text-base,
          .timetable-print-matrix .text-sm,
          .timetable-print-matrix .text-xs {
            font-size: 7px !important;
            line-height: 1.1 !important;
          }

          .timetable-print-matrix .gap-1,
          .timetable-print-matrix .gap-1\\.5,
          .timetable-print-matrix .gap-2,
          .timetable-print-matrix .gap-3 {
            gap: 2px !important;
          }

          .timetable-print-matrix .mb-1,
          .timetable-print-matrix .mb-2,
          .timetable-print-matrix .mt-1,
          .timetable-print-matrix .mt-0\\.5 {
            margin-top: 1px !important;
            margin-bottom: 1px !important;
          }

          .timetable-print-matrix svg {
            width: 8px !important;
            height: 8px !important;
          }

          .timetable-print-matrix .line-clamp-1,
          .timetable-print-matrix .line-clamp-2 {
            overflow: hidden !important;
            display: block !important;
            -webkit-line-clamp: unset !important;
            -webkit-box-orient: unset !important;
          }

          .timetable-print-matrix .sticky {
            position: static !important;
          }

          .timetable-print-matrix .shadow-sm {
            box-shadow: none !important;
          }

          .timetable-print-rtl .text-left {
            text-align: right !important;
          }

          .timetable-print-ltr .text-left {
            text-align: left !important;
          }
        }
      `}</style>
      {/* Filter Bar */}
      <div className="print:hidden">
        <FilterBar
          stages={stages}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
          selectedStageId={selectedStageId}
          selectedGradeId={selectedGradeId}
          selectedSectionId={selectedSectionId}
          selectedClassroomId={selectedClassroomId}
          onStageChange={onStageChange}
          onGradeChange={onGradeChange}
          onSectionChange={onSectionChange}
          onClassroomChange={onClassroomChange}
          locale={locale}
        />
      </div>

      {hasTimetableTarget && (
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                {t("target.label")}
              </span>
              {selectedStage && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {t("target.stage")}: {getDisplayName(selectedStage)}
                </span>
              )}
              {selectedGrade && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {t("target.grade")}: {getDisplayName(selectedGrade)}
                </span>
              )}
              {selectedSection && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {t("target.section")}: {getDisplayName(selectedSection)}
                </span>
              )}
              {selectedClassroom && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {t("target.classroom")}: {getDisplayName(selectedClassroom)}
                </span>
              )}
            </div>
            {resolvedConfig && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">{t("target.configSource")}:</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                  {configSourceLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {hasTimetableTarget && readOnlyBanner && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:px-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{readOnlyBanner}</span>
          </div>
        </div>
      )}

      {hasTimetableTarget && apiError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 lg:px-6 print:hidden">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {hasTimetableTarget && (
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 print:hidden">
          {/* Desktop: Horizontal layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {canManageTimetable && (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={
                      !isDirty ||
                      isSaving ||
                      !canEditTimetable ||
                      !resolvedConfig
                    }
                    variant="primary"
                    loading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {isSaving ? t("actions.saving") : t("actions.save")}
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={!isDirty || !canEditTimetable || !resolvedConfig}
                    variant="secondary"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    {t("actions.reset")}
                  </Button>
                  <Button
                    onClick={() => setConfigDialogOpen(true)}
                    disabled={!canEditTimetable}
                    variant="secondary"
                    leftIcon={<Settings className="w-4 h-4" />}
                  >
                    {t("config.button")}
                  </Button>
                  <Button
                    onClick={() => setGenerateDialogOpen(true)}
                    disabled={
                      !canEditTimetable ||
                      !resolvedConfig ||
                      !selectedClassroomId
                    }
                    variant="secondary"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    {t("actions.generate")}
                  </Button>
                  {!isPublished ? (
                    <Button
                      onClick={handlePublish}
                      disabled={
                        !canWriteTimetable || isDirty || !resolvedConfig
                      }
                      variant="secondary"
                      loading={isPublishing}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      {t("actions.publish")}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUnpublish}
                      disabled={
                        !canWriteTimetable || isDirty || !resolvedConfig
                      }
                      variant="secondary"
                      loading={isUnpublishing}
                      leftIcon={<EyeOff className="w-4 h-4" />}
                    >
                      {t("actions.unpublish")}
                    </Button>
                  )}
                </>
              )}
              <Button
                onClick={handleValidationOpen}
                variant="secondary"
                disabled={!resolvedConfig}
                loading={isValidating}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {t("actions.validate")}
              </Button>
              <Button
                onClick={handlePrint}
                variant="secondary"
                disabled={!hasTimetableTarget || !resolvedConfig}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                {t("actions.print")}
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={!hasTimetableTarget || !resolvedConfig}
              >
                {t("actions.export")}
              </Button>
            </div>
            {isDirty && (
              <span className="text-sm text-orange-600">
                {t("unsavedChanges.label")}
              </span>
            )}
          </div>

          {/* Mobile: Compact layout with 2 rows */}
          <div className="lg:hidden space-y-3">
            {/* Row 1: Primary actions */}
            <div className="flex items-center gap-2">
              {canManageTimetable && (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={
                      !isDirty ||
                      isSaving ||
                      !canEditTimetable ||
                      !resolvedConfig
                    }
                    variant="primary"
                    loading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {isSaving ? t("actions.saving") : t("actions.save")}
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={!isDirty || !canEditTimetable || !resolvedConfig}
                    variant="secondary"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {t("actions.reset")}
                  </Button>
                </>
              )}
            </div>

            {/* Row 2: Secondary actions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {canManageTimetable && (
                <>
                  <Button
                    onClick={() => setConfigDialogOpen(true)}
                    disabled={!canEditTimetable}
                    variant="secondary"
                    leftIcon={<Settings className="w-4 h-4" />}
                    size="sm"
                  >
                    {t("config.button")}
                  </Button>
                  <Button
                    onClick={() => setGenerateDialogOpen(true)}
                    disabled={
                      !canEditTimetable ||
                      !resolvedConfig ||
                      !selectedClassroomId
                    }
                    variant="secondary"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    size="sm"
                  >
                    {t("actions.generate")}
                  </Button>
                  {!isPublished ? (
                    <Button
                      onClick={handlePublish}
                      disabled={
                        !canWriteTimetable || isDirty || !resolvedConfig
                      }
                      variant="secondary"
                      loading={isPublishing}
                      leftIcon={<Send className="w-4 h-4" />}
                      size="sm"
                    >
                      {t("actions.publish")}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUnpublish}
                      disabled={
                        !canWriteTimetable || isDirty || !resolvedConfig
                      }
                      variant="secondary"
                      loading={isUnpublishing}
                      leftIcon={<EyeOff className="w-4 h-4" />}
                      size="sm"
                    >
                      {t("actions.unpublish")}
                    </Button>
                  )}
                </>
              )}
              <Button
                onClick={handleValidationOpen}
                variant="secondary"
                disabled={!resolvedConfig}
                loading={isValidating}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                size="sm"
              >
                {t("actions.validate")}
              </Button>
              <Button
                onClick={handlePrint}
                variant="secondary"
                disabled={!hasTimetableTarget || !resolvedConfig}
                leftIcon={<Printer className="w-4 h-4" />}
                size="sm"
              >
                {t("actions.print")}
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={!hasTimetableTarget || !resolvedConfig}
                size="sm"
              >
                {t("actions.export")}
              </Button>
            </div>

            {/* Unsaved changes indicator */}
            {isDirty && (
              <div className="text-xs text-orange-600 text-center py-1 bg-orange-50 rounded">
                {t("unsavedChanges.label")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 min-h-full overflow-auto p-3 lg:p-6 print:overflow-visible print:p-0">
        {!hasTimetableTarget ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("emptyState.noSelection.title")}
            </h3>
            <p className="text-gray-500">
              {t("emptyState.noSelection.message")}
            </p>
          </div>
        ) : !resolvedConfig ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <Settings className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t("emptyState.noConfig.title")}
            </h3>
            <p className="mb-5 max-w-md text-sm text-gray-500">
              {t("emptyState.noConfig.message")}
            </p>
            <Button
              onClick={() => setConfigDialogOpen(true)}
              disabled={!canCreateConfig}
              variant="primary"
              leftIcon={<Settings className="h-4 w-4" />}
            >
              {t("emptyState.noConfig.cta")}
            </Button>
          </div>
        ) : periods.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <Settings className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t("emptyState.noPeriods.title")}
            </h3>
            <p className="mb-5 max-w-md text-sm text-gray-500">
              {t("emptyState.noPeriods.message")}
            </p>
            {canManageTimetable && (
              <Button
                onClick={() => setConfigDialogOpen(true)}
                disabled={!canEditTimetable}
                variant="primary"
                leftIcon={<Settings className="h-4 w-4" />}
              >
                {t("emptyState.noPeriods.cta")}
              </Button>
            )}
          </div>
        ) : displayedClassrooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {locale === "ar" ? "لا توجد فصول" : "No classrooms found"}
            </h3>
            <p className="max-w-md text-sm text-gray-500">
              {locale === "ar"
                ? "لا توجد فصول داخل النطاق المحدد."
                : "No classrooms exist inside the selected timetable scope."}
            </p>
          </div>
        ) : (
          <div
            ref={printMatrixRef}
            className={`timetable-print-matrix ${
              locale === "ar" ? "timetable-print-rtl" : "timetable-print-ltr"
            }`}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <div className="timetable-print-page-inner">
              <div
                className="hidden timetable-print-header"
                dir={locale === "ar" ? "rtl" : "ltr"}
              >
                <div className="timetable-print-school">
                  <div className="text-base font-semibold text-gray-900">
                    {schoolName}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{t("title")}</div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={printLogoUrl}
                  alt={schoolName}
                  className="timetable-print-logo"
                />
              </div>
              {selectedPrintTarget && (
                <div
                  className="hidden timetable-print-target"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  {selectedPrintTarget.label}: {selectedPrintTarget.name}
                </div>
              )}
              <div
                className="timetable-print-content space-y-6"
                dir={locale === "ar" ? "rtl" : "ltr"}
              >
                {displayedClassrooms.map((classroom) => {
                  const classroomEntries = timetableEntries.filter(
                    (entry) => entry.classroomId === classroom.id,
                  );
                  const showClassroomHeader = displayedClassrooms.length > 1;

                  return (
                    <section key={classroom.id} className="space-y-3 relative">
                      {showClassroomHeader && (
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 print:rounded-none print:border-x-0 print:px-0">
                          {t("target.classroom")}: {getDisplayName(classroom)}
                        </div>
                      )}
                      {timetableLoading && !isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm min-h-[200px]">
                          <PartialLoader />
                        </div>
                      )}
                      <TimetableGrid
                        entries={classroomEntries}
                        subjects={subjects}
                        teachers={teachers}
                        rooms={rooms}
                        conflicts={backendConflicts}
                        onSlotClick={(dayKey, periodIndex) =>
                          handleSlotClick(dayKey, periodIndex, classroom.id)
                        }
                        isHolidayDay={isHolidayDay}
                        locale={locale}
                        isReadOnly={!canEditTimetable}
                        resolvedConfig={resolvedConfig}
                      />
                    </section>
                  );
                })}
              </div>
              {printTimestamp && (
                <div
                  className="hidden timetable-print-footer"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  {locale === "ar" ? "وقت الطباعة" : "Print time"}:{" "}
                  {printTimestamp}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Drawer */}
      {hasTimetableTarget && resolvedConfig && (
        <ValidationPanel
          open={validationPanelOpen}
          validationSummary={validationSummary}
          conflicts={backendConflicts}
          periods={resolvedConfig?.periods ?? []}
          teachers={teachers}
          rooms={rooms}
          onClose={() => setValidationPanelOpen(false)}
          locale={locale}
        />
      )}

      {/* Edit Dialog */}
      {editDialogOpen && editingSlot && resolvedConfig && (
        <EditSlotDialog
          open={editDialogOpen}
          dayKey={editingSlot.dayKey}
          periodIndex={editingSlot.periodIndex}
          dayName={
            locale === "ar"
              ? resolvedConfig.days.find((d) => d.key === editingSlot.dayKey)
                  ?.nameAr || ""
              : resolvedConfig.days.find((d) => d.key === editingSlot.dayKey)
                  ?.nameEn || ""
          }
          entry={editingSlot.entry}
          subjects={subjects}
          teachers={teachers}
          teacherAllocations={teacherAllocations}
          rooms={rooms}
          onSave={handleSlotSave}
          onClose={() => setEditDialogOpen(false)}
          getDefaultTeacher={getDefaultTeacher}
          getDefaultRoomSuggestion={getDefaultRoomSuggestion}
          getRoomSource={getRoomSource}
          selectedSectionId={editingSlot.sectionId}
          selectedClassroomId={editingSlot.classroomId}
          hasRoomConflict={(roomId) =>
            hasRoomConflictForSlot(
              editingSlot.dayKey,
              editingSlot.periodIndex,
              roomId,
              editingSlot.entry?.id,
            )
          }
          selectedClassroomName={
            locale === "ar"
              ? editingClassroom?.nameAr
              : editingClassroom?.nameEn
          }
          locale={locale}
        />
      )}

      {/* Generate Dialog */}
      {generateDialogOpen && (
        <GenerateDialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          onGenerate={handleGenerate}
          onApply={applyGenerated}
        />
      )}

      {/* Config Dialog */}
      {configDialogOpen && (
        <TimetableConfigDialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          onSaved={async () => {
            await reloadConfigs();
          }}
          academicYearId={academicYearId}
          termId={termId}
          config={config}
          periods={periods}
          entries={timetableEntries}
          selectedGradeId={selectedGradeId}
          selectedSectionId={selectedSectionId}
          selectedClassroomId={selectedClassroomId}
          readOnly={!canEditTimetable}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
          locale={locale}
        />
      )}

      {/* Reset Confirm Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={confirmReset}
        title={t("actions.resetConfirmTitle")}
        description={t("actions.resetConfirmMessage")}
        confirmLabel={t("actions.reset")}
        cancelLabel={t("publish.cancel")}
        severity="warning"
      />

      {/* Publish Confirm Dialog */}
      <ConfirmDialog
        isOpen={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        onConfirm={confirmPublish}
        title={t("publish.confirmTitle")}
        description={
          publishWithErrors
            ? t("publish.withErrors")
            : t("publish.confirmMessage")
        }
        confirmLabel={t("publish.confirm")}
        cancelLabel={t("publish.cancel")}
        severity={publishWithErrors ? "warning" : "info"}
        loading={isPublishing}
      />

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("actions.export")}
        subtitle={t("title")}
        datasetCount={
          resolvedConfig
            ? resolvedConfig.days.filter((day) => day.isActive).length *
              resolvedConfig.periods.length
            : 0
        }
      />
    </div>
  );
}

function readOnlyBannerMessage({
  configStatus,
  termStatus,
  closedTermMessage,
  publishedLockedMessage,
}: {
  configStatus?: string;
  termStatus: "open" | "closed";
  closedTermMessage: string;
  publishedLockedMessage: string;
}): string | null {
  if (termStatus === "closed") {
    return closedTermMessage;
  }
  if (configStatus && configStatus.toLowerCase() !== "draft") {
    return publishedLockedMessage;
  }
  return null;
}
