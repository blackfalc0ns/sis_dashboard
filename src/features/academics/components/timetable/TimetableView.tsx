"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
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
  fetchAcademicYears,
  fetchStructureTree,
  Stage,
  Grade,
  Section,
} from "@/services/academics/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  Subject,
  SubjectAllocation,
} from "@/services/academics/subjectsService";
import {
  fetchTeachers,
  fetchTeacherAllocations,
  Teacher,
  TeacherAllocation,
} from "@/services/academics/teacherAllocationService";
import { fetchRooms } from "@/services/academics/roomsService";
import { fetchTermEvents } from "@/services/academics/calendarService";
import {
  fetchTimetable,
  fetchAllTimetablesForTerm,
  upsertTimetableEntries,
  publishTimetable,
  unpublishTimetable,
  detectConflicts,
} from "@/services/academics/timetableService";
import {
  TimetableEntry,
  Room,
  TimetableConflict,
  SubjectHoursSummary,
} from "@/types/academics/timetable";
import { generateTimetable, GenerationResult } from "@/utils/timetable/generator";
import {
  TimetableConfig,
  TimetableConfigScope,
  ResolvedTimetableConfig,
  resolveTimetableConfig,
  mapEntriesToNewConfig,
  TimetableDay,
  TimetablePeriod,
} from "@/types/academics/timetableConfig";
import {
  fetchTimetableConfigs,
  upsertTimetableConfig,
} from "@/services/academics/timetableConfigService";
import MainLoader from "@/components/ui/loaders/MainLoader";

interface TimetableViewProps {
  termId: string;
  termStatus: "open" | "closed";
  isReadOnly: boolean;
  onDirtyChange: (dirty: boolean) => void;
  academicYearId?: string;
}

export default function TimetableView({
  termId,
  isReadOnly,
  onDirtyChange,
  academicYearId = "",
}: TimetableViewProps) {
  const t = useTranslations("academics.timetable");
  const locale = useLocale();
  const { showToast } = useToast();

  // Data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAllocations, setTeacherAllocations] = useState<TeacherAllocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [allTermEntries, setAllTermEntries] = useState<TimetableEntry[]>([]);

  // Config State
  const [configs, setConfigs] = useState<TimetableConfig[]>([]);
  const [resolvedConfig, setResolvedConfig] = useState<ResolvedTimetableConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configWarningOpen, setConfigWarningOpen] = useState(false);
  const [pendingConfigData, setPendingConfigData] = useState<{
    scopeType: TimetableConfigScope;
    scopeId?: string;
    days: TimetableDay[];
    periods: TimetablePeriod[];
  } | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ kept: number; dropped: number } | null>(null);

  // UI State
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

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

  // Validation State
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [subjectHours, setSubjectHours] = useState<SubjectHoursSummary[]>([]);

  // Load initial data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId, academicYearId]);

  // Resolve config when section or configs change
  useEffect(() => {
    if (selectedSectionId && configs.length > 0 && sections.length > 0) {
      const section = sections.find((s) => s.id === selectedSectionId);
      if (section) {
        const termConfig = configs.find((c) => c.scopeType === "TERM");
        const gradeConfig = configs.find(
          (c) => c.scopeType === "GRADE" && c.scopeId === section.gradeId
        );
        const sectionConfig = configs.find(
          (c) => c.scopeType === "SECTION" && c.scopeId === selectedSectionId
        );
        
        const resolved = resolveTimetableConfig(termConfig || null, gradeConfig, sectionConfig);
        setResolvedConfig(resolved);
      }
    }
  }, [selectedSectionId, configs, sections]);

  // Update dirty state
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get the academic year ID - either from props or fetch the first one
      let yearId = academicYearId;
      
      if (!yearId) {
        const years = await fetchAcademicYears();
        const currentYear = years[0];
        if (!currentYear) {
          throw new Error("No academic year found");
        }
        yearId = currentYear.id;
      }

      const [structure, subjectsData, subjectAllocsData, teachersData, teacherAllocsData, roomsData, , configsData] =
        await Promise.all([
          fetchStructureTree(yearId, termId),
          fetchSubjects(termId),
          fetchSubjectAllocations(termId),
          fetchTeachers(),
          fetchTeacherAllocations(termId),
          fetchRooms("school-1"),
          fetchTermEvents(termId), // Fetched but not used currently
          fetchTimetableConfigs(termId),
        ]);

      // Extract stages, grades and sections from structure
      const allStages: Stage[] = structure.stages || [];
      const allGrades: Grade[] = structure.grades || [];
      const allSections: Section[] = structure.sections || [];

      // Filter only HOLIDAY events with SCHOOL scope
      // const schoolHolidays = calendarEvents.filter(
      //   (event) => event.type === "HOLIDAY" && event.scopeType === "SCHOOL"
      // );

      setStages(allStages);
      setGrades(allGrades);
      setSections(allSections);
      setSubjects(subjectsData);
      setSubjectAllocations(subjectAllocsData);
      setTeachers(teachersData);
      setTeacherAllocations(teacherAllocsData);
      setRooms(roomsData.filter((r) => r.isActive));
      // setHolidays(schoolHolidays); // Holidays not currently used
      setConfigs(configsData);

      // Load all timetables for conflict detection
      const allEntries = await fetchAllTimetablesForTerm(termId);
      setAllTermEntries(allEntries);
    } catch (error) {
      console.error("Failed to load data:", error);
      showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateValidation = useCallback(
    (entries: TimetableEntry[]) => {
      // Calculate subject hours summary
      const selectedSection = sections.find((s) => s.id === selectedSectionId);
      if (!selectedSection) return;

      const selectedGrade = grades.find((g) => g.id === selectedSection.gradeId);
      if (!selectedGrade) return;

      const summary: SubjectHoursSummary[] = subjects.map((subject) => {
        // Get target hours from allocation
        const allocation = subjectAllocations.find(
          (a) => a.gradeId === selectedGrade.id && a.subjectId === subject.id
        );
        const target = allocation?.weeklyHours || 0;

        // Count actual hours from timetable (exclude BREAK slots)
        const actual = entries.filter(
          (e) => e.subjectId === subject.id && e.slotType !== "BREAK"
        ).length;

        let status: "OK" | "UNDER" | "OVER" = "OK";
        if (actual < target) status = "UNDER";
        else if (actual > target) status = "OVER";

        return {
          subjectId: subject.id,
          subjectNameAr: subject.nameAr,
          subjectNameEn: subject.nameEn,
          target,
          actual,
          status,
        };
      });

      setSubjectHours(summary.filter((s) => s.target > 0));

      // Detect conflicts
      const detectedConflicts = detectConflicts(
        allTermEntries,
        sections,
        teachers,
        rooms,
        subjects
      );
      setConflicts(detectedConflicts);
    },
    [
      selectedSectionId,
      sections,
      grades,
      subjects,
      subjectAllocations,
      allTermEntries,
      teachers,
      rooms,
    ]
  );

  const loadTimetable = useCallback(async () => {
    if (!selectedSectionId) return;

    try {
      const entries = await fetchTimetable(termId, selectedSectionId);
      setTimetableEntries(entries);
      setIsDirty(false);
      
      // Check if timetable is published
      const published = entries.length > 0 && entries.every((e) => e.status === "PUBLISHED");
      setIsPublished(published);
      
      // Calculate validation
      calculateValidation(entries);
    } catch (error) {
      console.error("Failed to load timetable:", error);
      showToast("Failed to load timetable", "error");
    }
  }, [selectedSectionId, termId, calculateValidation, showToast]);

  // Load timetable when section changes
  useEffect(() => {
    if (selectedSectionId) {
      loadTimetable();
    }
  }, [selectedSectionId, termId, loadTimetable]);

  // Helper function to check if a day is a holiday
  const isHolidayDay = useCallback((dayKey: string): boolean => {
    // For now, just check if Friday (5) or Saturday (6) - typical weekend
    // Real implementation would parse holiday.startDate and check day of week
    return dayKey === "fri" || dayKey === "sat";
  }, []); // holidays not actually used in the function body

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
    
    // Recalculate validation
    calculateValidation(updatedEntries);
  };

  const handleSave = async () => {
    if (!selectedSectionId) return;

    setIsSaving(true);
    try {
      await upsertTimetableEntries(termId, selectedSectionId, timetableEntries);
      setIsDirty(false);
      showToast(t("actions.saveSuccess"), "success");
      
      // Reload all entries for conflict detection
      const allEntries = await fetchAllTimetablesForTerm(termId);
      setAllTermEntries(allEntries);
      calculateValidation(timetableEntries);
    } catch (error) {
      console.error("Failed to save timetable:", error);
      showToast(t("actions.saveError"), "error");
    } finally {
      setIsSaving(false);
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
    const hasConflicts = conflicts.some(
      (c) => c.sections.some((s) => s.sectionId === selectedSectionId)
    );
    const hasMismatches = subjectHours.some((s) => s.status !== "OK");

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
      await publishTimetable(termId, selectedSectionId);
      
      // Update local state instead of reloading
      const updatedEntries = timetableEntries.map(entry => ({
        ...entry,
        status: "PUBLISHED" as const
      }));
      setTimetableEntries(updatedEntries);
      setIsPublished(true);
      
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
      await unpublishTimetable(termId, selectedSectionId);
      
      // Update local state instead of reloading
      const updatedEntries = timetableEntries.map(entry => ({
        ...entry,
        status: "DRAFT" as const
      }));
      setTimetableEntries(updatedEntries);
      setIsPublished(false);
      
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

  const handleConfigSave = async (newConfig: {
    scopeType: TimetableConfigScope;
    scopeId?: string;
    days: TimetableDay[];
    periods: TimetablePeriod[];
  }) => {
    // Check if this affects existing entries
    const newResolved: ResolvedTimetableConfig = {
      days: newConfig.days,
      periods: newConfig.periods,
      source: { scope: newConfig.scopeType, id: newConfig.scopeId },
    };
    
    const migration = mapEntriesToNewConfig(timetableEntries, newResolved);
    
    if (migration.dropped.length > 0) {
      // Show warning
      setPendingConfigData(newConfig);
      setMigrationResult({
        kept: migration.kept.length,
        dropped: migration.dropped.length,
      });
      setConfigWarningOpen(true);
    } else {
      // No conflicts, apply directly
      await applyConfigChange(newConfig, newResolved);
    }
  };

  const applyConfigChange = async (
    config: {
      scopeType: TimetableConfigScope;
      scopeId?: string;
      days: TimetableDay[];
      periods: TimetablePeriod[];
    },
    resolved: ResolvedTimetableConfig
  ) => {
    try {
      // Save config
      await upsertTimetableConfig({
        termId,
        scopeType: config.scopeType,
        scopeId: config.scopeId,
        days: config.days,
        periods: config.periods,
      });
      
      // Reload configs
      const newConfigs = await fetchTimetableConfigs(termId);
      setConfigs(newConfigs);
      
      // Apply migration
      const migration = mapEntriesToNewConfig(timetableEntries, resolved);
      setTimetableEntries(migration.kept);
      setIsDirty(true);
      
      setConfigDialogOpen(false);
      showToast(t("config.resetSuccess"), "success");
    } catch (error) {
      console.error("Failed to save config:", error);
      showToast(t("config.validation.saveFailed"), "error");
    }
  };

  const handleConfigWarningConfirm = async () => {
    if (pendingConfigData && resolvedConfig) {
      const newResolved: ResolvedTimetableConfig = {
        days: pendingConfigData.days,
        periods: pendingConfigData.periods,
        source: { scope: pendingConfigData.scopeType, id: pendingConfigData.scopeId },
      };
      
      await applyConfigChange(pendingConfigData, newResolved);
      setConfigWarningOpen(false);
      setPendingConfigData(null);
      setMigrationResult(null);
    }
  };

  const handleGenerate = async (options: {
    strictMode: boolean;
    distributeEvenly: boolean;
    avoidConsecutive: boolean;
  }): Promise<GenerationResult> => {
    if (!selectedSectionId || !resolvedConfig) {
      return {
        success: false,
        entries: [],
        unresolved: [],
        conflicts: [],
        message: "No section or config selected",
      };
    }

    const selectedSection = sections.find((s) => s.id === selectedSectionId);
    if (!selectedSection) {
      return {
        success: false,
        entries: [],
        unresolved: [],
        conflicts: [],
        message: "Section not found",
      };
    }

    // Get inactive days (holidays/weekends) from config
    const excludeDays = resolvedConfig.days
      .filter((d) => !d.isActive)
      .map((d) => d.key);

    const result = await generateTimetable(
      {
        sectionId: selectedSectionId,
        gradeId: selectedSection.gradeId,
        termId,
        excludeDays,
        ...options,
      },
      subjects,
      subjectAllocations,
      teacherAllocations,
      teachers,
      rooms,
      allTermEntries,
      resolvedConfig
    );

    return result;
  };

  const handleApplyGenerated = (result: GenerationResult) => {
    // Replace current timetable with generated one
    setTimetableEntries(result.entries);
    setIsDirty(true);
    
    // Recalculate validation
    calculateValidation(result.entries);
    
    showToast(t("generate.result.applied", { count: result.entries.length }), "success");
  };

  const getDefaultTeacher = (subjectId: string): string | null => {
    if (!selectedSectionId) return null;
    
    const allocation = teacherAllocations.find(
      (a) => a.sectionId === selectedSectionId && a.subjectId === subjectId
    );
    return allocation?.teacherId || null;
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
        selectedStageId={selectedStageId}
        selectedGradeId={selectedGradeId}
        selectedSectionId={selectedSectionId}
        onStageChange={setSelectedStageId}
        onGradeChange={setSelectedGradeId}
        onSectionChange={setSelectedSectionId}
        locale={locale}
      />

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
              conflicts={conflicts}
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
          subjectHours={subjectHours}
          conflicts={conflicts.filter((c) =>
            c.sections.some((s) => s.sectionId === selectedSectionId)
          )}
          totalSlots={
            resolvedConfig.days.filter((d) => d.isActive).length *
            resolvedConfig.periods.length
          }
          filledSlots={timetableEntries.filter((e) => e.subjectId).length}
          missingTeacher={timetableEntries.filter((e) => e.subjectId && !e.teacherId).length}
          missingRoom={timetableEntries.filter((e) => e.subjectId && !e.roomId).length}
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
          rooms={rooms}
          onSave={handleSlotSave}
          onClose={() => setEditDialogOpen(false)}
          getDefaultTeacher={getDefaultTeacher}
          locale={locale}
        />
      )}

      {/* Generate Dialog */}
      {generateDialogOpen && (
        <GenerateDialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          onGenerate={handleGenerate}
          onApply={handleApplyGenerated}
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
          locale={locale}
        />
      )}

      {/* Config Change Warning Dialog */}
      {configWarningOpen && migrationResult && (
        <ConfigChangeWarningDialog
          open={configWarningOpen}
          onClose={() => {
            setConfigWarningOpen(false);
            setPendingConfigData(null);
            setMigrationResult(null);
          }}
          onConfirm={handleConfigWarningConfirm}
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
    </div>
  );
}
