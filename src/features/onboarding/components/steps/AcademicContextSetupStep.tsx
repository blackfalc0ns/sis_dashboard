"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import { YearDialog, TermDialog } from "@/features/academics/components/dialogs/YearTermDialogs";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { AcademicContextSetupData } from "../../types";

export interface AcademicContextSetupStepCopy {
  summary: string;
  savedData: string;
  edit: string;
  cancel: string;
  yearsCount(count: number): string;
  termsCount(count: number): string;
  selectedYear(name: string): string;
  createYear: string;
  createTerm: string;
}

interface AcademicContextSetupStepProps {
  copy: AcademicContextSetupStepCopy;
  data: AcademicContextSetupData;
  selectedYear: AcademicYear | null;
  refreshStep(stepId: "academicContext"): Promise<void> | void;
}

function countTerms(data: AcademicContextSetupData) {
  return Object.values(data.termsByYear).reduce((total, terms) => total + terms.length, 0);
}

export function AcademicContextSetupStep({
  copy,
  data,
  selectedYear,
  refreshStep,
}: AcademicContextSetupStepProps) {
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const targetYear = selectedYear ?? data.years[0] ?? null;
  const targetTerms: Term[] = targetYear ? data.termsByYear[targetYear.id] ?? [] : [];
  const termCount = countTerms(data);
  const hasMinimumData = data.years.length > 0 && termCount > 0;
  const [isManuallyEditing, setIsManuallyEditing] = useState(false);
  const isEditing = !hasMinimumData || isManuallyEditing;

  const handleSuccess = () => {
    void refreshStep("academicContext");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      {!isEditing ? (
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div>
            <h3 className="text-base font-semibold text-gray-950">{copy.savedData}</h3>
            {targetYear ? (
              <p className="mt-1 text-sm text-gray-600">
                {copy.selectedYear(targetYear.name)}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-950">
                {copy.yearsCount(data.years.length)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-950">
                {copy.termsCount(termCount)}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsManuallyEditing(true)} type="button" variant="secondary">
            {copy.edit}
          </Button>
        </section>
      ) : null}
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-sm font-medium text-gray-950">
                {copy.yearsCount(data.years.length)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-sm font-medium text-gray-950">
                {copy.termsCount(termCount)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasMinimumData ? (
              <Button
                onClick={() => setIsManuallyEditing(false)}
                type="button"
                variant="secondary"
              >
                {copy.cancel}
              </Button>
            ) : null}
            {targetYear ? (
              <Button onClick={() => setIsTermDialogOpen(true)} type="button">
                {copy.createTerm}
              </Button>
            ) : (
              <Button onClick={() => setIsYearDialogOpen(true)} type="button">
                {copy.createYear}
              </Button>
            )}
          </div>
        </div>
      ) : null}
      <YearDialog
        editYear={null}
        existingYears={data.years}
        isOpen={isYearDialogOpen}
        onClose={() => setIsYearDialogOpen(false)}
        onSuccess={handleSuccess}
      />
      {targetYear ? (
        <TermDialog
          academicYear={targetYear}
          editTerm={null}
          existingTerms={targetTerms}
          isOpen={isTermDialogOpen}
          onClose={() => setIsTermDialogOpen(false)}
          onSuccess={handleSuccess}
        />
      ) : null}
    </div>
  );
}
