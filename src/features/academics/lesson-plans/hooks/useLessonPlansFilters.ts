"use client";

import { useCallback } from "react";
import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface LessonPlansFilterState {
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
}

interface UseLessonPlansFiltersParams {
  initialFilters?: Partial<LessonPlansFilterState>;
}

export function useLessonPlansFilters({
  initialFilters,
}: UseLessonPlansFiltersParams = {}) {
  const selectedStageId = initialFilters?.stageId || "";
  const selectedGradeId = initialFilters?.gradeId || "";
  const selectedSectionId = initialFilters?.sectionId || "";
  const selectedClassroomId = initialFilters?.classroomId || "";
  const selectedSubjectId = initialFilters?.subjectId || "";

  const hasFilters = !!(
    selectedStageId ||
    selectedGradeId ||
    selectedSectionId ||
    selectedClassroomId ||
    selectedSubjectId
  );

  const getFilteredGrades = useCallback(
    (grades: Grade[]) => {
      if (!selectedStageId) {
        return grades;
      }
      return grades.filter((grade) => grade.stageId === selectedStageId);
    },
    [selectedStageId]
  );

  const getFilteredSections = useCallback(
    (sections: Section[]) => {
      if (!selectedGradeId) {
        return sections;
      }
      return sections.filter((section) => section.gradeId === selectedGradeId);
    },
    [selectedGradeId]
  );

  const getFilteredClassrooms = useCallback(
    (classrooms: Classroom[]) => {
      if (!selectedSectionId) {
        return [];
      }
      return classrooms.filter((classroom) => classroom.sectionId === selectedSectionId);
    },
    [selectedSectionId]
  );

  return {
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    hasFilters,
    getFilteredGrades,
    getFilteredSections,
    getFilteredClassrooms,
  };
}
