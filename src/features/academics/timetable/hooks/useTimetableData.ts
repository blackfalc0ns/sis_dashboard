"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAcademicYears,
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeachers,
  fetchTeacherAllocations,
  type Teacher,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  fetchRooms,
  fetchRoomDefaultAssignments,
  type RoomDefaultAssignment,
} from "@/features/academics/rooms/services/roomsService";
import {
  fetchAllTimetablesForTerm,
  fetchTimetable,
  publishTimetable,
  unpublishTimetable,
  upsertTimetableEntries,
} from "@/features/academics/timetable/services/timetableService";
import {
  fetchTimetableConfigs,
  type TimetableConfig,
} from "@/features/academics/timetable/services/timetableConfigService";
import {
  type ResolvedTimetableConfig,
  resolveTimetableConfig,
} from "@/features/academics/timetable/types/timetableConfig";
import { type TimetableEntry, type Room } from "@/features/academics/timetable/types/timetable";

interface UseTimetableDataParams {
  schoolId: string;
  termId: string;
  academicYearId?: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function useTimetableData({
  schoolId,
  termId,
  academicYearId = "",
  selectedSectionId,
  selectedClassroomId,
  showToast,
}: UseTimetableDataParams) {
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
  const [configs, setConfigs] = useState<TimetableConfig[]>([]);
  const [resolvedConfig, setResolvedConfig] = useState<ResolvedTimetableConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const reloadConfigs = useCallback(async () => {
    const nextConfigs = await fetchTimetableConfigs(termId);
    setConfigs(nextConfigs);
    return nextConfigs;
  }, [termId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
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
        configsData,
        entries,
      ] = await Promise.all([
        fetchStructureTree(yearId, termId),
        fetchSubjects(termId),
        fetchSubjectAllocations(termId),
        fetchTeachers(),
        fetchTeacherAllocations(termId),
        fetchRooms(schoolId),
        fetchRoomDefaultAssignments(schoolId),
        fetchTimetableConfigs(termId),
        fetchAllTimetablesForTerm(termId),
      ]);

      setStages(structure.stages || []);
      setGrades(structure.grades || []);
      setSections(structure.sections || []);
      setClassrooms(structure.classrooms || []);
      setSubjects(subjectsData);
      setSubjectAllocations(subjectAllocsData);
      setTeachers(teachersData);
      setTeacherAllocations(teacherAllocsData);
      setRooms(roomsData.filter((room) => room.isActive));
      setRoomDefaults(roomDefaultsData);
      setConfigs(configsData);
      setAllTermEntries(entries);
    } catch (error) {
      console.error("Failed to load data:", error);
      showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId, schoolId, showToast, termId]);

  const loadTimetable = useCallback(async () => {
    if (!selectedSectionId) {
      setTimetableEntries([]);
      setIsPublished(false);
      return;
    }

    try {
      const entries = await fetchTimetable(
        termId,
        selectedSectionId,
        selectedClassroomId || undefined
      );
      setTimetableEntries(entries);
      setIsPublished(entries.length > 0 && entries.every((entry) => entry.status === "PUBLISHED"));
    } catch (error) {
      console.error("Failed to load timetable:", error);
      showToast("Failed to load timetable", "error");
    }
  }, [selectedClassroomId, selectedSectionId, showToast, termId]);

  const saveTimetable = useCallback(
    async (entries: TimetableEntry[]) => {
      if (!selectedSectionId) {
        return false;
      }

      setIsSaving(true);
      try {
        const savedEntries = await upsertTimetableEntries(
          termId,
          selectedSectionId,
          entries,
          selectedClassroomId || undefined
        );
        const refreshedEntries = await fetchAllTimetablesForTerm(termId);
        setAllTermEntries(refreshedEntries);
        setTimetableEntries(savedEntries);
        return true;
      } catch (error) {
        console.error("Failed to save timetable:", error);
        showToast("Failed to save timetable", "error");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [selectedClassroomId, selectedSectionId, showToast, termId]
  );

  const publishCurrentTimetable = useCallback(async () => {
    if (!selectedSectionId) {
      return false;
    }

    try {
      await publishTimetable(termId, selectedSectionId, selectedClassroomId || undefined);
      setTimetableEntries((currentEntries) =>
        currentEntries.map((entry) => ({ ...entry, status: "PUBLISHED" as const }))
      );
      setIsPublished(true);
      return true;
    } catch (error) {
      console.error("Failed to publish timetable:", error);
      return false;
    }
  }, [selectedClassroomId, selectedSectionId, termId]);

  const unpublishCurrentTimetable = useCallback(async () => {
    if (!selectedSectionId) {
      return false;
    }

    try {
      await unpublishTimetable(termId, selectedSectionId, selectedClassroomId || undefined);
      setTimetableEntries((currentEntries) =>
        currentEntries.map((entry) => ({ ...entry, status: "DRAFT" as const }))
      );
      setIsPublished(false);
      return true;
    } catch (error) {
      console.error("Failed to unpublish timetable:", error);
      return false;
    }
  }, [selectedClassroomId, selectedSectionId, termId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  useEffect(() => {
    if (!selectedSectionId || sections.length === 0 || configs.length === 0) {
      setResolvedConfig(null);
      return;
    }

    const section = sections.find((item) => item.id === selectedSectionId);
    if (!section) {
      setResolvedConfig(null);
      return;
    }

    const termConfig = configs.find((config) => config.scopeType === "TERM") || null;
    const gradeConfig =
      configs.find(
        (config) => config.scopeType === "GRADE" && config.scopeId === section.gradeId
      ) || null;
    const sectionConfig =
      configs.find(
        (config) =>
          config.scopeType === "SECTION" && config.scopeId === selectedSectionId
      ) || null;
    const classroomConfig =
      selectedClassroomId
        ? configs.find(
            (config) =>
              config.scopeType === "CLASSROOM" &&
              config.scopeId === selectedClassroomId
          ) || null
        : null;

    setResolvedConfig(
      resolveTimetableConfig(termConfig, gradeConfig, sectionConfig, classroomConfig || undefined)
    );
  }, [configs, sections, selectedClassroomId, selectedSectionId]);

  return {
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
    setAllTermEntries,
    configs,
    resolvedConfig,
    isLoading,
    isSaving,
    isPublished,
    setIsPublished,
    reloadConfigs,
    loadTimetable,
    saveTimetable,
    publishCurrentTimetable,
    unpublishCurrentTimetable,
  };
}
