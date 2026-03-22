"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Classroom,
  fetchStructureTree,
  type Grade,
  type Section,
  type Stage,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjects, type Subject } from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
  resolveTeacherAllocationForTarget,
  type Teacher,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchTermEvents } from "@/features/academics/calendar/services/calendarService";
import {
  fetchCurriculum,
  fetchAllLessons,
  fetchUnits,
  type Lesson,
  type Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  computeTermWeeks,
  fetchLessonPlans,
  getLessonPlanSummary,
  type LessonPlan,
  type LessonPlanSummary,
  type WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";

interface UseLessonPlansDataParams {
  academicYearId: string;
  termId: string;
  isInitializing: boolean;
  terms: Term[];
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  onLoadError: () => void;
}

export function useLessonPlansData({
  academicYearId,
  termId,
  isInitializing,
  terms,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  selectedSubjectId,
  onLoadError,
}: UseLessonPlansDataParams) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [summary, setSummary] = useState<LessonPlanSummary | null>(null);
  const [assignedTeacherId, setAssignedTeacherId] = useState("");
  const [resolvedClassroomId, setResolvedClassroomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    const loadContextData = async () => {
      if (!termId || !academicYearId) {
        setStages([]);
        setGrades([]);
        setSections([]);
        setClassrooms([]);
        setSubjects([]);
        setTeachers([]);
        if (!isInitializing) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const [structureData, subjectsData, teachersData] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchSubjects(termId),
          fetchTeachers(),
        ]);

        setStages(structureData.stages);
        setGrades(structureData.grades);
        setSections(structureData.sections);
        setClassrooms(structureData.classrooms);
        setSubjects(subjectsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Failed to load lesson plans context data:", error);
        onLoadError();
      } finally {
        setLoading(false);
      }
    };

    loadContextData();
  }, [academicYearId, isInitializing, onLoadError, termId]);

  useEffect(() => {
    const loadCurriculum = async () => {
      if (!termId || !selectedGradeId || !selectedSubjectId) {
        setUnits([]);
        setLessons([]);
        return;
      }

      try {
        const curriculum = await fetchCurriculum(termId, selectedGradeId, selectedSubjectId);
        if (!curriculum) {
          setUnits([]);
          setLessons([]);
          return;
        }

        const [unitsData, lessonsData] = await Promise.all([
          fetchUnits(curriculum.id),
          fetchAllLessons(curriculum.id),
        ]);
        setUnits(unitsData);
        setLessons(lessonsData);
      } catch (error) {
        console.error("Failed to load lesson plans curriculum:", error);
        onLoadError();
      }
    };

    loadCurriculum();
  }, [onLoadError, selectedGradeId, selectedSubjectId, termId]);

  const refreshPlans = useCallback(async () => {
    if (!termId || !selectedSectionId || !selectedSubjectId) {
      setPlans([]);
      setWeeks([]);
      setSummary(null);
      setAssignedTeacherId("");
      setResolvedClassroomId("");
      return;
    }

    try {
      setPlansLoading(true);
      const term = terms.find((item) => item.id === termId);
      if (!term) {
        return;
      }

      const events = await fetchTermEvents(termId);
      const holidays = events.filter((event) => event.type === "HOLIDAY");
      const sectionClassrooms = classrooms.filter(
        (item) => item.sectionId === selectedSectionId
      );
      const hasSelectedClassroom =
        selectedClassroomId &&
        sectionClassrooms.some((item) => item.id === selectedClassroomId);
      const nextResolvedClassroomId = hasSelectedClassroom
        ? selectedClassroomId
        : sectionClassrooms.length === 1
          ? sectionClassrooms[0]!.id
          : "";

      const [weeksData, plansData, summaryData, allocations] = await Promise.all([
        computeTermWeeks(
          term.startDate,
          term.endDate,
          holidays.map((holiday) => ({
            startDate: holiday.startDate,
            endDate: holiday.endDate,
          }))
        ),
        fetchLessonPlans(termId, selectedSectionId, selectedSubjectId, nextResolvedClassroomId || undefined),
        getLessonPlanSummary(termId, selectedSectionId, selectedSubjectId, nextResolvedClassroomId || undefined),
        fetchTeacherAllocations(termId),
      ]);

      setWeeks(weeksData);
      setPlans(plansData);
      setSummary(summaryData);
      setResolvedClassroomId(nextResolvedClassroomId);

      const allocation = resolveTeacherAllocationForTarget(allocations, {
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        classroomId: nextResolvedClassroomId || undefined,
      });
      setAssignedTeacherId(allocation?.teacherId || "");
    } catch (error) {
      console.error("Failed to load lesson plans:", error);
      onLoadError();
    } finally {
      setPlansLoading(false);
    }
  }, [
    classrooms,
    onLoadError,
    selectedClassroomId,
    selectedSectionId,
    selectedSubjectId,
    termId,
    terms,
  ]);

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  return {
    stages,
    grades,
    sections,
    classrooms,
    subjects,
    teachers,
    units,
    lessons,
    plans,
    weeks,
    summary,
    assignedTeacherId,
    resolvedClassroomId,
    loading,
    plansLoading,
    refreshPlans,
  };
}
