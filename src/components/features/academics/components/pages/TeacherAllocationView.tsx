// Presenter component for Teacher Allocation Page
// Pure presentation - receives data via props, no business logic

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertCircle, Grid3x3, BarChart3 } from "lucide-react";
import { Tabs, Tab } from "@mui/material";
import ContextBar from "../shared/ContextBar";
import type {
  AcademicYear,
  Term,
  Grade,
  Section,
} from "@/services/academics/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/services/academics/subjectsService";
import type {
  Teacher,
  TeacherAllocation,
} from "@/services/academics/teacherAllocationService";
import AllocationMatrixView from "../teacher-allocation/AllocationMatrixView";
import TeacherLoadView from "../teacher-allocation/TeacherLoadView";
import ValidationPanel from "../teacher-allocation/ValidationPanel";
import CarryOverDialog from "../teacher-allocation/CarryOverDialog";
import { Button } from "@/components/ui";

interface TeacherAllocationViewProps {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  academicYears: AcademicYear[];
  terms: Term[];
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherAllocations: TeacherAllocation[];
  currentAllocations: TeacherAllocation[];
  isLoading: boolean;
  activeTab: "matrix" | "load";
  validationPanelOpen: boolean;
  carryOverDialogOpen: boolean;
  isReadOnly: boolean;
  onAcademicYearChange: (yearId: string) => void;
  onTermChange: (termId: string) => void;
  onPromoteCarryOver: () => void;
  onCarryOverSuccess: () => void;
  onValidate: () => void;
  onAllocationsChange: (allocations: TeacherAllocation[]) => void;
  onRefresh: () => Promise<void>;
  onTabChange: (tab: "matrix" | "load") => void;
  onCloseValidationPanel: () => void;
  onCloseCarryOverDialog: () => void;
}

export default function TeacherAllocationView({
  academicYearId,
  termId,
  termStatus,
  academicYears,
  terms,
  grades,
  sections,
  subjects,
  subjectAllocations,
  teachers,
  teacherAllocations,
  currentAllocations,
  isLoading,
  activeTab,
  validationPanelOpen,
  carryOverDialogOpen,
  isReadOnly,
  onAcademicYearChange,
  onTermChange,
  onPromoteCarryOver,
  onCarryOverSuccess,
  onValidate,
  onAllocationsChange,
  onRefresh,
  onTabChange,
  onCloseValidationPanel,
  onCloseCarryOverDialog,
}: TeacherAllocationViewProps) {
  const t = useTranslations("academics.teacherAllocation");
  const router = useRouter();

  const yearName = academicYears.find((y) => y.id === academicYearId)?.name;
  const termName = terms.find((t) => t.id === termId)?.name;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={onAcademicYearChange}
        onTermChange={onTermChange}
        onPromoteCarryOver={onPromoteCarryOver}
        isReadOnly={isReadOnly}
      />

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readOnlyBanner")}</span>
        </div>
      )}

      {/* Empty State - No Grades */}
      {!isLoading && grades.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("emptyState.noGrades.title")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("emptyState.noGrades.message")}
            </p>
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  router.push("/academics/structure");
                }}
              >
                {t("emptyState.noGrades.cta")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - No Subjects */}
      {!isLoading && grades.length > 0 && subjects.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
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
              {t("emptyState.noSubjects.title")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("emptyState.noSubjects.message")}
            </p>
          </div>
        </div>
      )}

      {/* Empty State - No Teachers */}
      {!isLoading &&
        grades.length > 0 &&
        subjects.length > 0 &&
        teachers.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noTeachers.title")}
              </h3>
              <p className="text-gray-600">
                {t("emptyState.noTeachers.message")}
              </p>
            </div>
          </div>
        )}

      {/* Main Content */}
      {!isLoading &&
        grades.length > 0 &&
        subjects.length > 0 &&
        teachers.length > 0 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-[1400px] mx-auto px-2">
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => onTabChange(newValue)}
                  sx={{
                    minHeight: 48,
                    "& .MuiTab-root": {
                      minHeight: 48,
                      textTransform: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--color-text-secondary, #6b7280)",
                      "&.Mui-selected": {
                        color: "var(--color-primary, #006D82)",
                      },
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: "var(--color-primary, #006D82)",
                    },
                  }}
                >
                  <Tab
                    label={
                      <div className="flex items-center gap-2 p-2">
                        <Grid3x3 className="w-5 h-5" />
                        <span className="text-[16px] font-semibold">
                          {t("tabs.matrix")}
                        </span>
                      </div>
                    }
                    value="matrix"
                  />
                  <Tab
                    label={
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[16px] font-semibold">
                          {t("tabs.load")}
                        </span>
                      </div>
                    }
                    value="load"
                  />
                </Tabs>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "matrix" && (
                <AllocationMatrixView
                  termId={termId}
                  yearName={yearName}
                  termName={termName}
                  grades={grades}
                  sections={sections}
                  subjects={subjects}
                  subjectAllocations={subjectAllocations}
                  teachers={teachers}
                  teacherAllocations={teacherAllocations}
                  isReadOnly={isReadOnly}
                  onRefresh={onRefresh}
                  onValidate={onValidate}
                  onCopyFromTerm={onPromoteCarryOver}
                  onAllocationsChange={onAllocationsChange}
                />
              )}
              {activeTab === "load" && (
                <TeacherLoadView
                  termId={termId}
                  grades={grades}
                  sections={sections}
                  subjects={subjects}
                  subjectAllocations={subjectAllocations}
                  teachers={teachers}
                  teacherAllocations={currentAllocations}
                />
              )}
            </div>
          </div>
        )}

      {/* Validation Panel */}
      <ValidationPanel
        open={validationPanelOpen}
        onClose={onCloseValidationPanel}
        termId={termId}
        grades={grades}
        sections={sections}
        subjects={subjects}
        subjectAllocations={subjectAllocations}
        teachers={teachers}
        teacherAllocations={currentAllocations}
      />

      {/* Carry Over Dialog */}
      <CarryOverDialog
        open={carryOverDialogOpen}
        onClose={onCloseCarryOverDialog}
        currentYearId={academicYearId}
        currentTermId={termId}
        onSuccess={onCarryOverSuccess}
      />
    </div>
  );
}
