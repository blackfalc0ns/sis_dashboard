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
  yearsCount(count: number): string;
  termsCount(count: number): string;
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

  const handleSuccess = () => {
    void refreshStep("academicContext");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-sm font-medium text-gray-950">{copy.yearsCount(data.years.length)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-sm font-medium text-gray-950">{copy.termsCount(countTerms(data))}</p>
        </div>
      </div>
      {targetYear ? (
        <Button onClick={() => setIsTermDialogOpen(true)} type="button">
          {copy.createTerm}
        </Button>
      ) : (
        <Button onClick={() => setIsYearDialogOpen(true)} type="button">
          {copy.createYear}
        </Button>
      )}
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
