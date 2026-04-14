// Presenter component for Subjects Allocation Page
// Pure presentation - receives data via props, no business logic

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type {
  AcademicYear,
  Term,
  Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import SubjectsList from "../components/SubjectsList";
import AllocationMatrix from "../components/AllocationMatrix";
import SubjectDialog from "../components/SubjectDialog";
import CarryOverDialog from "../components/CarryOverDialog";

interface SubjectsAllocationViewProps {
  academicYearId: string;
  termId: string;
  academicYears: AcademicYear[];
  terms: Term[];
  grades: Grade[];
  subjects: Subject[];
  allocations: SubjectAllocation[];
  isLoading: boolean;
  activeTab: "subjects" | "matrix";
  showSubjectDialog: boolean;
  editingSubject: Subject | null;
  showCarryOverDialog: boolean;
  isReadOnly: boolean;
  onTabChange: (tab: "subjects" | "matrix") => void;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onSubjectSuccess: () => void;
  onCarryOverSuccess: () => void;
  onAllocationsChange: (allocations: SubjectAllocation[]) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onRefresh: () => Promise<void>;
  onCloseSubjectDialog: () => void;
  onCloseCarryOverDialog: () => void;
}

export default function SubjectsAllocationView({
  academicYearId,
  termId,
  academicYears,
  terms,
  grades,
  subjects,
  allocations,
  isLoading,
  activeTab,
  showSubjectDialog,
  editingSubject,
  showCarryOverDialog,
  isReadOnly,
  onTabChange,
  onAddSubject,
  onEditSubject,
  onSubjectSuccess,
  onCarryOverSuccess,
  onAllocationsChange,
  onDirtyChange,
  onRefresh,
  onCloseSubjectDialog,
  onCloseCarryOverDialog,
}: SubjectsAllocationViewProps) {
  const t = useTranslations("academics.subjects");
  const router = useRouter();
  const locale = useLocale();

  const yearName = academicYears.find((y) => y.id === academicYearId)?.name;
  const termName = terms.find((t) => t.id === termId)?.name;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("readonly_banner.message")}
          </span>
        </div>
      )}

      {/* Empty State - No Grades */}
      {!isLoading && grades.length === 0 && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.no_grades.title")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("empty_state.no_grades.message")}
            </p>
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/academics/structure`)}
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
                onClick={() => onTabChange("subjects")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "subjects"
                    ? "border-border text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.subjects")}
              </button>
              <button
                onClick={() => onTabChange("matrix")}
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
                onAdd={onAddSubject}
                onEdit={onEditSubject}
                onRefresh={onRefresh}
              />
            </div>

            {/* Right Panel: Matrix */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
              <AllocationMatrix
                grades={grades}
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                yearName={yearName}
                termName={termName}
                isReadOnly={isReadOnly}
                onAllocationsChange={onAllocationsChange}
                onDirtyChange={onDirtyChange}
                onRefresh={onRefresh}
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
                onAdd={onAddSubject}
                onEdit={onEditSubject}
                onRefresh={onRefresh}
              />
            ) : (
              <AllocationMatrix
                grades={grades}
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                yearName={yearName}
                termName={termName}
                isReadOnly={isReadOnly}
                onAllocationsChange={onAllocationsChange}
                onDirtyChange={onDirtyChange}
                onRefresh={onRefresh}
              />
            )}
          </div>
        </>
      )}

      {/* Subject Dialog */}
      <SubjectDialog
        isOpen={showSubjectDialog}
        onClose={onCloseSubjectDialog}
        onSuccess={onSubjectSuccess}
        termId={termId}
        subject={editingSubject}
        existingSubjects={subjects}
      />

      {/* Carry Over Dialog */}
      <CarryOverDialog
        isOpen={showCarryOverDialog}
        onClose={onCloseCarryOverDialog}
        onSuccess={onCarryOverSuccess}
        academicYears={academicYears}
        currentYearId={academicYearId}
        currentTermId={termId}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
