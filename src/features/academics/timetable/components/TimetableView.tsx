"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  CheckCircle
} from "lucide-react";
import FilterBar from "./FilterBar";
import TimetableGrid from "./TimetableGrid";
import ValidationPanel from "./ValidationPanel";
import EditSlotDialog from "./EditSlotDialog";
import GenerateDialog from "./GenerateDialog";
import TimetableConfigDialog from "./TimetableConfigDialog";
import ConfigChangeWarningDialog from "./ConfigChangeWarningDialog";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import {
  resolveTeacherAllocationForTarget,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  resolveDefaultRoomSourceForTarget,
  type RoomAssignmentSource,
} from "@/features/academics/rooms/services/roomsService";
import {
  TimetableEntry,
  Room,
} from "@/features/academics/timetable/types/timetable";
import { buildTimetableValidationState } from "@/features/academics/timetable/utils/validation";
import {
  getDefaultRoomSuggestion as getSuggestedDefaultRoom,
  getRecommendedRooms as rankRecommendedRooms,
  getRoomSource as resolveRoomSource,
} from "@/features/academics/timetable/utils/roomRecommendations";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useTimetableData } from "@/features/academics/timetable/hooks/useTimetableData";
import { useTimetableConfigFlow } from "@/features/academics/timetable/hooks/useTimetableConfigFlow";
import { useTimetableGeneration } from "@/features/academics/timetable/hooks/useTimetableGeneration";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";

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
  const locale = useLocale();
  const { showToast } = useToast();

  const [isDirty, setIsDirty] = useState(false);
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    dayKey: string;
    periodIndex: number;
    entry?: TimetableEntry;
  } | null>(null);

  // Generate Dialog State
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Confirm Dialog State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishWithErrors, setPublishWithErrors] = useState(false);

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
    isLoading,
    isSaving,
    isPublished,
    reloadConfigs,
    loadTimetable,
    saveTimetable,
    publishCurrentTimetable,
    unpublishCurrentTimetable,
  } = useTimetableData({
    schoolId,
    termId,
    academicYearId,
    selectedSectionId,
    selectedClassroomId,
    showToast,
  });
  const {
    configDialogOpen,
    setConfigDialogOpen,
    configWarningOpen,
    migrationResult,
    handleConfigSave,
    confirmConfigWarning,
    closeConfigWarning,
  } = useTimetableConfigFlow({
    termId,
    timetableEntries,
    setTimetableEntries,
    reloadConfigs,
    markDirty: () => setIsDirty(true),
    showSuccess: (messageKey) => showToast(t(messageKey), "success"),
    showError: (messageKey) => showToast(t(messageKey), "error"),
  });
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

  // Update dirty state
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (stages.length === 0 && grades.length === 0 && sections.length === 0) {
      return;
    }

    const normalizedStageId = stages.some((stage) => stage.id === selectedStageId)
      ? selectedStageId
      : "";

    const normalizedGradeId = grades.some(
      (grade) =>
        grade.id === selectedGradeId &&
        (!normalizedStageId || grade.stageId === normalizedStageId)
    )
      ? selectedGradeId
      : "";

    const normalizedSectionId = sections.some(
      (section) =>
        section.id === selectedSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId)
    )
      ? selectedSectionId
      : "";

    const normalizedClassroomId = classrooms.some(
      (classroom) =>
        classroom.id === selectedClassroomId &&
        (!normalizedSectionId || classroom.sectionId === normalizedSectionId)
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
  const isHolidayDay = useCallback((dayKey: string): boolean => {
    if (!resolvedConfig) {
      return dayKey === "fri" || dayKey === "sat";
    }
    const day = resolvedConfig.days.find((item) => item.key === dayKey);
    return day ? !day.isActive : false;
  }, [resolvedConfig]);

  const handleSlotClick = (dayKey: string, periodIndex: number) => {
    if (isReadOnly) return;
    
    // Prevent editing on holiday days
    if (isHolidayDay(dayKey)) {
      showToast(t("validation.cannotEditHoliday"), "error");
      return;
    }

    const entry = timetableEntries.find((e) => e.dayKey === dayKey && e.periodIndex === periodIndex);
    setEditingSlot({ dayKey, periodIndex, entry });
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
    breakLabelEn?: string
  ) => {
    // Update local state
    const updatedEntries = [...timetableEntries];
    const existingIndex = updatedEntries.findIndex(
      (e) => e.dayKey === dayKey && e.periodIndex === periodIndex
    );

    const newEntry: TimetableEntry = {
      id: existingIndex >= 0 ? updatedEntries[existingIndex].id : `temp-${Date.now()}`,
      termId,
      sectionId: selectedSectionId,
      classroomId: selectedClassroomId || undefined,
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
    if (!selectedSectionId) return;

    const saved = await saveTimetable(timetableEntries);
    if (saved) {
      setIsDirty(false);
      showToast(t("actions.saveSuccess"), "success");
    } else {
      showToast(t("actions.saveError"), "error");
    }
  };

  const handlePublish = async () => {
    if (!selectedSectionId) return;

    // Check for unsaved changes
    if (isDirty) {
      showToast(t("publish.unsavedChanges"), "error");
      return;
    }

    // Check for errors
    const hasConflicts = validation.hasConflictsForTarget;
    const hasMismatches = validation.hasSubjectMismatches;

    if (hasConflicts || hasMismatches) {
      setPublishWithErrors(true);
      setPublishConfirmOpen(true);
    } else {
      setPublishWithErrors(false);
      setPublishConfirmOpen(true);
    }
  };

  const confirmPublish = async () => {
    if (!selectedSectionId) return;

    try {
      const published = await publishCurrentTimetable();
      if (!published) {
        throw new Error("PUBLISH_FAILED");
      }
      showToast(t("publish.success"), "success");
    } catch (error) {
      console.error("Failed to publish timetable:", error);
      showToast(t("publish.error"), "error");
    } finally {
      setPublishConfirmOpen(false);
    }
  };

  const handleUnpublish = async () => {
    if (!selectedSectionId) return;

    try {
      const unpublished = await unpublishCurrentTimetable();
      if (!unpublished) {
        throw new Error("UNPUBLISH_FAILED");
      }
      showToast(t("unpublish.success"), "success");
    } catch (error) {
      console.error("Failed to unpublish timetable:", error);
      showToast(t("unpublish.error"), "error");
    }
  };

  const handleReset = () => {
    setResetConfirmOpen(true);
  };

  const confirmReset = async () => {
    if (!selectedSectionId) return;

    try {
      await loadTimetable();
      setIsDirty(false);
      showToast(t("actions.resetSuccess"), "success");
    } catch (error) {
      console.error("Failed to reset timetable:", error);
      showToast(t("actions.resetError"), "error");
    } finally {
      setResetConfirmOpen(false);
    }
  };

  const getDefaultTeacher = (subjectId: string): string | null => {
    if (!selectedSectionId) return null;

    const allocation = resolveTeacherAllocationForTarget(teacherAllocations, {
      sectionId: selectedSectionId,
      classroomId: selectedClassroomId || undefined,
      subjectId,
    });
    return allocation?.teacherId || null;
  };

  const getDefaultRoomSuggestion = (
    subjectId: string
  ): {
    roomId: string | null;
    source: Exclude<RoomAssignmentSource, "MANUAL"> | null;
  } =>
    getSuggestedDefaultRoom({
      subjectId,
      subjects,
      rooms,
      roomDefaults,
      selectedSectionId: selectedSectionId || undefined,
      selectedClassroomId: selectedClassroomId || undefined,
      selectedClassroom,
    });

  const getRoomSource = (
    roomId: string | null,
    subjectId?: string
  ): RoomAssignmentSource | null =>
    resolveRoomSource({
      roomId,
      subjectId,
      subjects,
      rooms,
      roomDefaults,
      selectedSectionId: selectedSectionId || undefined,
      selectedClassroomId: selectedClassroomId || undefined,
      selectedClassroom,
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

  const validation = useMemo(
    () =>
      buildTimetableValidationState({
        currentEntries: timetableEntries,
        allTermEntries,
        selectedSectionId,
        selectedClassroomId: selectedClassroomId || undefined,
        sections,
        grades,
        classrooms,
        teachers,
        rooms,
        subjects,
        subjectAllocations,
      }),
    [
      timetableEntries,
      allTermEntries,
      selectedSectionId,
      selectedClassroomId,
      sections,
      grades,
      classrooms,
      teachers,
      rooms,
      subjects,
      subjectAllocations,
    ]
  );

  const getRecommendedRooms = useCallback(
    (subjectId?: string): Room[] =>
      rankRecommendedRooms({
        subjectId,
        subjects,
        rooms,
        roomDefaults,
        selectedSectionId: selectedSectionId || undefined,
        selectedClassroomId: selectedClassroomId || undefined,
        selectedClassroom,
      }),
    [
      subjects,
      rooms,
      roomDefaults,
      selectedSectionId,
      selectedClassroomId,
      selectedClassroom,
    ]
  );

  const getDisplayName = (entity?: {
    name?: string;
    nameAr?: string;
    nameEn?: string;
  }) => {
    if (!entity) return "";
    return locale === "ar"
      ? entity.nameAr || entity.nameEn || entity.name || ""
      : entity.nameEn || entity.nameAr || entity.name || "";
  };

  const configSourceLabel = resolvedConfig
    ? t(`config.scope.${resolvedConfig.source.scope.toLowerCase()}`)
    : "";

  const handleExport = (format: AcademicsExportFormat) => {
    if (!selectedSection || !resolvedConfig) return;

    const columns: ExportColumn[] = [
      { key: "day", label: t("grid.day") },
      { key: "period", label: t("grid.period") },
      { key: "slotType", label: t("editSlot.slotType") },
      { key: "subject", label: t("editSlot.subject") },
      { key: "teacher", label: t("editSlot.teacher") },
      { key: "room", label: t("editSlot.room") },
      { key: "status", label: t("export.status") },
    ];

    const rows = resolvedConfig.days
      .filter((day) => day.isActive)
      .flatMap((day) =>
        resolvedConfig.periods.map((period) => {
          const entry = timetableEntries.find(
            (item) => item.dayKey === day.key && item.periodIndex === period.index
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
            day: locale === "ar" ? day.nameAr : day.nameEn,
            period: locale === "ar" ? period.nameAr : period.nameEn,
            slotType:
              entry?.slotType === "BREAK"
                ? t("editSlot.break")
                : t("editSlot.class"),
            subject: subject ? getDisplayName(subject) : "",
            teacher: teacher ? getDisplayName(teacher) : "",
            room: room ? getDisplayName(room) : "",
            status: entry?.status === "PUBLISHED" ? t("export.published") : t("export.draft"),
          };
        })
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
        selectedClassroomId || selectedSectionId || selectedGradeId || undefined
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
      {/* Filter Bar */}
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

      {selectedSectionId && (
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

      {/* Action Bar */}
      {selectedSectionId && (
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          {/* Desktop: Horizontal layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleSave}
                disabled={!isDirty || isSaving || isReadOnly}
                variant="primary"
                loading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? t("actions.saving") : t("actions.save")}
              </Button>
              <Button
                onClick={handleReset}
                disabled={!isDirty || isReadOnly}
                variant="secondary"
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                {t("actions.reset")}
              </Button>
              <Button
                onClick={() => setConfigDialogOpen(true)}
                disabled={isReadOnly}
                variant="secondary"
                leftIcon={<Settings className="w-4 h-4" />}
              >
                {t("config.button")}
              </Button>
              <Button
                onClick={() => setGenerateDialogOpen(true)}
                disabled={isReadOnly}
                variant="secondary"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {t("actions.generate")}
              </Button>
              {!isPublished ? (
                <Button
                  onClick={handlePublish}
                  disabled={isReadOnly || isDirty}
                  variant="secondary"
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {t("actions.publish")}
                </Button>
              ) : (
                <Button
                  onClick={handleUnpublish}
                  disabled={isReadOnly || isDirty}
                  variant="secondary"
                  leftIcon={<EyeOff className="w-4 h-4" />}
                >
                  {t("actions.unpublish")}
                </Button>
              )}
              <Button
                onClick={() => setValidationPanelOpen(true)}
                variant="secondary"
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {t("actions.validate")}
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={!selectedSectionId}
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
              <Button
                onClick={handleSave}
                disabled={!isDirty || isSaving || isReadOnly}
                variant="primary"
                loading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
                className="flex-1"
              >
                {isSaving ? t("actions.saving") : t("actions.save")}
              </Button>
              <Button
                onClick={handleReset}
                disabled={!isDirty || isReadOnly}
                variant="secondary"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="flex-1"
              >
                {t("actions.reset")}
              </Button>
            </div>

            {/* Row 2: Secondary actions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Button
                onClick={() => setConfigDialogOpen(true)}
                disabled={isReadOnly}
                variant="secondary"
                leftIcon={<Settings className="w-4 h-4" />}
                size="sm"
              >
                {t("config.button")}
              </Button>
              <Button
                onClick={() => setGenerateDialogOpen(true)}
                disabled={isReadOnly}
                variant="secondary"
                leftIcon={<Sparkles className="w-4 h-4" />}
                size="sm"
              >
                {t("actions.generate")}
              </Button>
              {!isPublished ? (
                <Button
                  onClick={handlePublish}
                  disabled={isReadOnly || isDirty}
                  variant="secondary"
                  leftIcon={<Send className="w-4 h-4" />}
                  size="sm"
                >
                  {t("actions.publish")}
                </Button>
              ) : (
                <Button
                  onClick={handleUnpublish}
                  disabled={isReadOnly || isDirty}
                  variant="secondary"
                  leftIcon={<EyeOff className="w-4 h-4" />}
                  size="sm"
                >
                  {t("actions.unpublish")}
                </Button>
              )}
              <Button
                onClick={() => setValidationPanelOpen(true)}
                variant="secondary"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                size="sm"
              >
                {t("actions.validate")}
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={!selectedSectionId}
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
      <div className="flex-1 overflow-auto p-3 lg:p-6">
        {!selectedSectionId ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("emptyState.noSelection.title")}
            </h3>
            <p className="text-gray-500">{t("emptyState.noSelection.message")}</p>
          </div>
        ) : (
          resolvedConfig && (
            <TimetableGrid
              entries={timetableEntries}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              conflicts={validation.conflicts}
              onSlotClick={handleSlotClick}
              isHolidayDay={isHolidayDay}
              locale={locale}
              isReadOnly={isReadOnly}
              resolvedConfig={resolvedConfig}
            />
          )
        )}
      </div>

      {/* Validation Drawer */}
      {selectedSectionId && resolvedConfig && (
        <ValidationPanel
          open={validationPanelOpen}
          subjectHours={validation.subjectHours}
          conflicts={validation.conflictsForTarget}
          totalSlots={
            resolvedConfig.days.filter((d) => d.isActive).length *
            resolvedConfig.periods.length
          }
          filledSlots={timetableEntries.filter((e) => e.subjectId).length}
          missingTeacher={timetableEntries.filter((e) => e.subjectId && !e.teacherId).length}
          missingRoom={timetableEntries.filter((e) => e.subjectId && !e.roomId).length}
                roomDefaultSource={
            selectedSectionId
              ? resolveDefaultRoomSourceForTarget(roomDefaults, {
                  schoolId,
                  sectionId: selectedSectionId,
                  classroomId: selectedClassroomId || undefined,
                })
              : null
          }
          onClose={() => setValidationPanelOpen(false)}
          locale={locale}
          resolvedConfig={resolvedConfig}
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
              ? resolvedConfig.days.find((d) => d.key === editingSlot.dayKey)?.nameAr || ""
              : resolvedConfig.days.find((d) => d.key === editingSlot.dayKey)?.nameEn || ""
          }
          entry={editingSlot.entry}
          subjects={subjects}
          teachers={teachers}
          rooms={getRecommendedRooms(editingSlot.entry?.subjectId || undefined)}
          onSave={handleSlotSave}
          onClose={() => setEditDialogOpen(false)}
          getDefaultTeacher={getDefaultTeacher}
          getDefaultRoomSuggestion={getDefaultRoomSuggestion}
          getRoomSource={getRoomSource}
          selectedClassroomName={
            selectedClassroomId
              ? (locale === "ar"
                  ? classrooms.find((item) => item.id === selectedClassroomId)?.nameAr
                  : classrooms.find((item) => item.id === selectedClassroomId)?.nameEn)
              : undefined
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
      {configDialogOpen && resolvedConfig && (
        <TimetableConfigDialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          onSave={handleConfigSave}
          initialDays={resolvedConfig.days}
          initialPeriods={resolvedConfig.periods}
          initialScope={resolvedConfig.source.scope}
          initialScopeId={resolvedConfig.source.id}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
          locale={locale}
        />
      )}

      {/* Config Change Warning Dialog */}
      {configWarningOpen && migrationResult && (
        <ConfigChangeWarningDialog
          open={configWarningOpen}
          onClose={closeConfigWarning}
          onConfirm={confirmConfigWarning}
          droppedCount={migrationResult.dropped}
          keptCount={migrationResult.kept}
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
        description={publishWithErrors ? t("publish.withErrors") : t("publish.confirmMessage")}
        confirmLabel={t("publish.confirm")}
        cancelLabel={t("publish.cancel")}
        severity={publishWithErrors ? "warning" : "info"}
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
