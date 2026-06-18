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
  id?: string;
  academicYearId?: string;
  termId?: string;
  gradeId: string;
  subjectId: string;
  weeklyHours: number;
  grade?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  subject?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string | null;
    color: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
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

// Direct API Delegation for Allocations
export const fetchSubjectAllocations = (
  termId: string,
  filters?: { gradeId?: string; subjectId?: string },
): Promise<SubjectAllocation[]> =>
  subjectsApiAdapter.fetchSubjectAllocations(termId, filters);
export const bulkUpsertSubjectAllocations = (
  termId: string,
  items: SubjectAllocation[],
): Promise<void> =>
  subjectsApiAdapter.bulkUpsertSubjectAllocations(termId, items);
export const carryOverSubjectsAndAllocations = carryOverSubjectsAndAllocationsImpl;
