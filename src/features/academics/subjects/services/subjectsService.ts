// Mock service for Subjects & Allocation (TERM-SCOPED)
// Replace with real API calls when backend is ready

import type { SubjectsAdapter } from "@/features/academics/subjects/services/subjectsAdapter";
import { subjectsApiAdapter } from "@/features/academics/subjects/services/subjectsApiAdapter";

export interface Subject {
  id: string;
  termId: string;
  name: string; // Display name (backward compatibility)
  nameAr: string;
  nameEn: string;
  code?: string;
  stage?: string;
  color?: string;
  isActive: boolean;
}

export interface SubjectAllocation {
  gradeId: string;
  subjectId: string;
  weeklyHours: number;
}

const allocationsByTerm: Record<string, SubjectAllocation[]> = {
  "term-1-1": [
    { gradeId: "grade-1", subjectId: "subj-1", weeklyHours: 5 },
    { gradeId: "grade-1", subjectId: "subj-2", weeklyHours: 4 },
    { gradeId: "grade-1", subjectId: "subj-3", weeklyHours: 5 },
    { gradeId: "grade-2", subjectId: "subj-1", weeklyHours: 6 },
    { gradeId: "grade-2", subjectId: "subj-2", weeklyHours: 4 },
  ],
  "term-2-1": [
    { gradeId: "grade-1", subjectId: "subj-5", weeklyHours: 5 },
    { gradeId: "grade-1", subjectId: "subj-6", weeklyHours: 4 },
  ],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Allocations (term-scoped) - MOCK IMPLEMENTATION (UI Ready)
const fetchSubjectAllocationsImpl = async (termId: string): Promise<SubjectAllocation[]> => {
  await delay(200);
  return allocationsByTerm[termId] || [];
};

const bulkUpsertSubjectAllocationsImpl = async (
  termId: string,
  items: SubjectAllocation[]
): Promise<void> => {
  await delay(300);
  
  // Remove existing allocations for this term
  allocationsByTerm[termId] = items.filter((item) => item.weeklyHours > 0);
};

// Carry Over (copy subjects and/or allocations from another term) - MOCK IMPLEMENTATION
export interface CarryOverSubjectsOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
  options: {
    copySubjects: boolean;
    copyAllocations: boolean;
  };
}

const carryOverSubjectsAndAllocationsImpl = async (
  params: CarryOverSubjectsOptions
): Promise<void> => {
  await delay(500);
  const { fromTermId, toTermId, options } = params;
  
  if (options.copyAllocations) {
    // Copy allocations only (subjects must already exist)
    const sourceAllocations = allocationsByTerm[fromTermId] || [];
    allocationsByTerm[toTermId] = [...sourceAllocations];
  }
};

// Helper: Check if subject has allocations - MOCK IMPLEMENTATION
const subjectHasAllocationsImpl = (termId: string, subjectId: string): boolean => {
  const allocations = allocationsByTerm[termId] || [];
  return allocations.some((a) => a.subjectId === subjectId && a.weeklyHours > 0);
};

// Direct API Delegation for Subjects
export const fetchSubjects = (termId: string): Promise<Subject[]> =>
  subjectsApiAdapter.fetchSubjects(termId);

export const createSubject = (
  termId: string,
  payload: Omit<Subject, "id" | "termId">
): Promise<Subject> => subjectsApiAdapter.createSubject(termId, payload);

export const updateSubject = (
  termId: string,
  subjectId: string,
  payload: Partial<Omit<Subject, "id" | "termId">>
): Promise<Subject> => subjectsApiAdapter.updateSubject(termId, subjectId, payload);

export const deleteSubject = (termId: string, subjectId: string): Promise<void> =>
  subjectsApiAdapter.deleteSubject(termId, subjectId);

// Direct Mock Delegation for Allocations
export const fetchSubjectAllocations = fetchSubjectAllocationsImpl;
export const bulkUpsertSubjectAllocations = bulkUpsertSubjectAllocationsImpl;
export const carryOverSubjectsAndAllocations = carryOverSubjectsAndAllocationsImpl;
export const subjectHasAllocations = subjectHasAllocationsImpl;

