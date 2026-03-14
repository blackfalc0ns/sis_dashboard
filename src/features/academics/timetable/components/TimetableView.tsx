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
import ExportButton from "@/components/ui/button/ExportButton";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import {
  fetchAcademicYears,
  fetchStructureTree,
  Stage,
  Grade,
  Section,
  Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeachers,
  fetchTeacherAllocations,
  Teacher,
  TeacherAllocation,
  resolveTeacherAllocationForTarget,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  fetchRooms,
  fetchRoomDefaultAssignments,
  resolveDefaultRoomSourceForTarget,
  resolveDefaultRoomForTarget,
  type RoomDefaultAssignment,
  type RoomAssignmentSource,
} from "@/features/academics/rooms/services/roomsService";
import { fetchTermEvents } from "@/features/academics/calendar/services/calendarService";
import {
  fetchTimetable,
  fetchAllTimetablesForTerm,
  upsertTimetableEntries,
  publishTimetable,
  unpublishTimetable,
  detectConflicts,
} from "@/features/academics/timetable/services/timetableService";
import {
  TimetableEntry,
  Room,
  TimetableConflict,
  SubjectHoursSummary,
} from "@/features/academics/timetable/types/timetable";
import { generateTimetable, GenerationResult } from "@/features/academics/timetable/utils/generator";
import {
  TimetableConfig,
  TimetableConfigScope,
  ResolvedTimetableConfig,
  resolveTimetableConfig,
  mapEntriesToNewConfig,
  TimetableDay,
  TimetablePeriod,
} from "@/features/academics/timetable/types/timetableConfig";
import {
  fetchTimetableConfigs,
  upsertTimetableConfig,
} from "@/features/academics/timetable/services/timetableConfigService";
import MainLoader from "@/components/ui/loaders/MainLoader";
import {
  exportAcademicsData,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";

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
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAllocations, setTeacherAllocations] = useState<TeacherAllocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDefaults, setRoomDefaults] = useState<RoomDefaultAssignment[]>([]);
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
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
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
        const classroomConfig = selectedClassroomId
          ? configs.find(
              (c) => c.scopeType === "CLASSROOM" && c.scopeId === selectedClassroomId
            )
          : null;
        
        const resolved = resolveTimetableConfig(termConfig || null, gradeConfig, sectionConfig, classroomConfig || undefined);
        setResolvedConfig(resolved);
      }
    }
  }, [selectedClassroomId, selectedSectionId, configs, sections]);

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

      const [
        structure,
        subjectsData,
        subjectAllocsData,
        teachersData,
        teacherAllocsData,
        roomsData,
        roomDefaultsData,
        ,
        configsData,
      ] =
        await Promise.all([
          fetchStructureTree(yearId, termId),
          fetchSubjects(termId),
          fetchSubjectAllocations(termId),
          fetchTeachers(),
          fetchTeacherAllocations(termId),
          fetchRooms("school-1"),
          fetchRoomDefaultAssignments("school-1"),
          fetchTermEvents(termId), // Fetched but not used currently
          fetchTimetableConfigs(termId),
        ]);

      // Extract stages, grades and sections from structure
      const allStages: Stage[] = structure.stages || [];
      const allGrades: Grade[] = structure.grades || [];
      const allSections: Section[] = structure.sections || [];
      const allClassrooms: Classroom[] = structure.classrooms || [];

      // Filter only HOLIDAY events with SCHOOL scope
      // const schoolHolidays = calendarEvents.filter(
      //   (event) => event.type === "HOLIDAY" && event.scopeType === "SCHOOL"
      // );

      setStages(allStages);
      setGrades(allGrades);
      setSections(allSections);
      setClassrooms(allClassrooms);
      setSubjects(subjectsData);
      setSubjectAllocations(subjectAllocsData);
      setTeachers(teachersData);
      setTeacherAllocations(teacherAllocsData);
      setRooms(roomsData.filter((r) => r.isActive));
      setRoomDefaults(roomDefaultsData);
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
        classrooms,
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
      classrooms,
    ]
  );

  const loadTimetable = useCallback(async () => {
    if (!selectedSectionId) return;

    try {
      const entries = await fetchTimetable(termId, selectedSectionId, selectedClassroomId || undefined);
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
  }, [selectedClassroomId, selectedSectionId, termId, calculateValidation, showToast]);

  // Load timetable when section changes
  useEffect(() => {
    if (selectedSectionId) {
      loadTimetable();
    }
  }, [selectedClassroomId, selectedSectionId, termId, loadTimetable]);

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
    
    // Recalculate validation
    calculateValidation(updatedEntries);
  };

  const handleSave = async () => {
    if (!selectedSectionId) return;

    setIsSaving(true);
    try {
      await upsertTimetableEntries(termId, selectedSectionId, timetableEntries, selectedClassroomId || undefined);
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
      (c) =>
        c.sections.some(
          (section) =>
            section.sectionId === selectedSectionId &&
            ((selectedClassroomId && section.classroomId === selectedClassroomId) ||
              (!selectedClassroomId && !section.classroomId))
        )
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
      await publishTimetable(termId, selectedSectionId, selectedClassroomId || undefined);
      
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
      await unpublishTimetable(termId, selectedSectionId, selectedClassroomId || undefined);
      
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
        classroomId: selectedClassroomId || undefined,
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

  const getRecommendedRooms = (subjectId?: string): Room[] => {
    const selectedClassroom = selectedClassroomId
      ? classrooms.find((item) => item.id === selectedClassroomId)
      : undefined;
    const subject = subjectId ? subjects.find((item) => item.id === subjectId) : undefined;
    const subjectLabel = `${subject?.nameEn || ""} ${subject?.nameAr || ""}`.toLowerCase();
    const isLabSubject =
      subjectLabel.includes("science") ||
      subjectLabel.includes("computer") ||
      subjectLabel.includes("stem") ||
      subjectLabel.includes("?????") ||
      subjectLabel.includes("????");
    const explicitDefaultRoom = selectedSectionId
      ? resolveDefaultRoomForTarget(rooms, roomDefaults, {
          schoolId: "school-1",
          sectionId: selectedSectionId,
          classroomId: selectedClassroomId || undefined,
        })
      : null;

    return [...rooms].sort((left, right) => {
      const getScore = (room: Room) => {
        let score = 0;

        if (explicitDefaultRoom?.id === room.id) {
          score += 200;
        }

        if (
          selectedClassroom &&
          (room.nameEn === selectedClassroom.nameEn || room.nameAr === selectedClassroom.nameAr)
        ) {
          score += 100;
        }

        if (selectedClassroom && room.capacity >= selectedClassroom.capacity) {
          score += 10;
        }

        if (selectedClassroom && room.type === "CLASSROOM") {
          score += 5;
        }

        if (isLabSubject && room.type === "LAB") {
          score += 20;
        }

        return score;
      };

      return getScore(right) - getScore(left);
    });
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
  } => {
    if (selectedSectionId) {
      const explicitDefaultRoom = resolveDefaultRoomForTarget(rooms, roomDefaults, {
        schoolId: "school-1",
        sectionId: selectedSectionId,
        classroomId: selectedClassroomId || undefined,
      });
      const explicitDefaultSource = resolveDefaultRoomSourceForTarget(roomDefaults, {
        schoolId: "school-1",
        sectionId: selectedSectionId,
        classroomId: selectedClassroomId || undefined,
      });

      if (explicitDefaultRoom && explicitDefaultSource) {
        return {
          roomId: explicitDefaultRoom.id,
          source: explicitDefaultSource,
        };
      }
    }

    const [preferredRoom] = getRecommendedRooms(subjectId);
    return {
      roomId: preferredRoom?.id || null,
      source: preferredRoom ? "RECOMMENDED" : null,
    };
  };

  const getRoomSource = (
    roomId: string | null,
    subjectId?: string
  ): RoomAssignmentSource | null => {
    if (!roomId) {
      return null;
    }

    const explicitDefaultRoom = selectedSectionId
      ? resolveDefaultRoomForTarget(rooms, roomDefaults, {
          schoolId: "school-1",
          sectionId: selectedSectionId,
          classroomId: selectedClassroomId || undefined,
        })
      : null;
    const explicitDefaultSource = selectedSectionId
      ? resolveDefaultRoomSourceForTarget(roomDefaults, {
          schoolId: "school-1",
          sectionId: selectedSectionId,
          classroomId: selectedClassroomId || undefined,
        })
      : null;

    if (explicitDefaultRoom?.id === roomId && explicitDefaultSource) {
      return explicitDefaultSource;
    }

    if (subjectId) {
      const [recommendedRoom] = getRecommendedRooms(subjectId);
      if (recommendedRoom?.id === roomId) {
        return "RECOMMENDED";
      }
    }

    return "MANUAL";
  };

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

  const handleExport = (format: "csv" | "excel") => {
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
        onStageChange={setSelectedStageId}
        onGradeChange={setSelectedGradeId}
        onSectionChange={setSelectedSectionId}
        onClassroomChange={setSelectedClassroomId}
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
              <ExportButton onExport={handleExport} disabled={!selectedSectionId} />
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
              <ExportButton onExport={handleExport} disabled={!selectedSectionId} />
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
            c.sections.some(
              (section) =>
                section.sectionId === selectedSectionId &&
                ((selectedClassroomId && section.classroomId === selectedClassroomId) ||
                  (!selectedClassroomId && !section.classroomId))
            )
          )}
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
                  schoolId: "school-1",
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
          classrooms={classrooms}
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
