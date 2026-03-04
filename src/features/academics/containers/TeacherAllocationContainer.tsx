// Container component for Teacher Allocation Page
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
  type Section,
} from "@/services/academics/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/services/academics/subjectsService";
import {
  fetchTeachers,
  fetchTeacherAllocations,
  type Teacher,
  type TeacherAllocation,
} from "@/services/academics/teacherAllocationService";
import {
  findSelectedYear,
  findSelectedTerm,
  buildURLParams,
} from "@/features/academics/utils/teacherAllocationHelpers";
import TeacherAllocationView from "../components/pages/TeacherAllocationView";

export default function TeacherAllocationContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty } = useDirtyKey("teacher-allocation");

  // URL params
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");

  // Context data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAllocations, setTeacherAllocations] = useState<TeacherAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<"matrix" | "load">("matrix");
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [carryOverDialogOpen, setCarryOverDialogOpen] = useState(false);

  // Current working allocations (for validation with unsaved changes)
  const [currentAllocations, setCurrentAllocations] = useState<TeacherAllocation[]>([]);

  const isReadOnly = termStatus === "closed";

  // Initialize from URL
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
    setCarryOverDialogOpen(true);
  };

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
    setActiveTab(tab);
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
      termStatus={termStatus}
      academicYears={academicYears}
      terms={terms}
      grades={grades}
      sections={sections}
      subjects={subjects}
      subjectAllocations={subjectAllocations}
      teachers={teachers}
      teacherAllocations={teacherAllocations}
      currentAllocations={currentAllocations}
      isLoading={isLoading}
      activeTab={activeTab}
      validationPanelOpen={validationPanelOpen}
      carryOverDialogOpen={carryOverDialogOpen}
      isReadOnly={isReadOnly}
      onAcademicYearChange={handleAcademicYearChange}
      onTermChange={handleTermChange}
      onPromoteCarryOver={handlePromoteCarryOver}
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
