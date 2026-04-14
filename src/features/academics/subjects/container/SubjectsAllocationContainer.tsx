// Container component for Subjects Allocation Page
// Handles data fetching, state management, and business logic

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import {
  fetchStructureTree,
  type Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import SubjectsAllocationView from "../views/SubjectsAllocationView";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAcademicContextBarActions } from "@/features/academics/hooks/useAcademicContextBarActions";

type SubjectsAllocationQueryState = {
  activeTab: "subjects" | "matrix";
};

export default function SubjectsAllocationContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty } = useDirtyKey("subjects-allocation");
  const {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
  } = useAcademicYearTermLayoutContext();

  // Data
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);
  const queryState = useMemo<SubjectsAllocationQueryState>(
    () => ({
      activeTab: searchParams.get("tab") === "matrix" ? "matrix" : "subjects",
    }),
    [searchParams]
  );

  const isReadOnly = termStatus === "closed";

  // Load data when year/term changes
  useEffect(() => {
    if (!academicYearId || !termId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [structureData, subjectsData, allocationsData] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchSubjects(termId),
          fetchSubjectAllocations(termId),
        ]);

        setGrades(structureData.grades);
        setSubjects(subjectsData);
        setAllocations(allocationsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [academicYearId, termId]);

  const handlePromoteCarryOver = useCallback(() => {
    setShowCarryOverDialog(true);
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

  const handleTabChange = (tab: "subjects" | "matrix") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "matrix") {
      params.set("tab", "matrix");
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

  const refreshData = async () => {
    if (!termId) return;
    const [subjectsData, allocationsData] = await Promise.all([
      fetchSubjects(termId),
      fetchSubjectAllocations(termId),
    ]);
    setSubjects(subjectsData);
    setAllocations(allocationsData);
    clearDirty();
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setShowSubjectDialog(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setShowSubjectDialog(true);
  };

  const handleSubjectSuccess = async () => {
    await refreshData();
    setShowSubjectDialog(false);
    setEditingSubject(null);
  };

  const handleCarryOverSuccess = async () => {
    await refreshData();
    setShowCarryOverDialog(false);
    clearDirty();
  };

  const handleAllocationsChange = useCallback(
    (newAllocations: SubjectAllocation[]) => {
      setAllocations(newAllocations);
      markDirty();
    },
    [markDirty]
  );

  const handleDirtyChange = useCallback(
    (isDirty: boolean) => {
      if (isDirty) {
        markDirty();
      } else {
        clearDirty();
      }
    },
    [markDirty, clearDirty]
  );

  const handleCloseSubjectDialog = () => {
    setShowSubjectDialog(false);
    setEditingSubject(null);
  };

  const handleCloseCarryOverDialog = () => {
    setShowCarryOverDialog(false);
  };

  // Pass everything to presenter
  return (
    <SubjectsAllocationView
      academicYearId={academicYearId}
      termId={termId}
      academicYears={academicYears}
      terms={terms}
      grades={grades}
      subjects={subjects}
      allocations={allocations}
      isLoading={isLoading}
      activeTab={queryState.activeTab}
      showSubjectDialog={showSubjectDialog}
      editingSubject={editingSubject}
      showCarryOverDialog={showCarryOverDialog}
      isReadOnly={isReadOnly}
      onTabChange={handleTabChange}
      onAddSubject={handleAddSubject}
      onEditSubject={handleEditSubject}
      onSubjectSuccess={handleSubjectSuccess}
      onCarryOverSuccess={handleCarryOverSuccess}
      onAllocationsChange={handleAllocationsChange}
      onDirtyChange={handleDirtyChange}
      onRefresh={refreshData}
      onCloseSubjectDialog={handleCloseSubjectDialog}
      onCloseCarryOverDialog={handleCloseCarryOverDialog}
    />
  );
}
