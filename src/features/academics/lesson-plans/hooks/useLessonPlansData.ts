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
  getLessonPlanValidation,
  listLessonPlans,
  listLessonPlanWeeks,
  type LessonPlan,
  type LessonPlanSummary,
  type LessonPlanValidationResponseDto,
  type WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import {
  fetchSubjects,
  type Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
  type Teacher,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";

export type LessonPlansScopeStatus =
  | "loading-options"
  | "missing-academic-year"
  | "missing-term"
  | "missing-grade"
  | "missing-section"
  | "missing-classroom"
  | "missing-subject"
  | "missing-curriculum"
  | "missing-teacher-allocation"
  | "ready";

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
  const [validation, setValidation] =
    useState<LessonPlanValidationResponseDto | null>(null);
  const [assignedTeacherId, setAssignedTeacherId] = useState("");
  const [teacherSubjectAllocationId, setTeacherSubjectAllocationId] =
    useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [resolvedClassroomId, setResolvedClassroomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);
  const [scopeStatus, setScopeStatus] =
    useState<LessonPlansScopeStatus>("loading-options");
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
    const clearScopedData = () => {
      setPlans([]);
      setWeeks([]);
      setSummary(null);
      setValidation(null);
      setUnits([]);
      setLessons([]);
      setCurriculumId("");
      setTeacherSubjectAllocationId("");
      setAssignedTeacherId("");
      setResolvedClassroomId("");
      setPlansLoading(false);
    };
    if (loading) {
      clearScopedData();
      setScopeStatus("loading-options");
      setDataChecked(false);
      return;
    }
    const missingStatus: LessonPlansScopeStatus | null = !academicYearId
      ? "missing-academic-year"
      : !termId
        ? "missing-term"
        : !selectedGradeId
          ? "missing-grade"
          : !selectedSectionId
            ? "missing-section"
            : !selectedSubjectId
              ? "missing-subject"
              : null;
    if (missingStatus) {
      clearScopedData();
      setScopeStatus(missingStatus);
      setDataChecked(true);
      return;
    }
    const sectionClassrooms = classrooms.filter(
      (classroom) => classroom.sectionId === selectedSectionId,
    );
    const classroomId = sectionClassrooms.some(
      (classroom) => classroom.id === selectedClassroomId,
    )
      ? selectedClassroomId
      : "";
    if (sectionClassrooms.length > 0 && !classroomId) {
      clearScopedData();
      setScopeStatus("missing-classroom");
      setDataChecked(true);
      return;
    }
    clearScopedData();
    setPlansLoading(true);
    setDataChecked(false);
    setScopeStatus("loading-options");
    try {
      const [curriculum, allocations] = await Promise.all([
        fetchCurriculumForScope({
          academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
        }),
        fetchTeacherAllocations(termId),
      ]);
      const allocation = allocations.find(
        (candidate) =>
          candidate.termId === termId &&
          candidate.sectionId === selectedSectionId &&
          candidate.subjectId === selectedSubjectId &&
          (classroomId
            ? candidate.classroomId === classroomId
            : !candidate.classroomId),
      );
      if (!curriculum || !allocation || currentRequest !== requestId.current) {
        setPlans([]);
        setWeeks([]);
        setSummary(null);
        setValidation(null);
        setUnits(curriculum?.units ?? []);
        setLessons((curriculum?.units ?? []).flatMap((unit) => unit.lessons));
        setCurriculumId(curriculum?.id ?? "");
        setTeacherSubjectAllocationId(allocation?.id ?? "");
        setAssignedTeacherId(allocation?.teacherId ?? "");
        setResolvedClassroomId(classroomId);
        setDataChecked(true);
        setScopeStatus(
          !curriculum ? "missing-curriculum" : "missing-teacher-allocation",
        );
        return;
      }
      const query = { termId, teacherSubjectAllocationId: allocation.id };
      const [weekList, planList, planSummary, planValidation] =
        await Promise.all([
          listLessonPlanWeeks(query),
          listLessonPlans(query),
          getLessonPlanSummary({
            ...query,
            gradeId: selectedGradeId,
            subjectId: selectedSubjectId,
            classroomId: classroomId || undefined,
          }),
          getLessonPlanValidation({
            ...query,
            gradeId: selectedGradeId,
            subjectId: selectedSubjectId,
            classroomId: classroomId || undefined,
          }),
        ]);
      const detailedPlans = await Promise.all(
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
        detailedPlans.map((plan) => ({
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
      setValidation(planValidation);
      setDataChecked(true);
      setScopeStatus("ready");
    } catch (error) {
      console.error("Failed to load lesson plans:", error);
      onLoadError();
      setDataChecked(true);
    } finally {
      if (currentRequest === requestId.current) setPlansLoading(false);
    }
  }, [
    academicYearId,
    classrooms,
    loading,
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
    validation,
    assignedTeacherId,
    teacherSubjectAllocationId,
    curriculumId,
    resolvedClassroomId,
    loading,
    plansLoading,
    dataChecked,
    scopeStatus,
    scopeMessage: scopeStatus,
    canLoadLessonPlans: scopeStatus === "ready",
    missingScopeReason: scopeStatus === "ready" ? null : scopeStatus,
    isLoading: loading || plansLoading,
    refreshPlans,
  };
}
