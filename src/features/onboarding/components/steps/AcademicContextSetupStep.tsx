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
  createdContexts: string;
  noTerms: string;
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
      {data.years.length > 0 ? (
        <ul
          aria-label={copy.createdContexts}
          className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"
        >
          {data.years.map((year) => {
            const terms = data.termsByYear[year.id] ?? [];

            return (
              <li className="rounded-md bg-gray-50 p-3" key={year.id}>
                <p className="text-sm font-semibold text-gray-950">{year.name}</p>
                {terms.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {terms.map((term) => (
                      <li
                        className="rounded-full border border-primary/15 bg-primary/[0.03] px-2.5 py-1 text-xs font-medium text-gray-700"
                        key={term.id}
                      >
                        {term.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-gray-600">{copy.noTerms}</p>
                )}
              </li>
            );
          })}
        </ul>
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
