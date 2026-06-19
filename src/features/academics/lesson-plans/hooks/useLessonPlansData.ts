"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Classroom,
  fetchStructureTree,
  type Grade,
  type Section,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchCurriculumForScope,
  type Lesson,
  type Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  getLessonPlan,
  getLessonPlanSummary,
  listLessonPlans,
  listLessonPlanWeeks,
  type LessonPlan,
  type LessonPlanSummary,
  type WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import {
  fetchSubjects,
  type Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
  resolveTeacherAllocationForTarget,
  type Teacher,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";

interface Params {
  academicYearId: string;
  termId: string;
  isInitializing: boolean;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  onLoadError: () => void;
}

export function useLessonPlansData(params: Params) {
  const {
    academicYearId,
    termId,
    isInitializing,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    onLoadError,
  } = params;
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
  const [teacherSubjectAllocationId, setTeacherSubjectAllocationId] =
    useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [resolvedClassroomId, setResolvedClassroomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    void (async () => {
      if (!termId || !academicYearId) {
        setStages([]);
        setGrades([]);
        setLoading(isInitializing);
        return;
      }
      try {
        setLoading(true);
        const [tree, subjectList, teacherList] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchSubjects(termId),
          fetchTeachers(),
        ]);
        setStages(tree.stages);
        setGrades(tree.grades);
        setSections(tree.sections);
        setClassrooms(tree.classrooms);
        setSubjects(subjectList);
        setTeachers(teacherList);
      } catch (error) {
        console.error("Failed to load lesson plans context data:", error);
        onLoadError();
      } finally {
        setLoading(false);
      }
    })();
  }, [academicYearId, isInitializing, onLoadError, termId]);

  const refreshPlans = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (
      !academicYearId ||
      !termId ||
      !selectedGradeId ||
      !selectedSectionId ||
      !selectedSubjectId
    ) {
      setPlans([]);
      setWeeks([]);
      setSummary(null);
      setUnits([]);
      setLessons([]);
      setCurriculumId("");
      setTeacherSubjectAllocationId("");
      setAssignedTeacherId("");
      setResolvedClassroomId("");
      setPlansLoading(false);
      return;
    }
    setPlansLoading(true);
    try {
      const sectionClassrooms = classrooms.filter(
        (classroom) => classroom.sectionId === selectedSectionId,
      );
      const classroomId = sectionClassrooms.some(
        (classroom) => classroom.id === selectedClassroomId,
      )
        ? selectedClassroomId
        : sectionClassrooms.length === 1
          ? sectionClassrooms[0]!.id
          : "";
      const [curriculum, allocations] = await Promise.all([
        fetchCurriculumForScope({
          academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
        }),
        fetchTeacherAllocations(termId),
      ]);
      const allocation = resolveTeacherAllocationForTarget(allocations, {
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        classroomId: classroomId || undefined,
      });
      if (!curriculum || !allocation || currentRequest !== requestId.current) {
        setPlans([]);
        setWeeks([]);
        setSummary(null);
        setUnits(curriculum?.units ?? []);
        setLessons((curriculum?.units ?? []).flatMap((unit) => unit.lessons));
        setCurriculumId(curriculum?.id ?? "");
        setTeacherSubjectAllocationId("");
        setAssignedTeacherId("");
        setResolvedClassroomId(classroomId);
        return;
      }
      const query = { termId, teacherSubjectAllocationId: allocation.id };
      const [weekList, planList, planSummary] = await Promise.all([
        listLessonPlanWeeks(query),
        listLessonPlans(query),
        getLessonPlanSummary(query),
      ]);
      const details = await Promise.all(
        planList.map((plan) => getLessonPlan(plan.id)),
      );
      if (currentRequest !== requestId.current) return;
      setResolvedClassroomId(classroomId);
      setAssignedTeacherId(allocation.teacherId ?? "");
      setTeacherSubjectAllocationId(allocation.id);
      setCurriculumId(curriculum.id);
      setUnits(curriculum.units ?? []);
      setLessons((curriculum.units ?? []).flatMap((unit) => unit.lessons));
      setWeeks(weekList);
      setPlans(
        details.map((plan) => ({
          ...plan,
          weekIndex:
            weekList.find(
              (week) =>
                plan.weekStartDate >= week.startDate &&
                plan.weekStartDate <= week.endDate,
            )?.weekIndex ?? plan.weekIndex,
        })),
      );
      setSummary(planSummary);
    } catch (error) {
      console.error("Failed to load lesson plans:", error);
      onLoadError();
    } finally {
      if (currentRequest === requestId.current) setPlansLoading(false);
    }
  }, [
    academicYearId,
    classrooms,
    onLoadError,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    selectedSubjectId,
    termId,
  ]);

  useEffect(() => {
    void refreshPlans();
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
    teacherSubjectAllocationId,
    curriculumId,
    resolvedClassroomId,
    loading,
    plansLoading,
    refreshPlans,
  };
}
