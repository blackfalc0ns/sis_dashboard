// Container component for Subjects Allocation Page
// Handles data fetching, state management, and business logic

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  fetchStructureTree,
  type AcademicYear,
  type Term,
  type Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  findSelectedYear,
  findSelectedTerm,
  buildURLParams,
} from "@/features/academics/subjects/utils/subjectsAllocationHelpers";
import SubjectsAllocationView from "../views/SubjectsAllocationView";

export default function SubjectsAllocationContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty } = useDirtyKey("subjects-allocation");

  // URL params
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");

  // Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<"subjects" | "matrix">("subjects");
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);

  const isReadOnly = termStatus === "closed";

  // Initialize from URL or defaults
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

        const selectedYear = findSelectedYear(years, urlYear);
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        const selectedTerm = findSelectedTerm(yearTerms, urlTerm);

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);

          const urlParams = buildURLParams(selectedYear.id, selectedTerm.id);
          router.replace(`?${urlParams}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateURL = useCallback(
    (yearId: string, tId: string) => {
      const urlParams = buildURLParams(yearId, tId);
      router.replace(`?${urlParams}`, { scroll: false });
    },
    [router]
  );

  const handleAcademicYearChange = async (yearId: string) => {
    setAcademicYearId(yearId);

    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);

    const defaultTerm = findSelectedTerm(yearTerms, null);
    if (defaultTerm) {
      setTermId(defaultTerm.id);
      setTermStatus(defaultTerm.status);
      updateURL(yearId, defaultTerm.id);
    }
  };

  const handleTermChange = (tId: string) => {
    const selectedTerm = terms.find((t) => t.id === tId);
    if (selectedTerm) {
      setTermId(tId);
      setTermStatus(selectedTerm.status);
      updateURL(academicYearId, tId);
    }
  };

  const handlePromoteCarryOver = () => {
    setShowCarryOverDialog(true);
  };

  const handleTabChange = (tab: "subjects" | "matrix") => {
    setActiveTab(tab);
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
      termStatus={termStatus}
      academicYears={academicYears}
      terms={terms}
      grades={grades}
      subjects={subjects}
      allocations={allocations}
      isLoading={isLoading}
      activeTab={activeTab}
      showSubjectDialog={showSubjectDialog}
      editingSubject={editingSubject}
      showCarryOverDialog={showCarryOverDialog}
      isReadOnly={isReadOnly}
      onAcademicYearChange={handleAcademicYearChange}
      onTermChange={handleTermChange}
      onPromoteCarryOver={handlePromoteCarryOver}
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
