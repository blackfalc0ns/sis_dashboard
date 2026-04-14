// Container component for Teacher Allocation Page
// Handles data fetching, state management, and business logic

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
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
import TeacherAllocationView from "../views/TeacherAllocationView";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAcademicContextBarActions } from "@/features/academics/hooks/useAcademicContextBarActions";

type TeacherAllocationQueryState = {
  activeTab: "matrix" | "load";
};

export default function TeacherAllocationContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty } = useDirtyKey("teacher-allocation");
  const {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
  } = useAcademicYearTermLayoutContext();

  // Context data
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAllocations, setTeacherAllocations] = useState<TeacherAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [carryOverDialogOpen, setCarryOverDialogOpen] = useState(false);
  const queryState = useMemo<TeacherAllocationQueryState>(
    () => ({
      activeTab: searchParams.get("tab") === "load" ? "load" : "matrix",
    }),
    [searchParams]
  );

  // Current working allocations (for validation with unsaved changes)
  const [currentAllocations, setCurrentAllocations] = useState<TeacherAllocation[]>([]);

  const isReadOnly = termStatus === "closed";

  // Load data when year/term changes
  useEffect(() => {
    if (!academicYearId || !termId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [
          structureData,
          subjectsData,
          subjectAllocsData,
          teachersData,
          teacherAllocsData,
        ] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchSubjects(termId),
          fetchSubjectAllocations(termId),
          fetchTeachers(),
          fetchTeacherAllocations(termId),
        ]);

        setGrades(structureData.grades);
        setSections(structureData.sections);
        setClassrooms(structureData.classrooms);
        setSubjects(subjectsData);
        setSubjectAllocations(subjectAllocsData);
        setTeachers(teachersData);
        setTeacherAllocations(teacherAllocsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [academicYearId, termId]);

  // Initialize current allocations when teacher allocations change
  useEffect(() => {
    setCurrentAllocations(teacherAllocations);
  }, [teacherAllocations]);

  const handlePromoteCarryOver = useCallback(() => {
    setCarryOverDialogOpen(true);
  }, []);

  const contextBarActions = useMemo(
    () => ({
      onPromoteCarryOver: handlePromoteCarryOver,
      showPromoteCarryOver: true,
      disablePromoteCarryOver: isReadOnly,
    }),
    [handlePromoteCarryOver, isReadOnly]
  );

  useAcademicContextBarActions(contextBarActions);

  const handleCarryOverSuccess = async () => {
    await refreshData();
    clearDirty();
  };

  const handleValidate = () => {
    setValidationPanelOpen(true);
  };

  const handleAllocationsChange = useCallback(
    (allocations: TeacherAllocation[]) => {
      setCurrentAllocations(allocations);
      const hasChanges =
        JSON.stringify(allocations) !== JSON.stringify(teacherAllocations);
      if (hasChanges) {
        markDirty();
      } else {
        clearDirty();
      }
    },
    [teacherAllocations, markDirty, clearDirty]
  );

  const refreshData = async () => {
    if (!termId) return;
    const [subjectAllocsData, teacherAllocsData] = await Promise.all([
      fetchSubjectAllocations(termId),
      fetchTeacherAllocations(termId),
    ]);
    setSubjectAllocations(subjectAllocsData);
    setTeacherAllocations(teacherAllocsData);
    clearDirty();
  };

  const handleTabChange = (tab: "matrix" | "load") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "load") {
      params.set("tab", "load");
    } else {
      params.delete("tab");
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? `?${nextQuery}` : "?";
    router.push(nextUrl, { scroll: false });
  };

  const handleCloseValidationPanel = () => {
    setValidationPanelOpen(false);
  };

  const handleCloseCarryOverDialog = () => {
    setCarryOverDialogOpen(false);
  };

  // Pass everything to presenter
  return (
    <TeacherAllocationView
      academicYearId={academicYearId}
      termId={termId}
      academicYears={academicYears}
      terms={terms}
      grades={grades}
      sections={sections}
      classrooms={classrooms}
      subjects={subjects}
      subjectAllocations={subjectAllocations}
      teachers={teachers}
      teacherAllocations={teacherAllocations}
      currentAllocations={currentAllocations}
      isLoading={isLoading}
      activeTab={queryState.activeTab}
      validationPanelOpen={validationPanelOpen}
      carryOverDialogOpen={carryOverDialogOpen}
      isReadOnly={isReadOnly}
      onCarryOverSuccess={handleCarryOverSuccess}
      onValidate={handleValidate}
      onAllocationsChange={handleAllocationsChange}
      onRefresh={refreshData}
      onTabChange={handleTabChange}
      onCloseValidationPanel={handleCloseValidationPanel}
      onCloseCarryOverDialog={handleCloseCarryOverDialog}
    />
  );
}
