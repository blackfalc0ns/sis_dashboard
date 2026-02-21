"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import ContextBar from "../shared/ContextBar";
import Button from "@/components/ui/button/Button";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  fetchStructureTree,
  AcademicYear,
  Term,
  Grade,
} from "@/services/academics/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  Subject,
  SubjectAllocation,
} from "@/services/academics/subjectsService";
import SubjectsList from "../subjects/SubjectsList";
import AllocationMatrix from "../subjects/AllocationMatrix";
import SubjectDialog from "../subjects/SubjectDialog";
import CarryOverDialog from "../subjects/CarryOverDialog";

export default function SubjectsAllocationPage() {
  const t = useTranslations("academics.subjects");
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isReadOnly = termStatus === "closed";

  // Initialize from URL or defaults
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

        const selectedYear = years.find((y) => y.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        let selectedTerm = yearTerms.find((t) => t.id === urlTerm);
        if (!selectedTerm) {
          selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);

          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
          router.replace(`?${params.toString()}`, { scroll: false });
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
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", tId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleAcademicYearChange = async (yearId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }

    setAcademicYearId(yearId);

    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);

    const defaultTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (defaultTerm) {
      setTermId(defaultTerm.id);
      setTermStatus(defaultTerm.status);
      updateURL(yearId, defaultTerm.id);
    }
  };

  const handleTermChange = (tId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }

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
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }
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
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        onPromoteCarryOver={handlePromoteCarryOver}
        isReadOnly={isReadOnly}
      />

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readonly_banner.message")}</span>
        </div>
      )}

      {/* Empty State - No Grades */}
      {!isLoading && grades.length === 0 && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty_state.no_grades.title")}</h3>
            <p className="text-gray-600 mb-6">{t("empty_state.no_grades.message")}</p>
            <Button
              variant="primary"
              onClick={() => router.push(`/${searchParams.get("lang") || "en"}/academics/structure`)}
            >
              {t("empty_state.no_grades.cta")}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && grades.length > 0 && (
        <>
          {/* Mobile Tabs */}
          <div className="lg:hidden border-b border-border bg-white">
            <div className="flex">
              <button
                onClick={() => handleTabChange("subjects")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "subjects"
                    ? "border-border text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.subjects")}
              </button>
              <button
                onClick={() => handleTabChange("matrix")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "matrix"
                    ? "border-border text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.matrix")}
              </button>
            </div>
          </div>

          {/* Desktop: Two-Panel Layout */}
          <div className="hidden lg:flex flex-1 overflow-hidden">
            {/* Left Panel: Subjects */}
            <div className="w-96 border-r border-border bg-white flex flex-col">
              <SubjectsList
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                isReadOnly={isReadOnly}
                onAdd={handleAddSubject}
                onEdit={handleEditSubject}
                onRefresh={refreshData}
              />
            </div>

            {/* Right Panel: Matrix */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
              <AllocationMatrix
                grades={grades}
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                isReadOnly={isReadOnly}
                onAllocationsChange={setAllocations}
                onDirtyChange={setHasUnsavedChanges}
                onRefresh={refreshData}
              />
            </div>
          </div>

          {/* Mobile: Single Panel */}
          <div className="lg:hidden flex-1 overflow-hidden">
            {activeTab === "subjects" ? (
              <SubjectsList
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                isReadOnly={isReadOnly}
                onAdd={handleAddSubject}
                onEdit={handleEditSubject}
                onRefresh={refreshData}
              />
            ) : (
              <AllocationMatrix
                grades={grades}
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                isReadOnly={isReadOnly}
                onAllocationsChange={setAllocations}
                onDirtyChange={setHasUnsavedChanges}
                onRefresh={refreshData}
              />
            )}
          </div>
        </>
      )}

      {/* Subject Dialog */}
      <SubjectDialog
        isOpen={showSubjectDialog}
        onClose={() => {
          setShowSubjectDialog(false);
          setEditingSubject(null);
        }}
        onSuccess={handleSubjectSuccess}
        termId={termId}
        subject={editingSubject}
        existingSubjects={subjects}
      />

      {/* Carry Over Dialog */}
      <CarryOverDialog
        isOpen={showCarryOverDialog}
        onClose={() => setShowCarryOverDialog(false)}
        onSuccess={handleCarryOverSuccess}
        academicYears={academicYears}
        currentYearId={academicYearId}
        currentTermId={termId}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
