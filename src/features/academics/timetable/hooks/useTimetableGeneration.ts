"use client";

import { useCallback } from "react";
import {
  generateTimetable,
  type GenerationResult,
} from "@/features/academics/timetable/utils/generator";
import { type ResolvedTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { type TimetableEntry, type Room } from "@/features/academics/timetable/types/timetable";
import { type Subject, type SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import { type Teacher, type TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { type RoomDefaultAssignment } from "@/features/academics/rooms/services/roomsService";

interface SectionLike {
  id: string;
  gradeId: string;
}

interface UseTimetableGenerationParams {
  termId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  resolvedConfig: ResolvedTimetableConfig | null;
  sections: SectionLike[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teacherAllocations: TeacherAllocation[];
  teachers: Teacher[];
  rooms: Room[];
  roomDefaults: RoomDefaultAssignment[];
  allTermEntries: TimetableEntry[];
  setTimetableEntries: React.Dispatch<React.SetStateAction<TimetableEntry[]>>;
  markDirty: () => void;
  showApplied: (count: number) => void;
}

interface GenerationOptionsInput {
  strictMode: boolean;
  distributeEvenly: boolean;
  avoidConsecutive: boolean;
}

export function useTimetableGeneration({
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
  markDirty,
  showApplied,
}: UseTimetableGenerationParams) {
  const handleGenerate = useCallback(
    async (options: GenerationOptionsInput): Promise<GenerationResult> => {
      if (!selectedSectionId || !resolvedConfig) {
        return {
          success: false,
          entries: [],
          unresolved: [],
          conflicts: [],
          message: "No section or config selected",
        };
      }

      const selectedSection = sections.find((section) => section.id === selectedSectionId);
      if (!selectedSection) {
        return {
          success: false,
          entries: [],
          unresolved: [],
          conflicts: [],
          message: "Section not found",
        };
      }

      const excludeDays = resolvedConfig.days
        .filter((day) => !day.isActive)
        .map((day) => day.key);

      return generateTimetable(
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
        roomDefaults,
        allTermEntries,
        resolvedConfig
      );
    },
    [
      allTermEntries,
      resolvedConfig,
      roomDefaults,
      rooms,
      sections,
      selectedClassroomId,
      selectedSectionId,
      subjectAllocations,
      subjects,
      teacherAllocations,
      teachers,
      termId,
    ]
  );

  const applyGenerated = useCallback(
    (result: GenerationResult) => {
      setTimetableEntries(result.entries);
      markDirty();
      showApplied(result.entries.length);
    },
    [markDirty, setTimetableEntries, showApplied]
  );

  return {
    handleGenerate,
    applyGenerated,
  };
}
