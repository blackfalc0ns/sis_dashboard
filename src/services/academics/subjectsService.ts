// Mock service for Subjects & Allocation (TERM-SCOPED)
// Replace with real API calls when backend is ready

export interface Subject {
  id: string;
  termId: string;
  name: string;
  code?: string;
  stage?: string;
  isActive: boolean;
}

export interface SubjectAllocation {
  gradeId: string;
  subjectId: string;
  weeklyHours: number;
}

// In-memory mock data keyed by termId
const subjectsByTerm: Record<string, Subject[]> = {
  "term-1-1": [
    { id: "subj-1", termId: "term-1-1", name: "Mathematics", code: "MATH101", stage: "Primary", isActive: true },
    { id: "subj-2", termId: "term-1-1", name: "Science", code: "SCI101", stage: "Primary", isActive: true },
    { id: "subj-3", termId: "term-1-1", name: "English", code: "ENG101", isActive: true },
    { id: "subj-4", termId: "term-1-1", name: "Arabic", code: "ARB101", isActive: true },
  ],
  "term-2-1": [
    { id: "subj-5", termId: "term-2-1", name: "Mathematics", code: "MATH101", stage: "Primary", isActive: true },
    { id: "subj-6", termId: "term-2-1", name: "Science", code: "SCI101", stage: "Primary", isActive: true },
  ],
};

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

let idCounter = 1000;
const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

// Subjects CRUD (term-scoped)
export const fetchSubjects = async (termId: string): Promise<Subject[]> => {
  await delay(200);
  return subjectsByTerm[termId] || [];
};

export const createSubject = async (
  termId: string,
  payload: Omit<Subject, "id" | "termId">
): Promise<Subject> => {
  await delay(200);
  const newSubject: Subject = {
    id: generateId("subj"),
    termId,
    ...payload,
  };
  
  if (!subjectsByTerm[termId]) {
    subjectsByTerm[termId] = [];
  }
  subjectsByTerm[termId].push(newSubject);
  return newSubject;
};

export const updateSubject = async (
  termId: string,
  subjectId: string,
  payload: Partial<Omit<Subject, "id" | "termId">>
): Promise<Subject> => {
  await delay(200);
  const subjects = subjectsByTerm[termId] || [];
  const index = subjects.findIndex((s) => s.id === subjectId);
  if (index === -1) throw new Error("Subject not found");
  
  subjects[index] = { ...subjects[index], ...payload };
  return subjects[index];
};

export const deleteSubject = async (termId: string, subjectId: string): Promise<void> => {
  await delay(200);
  const subjects = subjectsByTerm[termId] || [];
  subjectsByTerm[termId] = subjects.filter((s) => s.id !== subjectId);
  
  // Also remove allocations for this subject
  const allocations = allocationsByTerm[termId] || [];
  allocationsByTerm[termId] = allocations.filter((a) => a.subjectId !== subjectId);
};

// Allocations (term-scoped)
export const fetchSubjectAllocations = async (termId: string): Promise<SubjectAllocation[]> => {
  await delay(200);
  return allocationsByTerm[termId] || [];
};

export const bulkUpsertSubjectAllocations = async (
  termId: string,
  items: SubjectAllocation[]
): Promise<void> => {
  await delay(300);
  
  // Remove existing allocations for this term
  allocationsByTerm[termId] = items.filter((item) => item.weeklyHours > 0);
};

// Carry Over (copy subjects and/or allocations from another term)
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

export const carryOverSubjectsAndAllocations = async (
  params: CarryOverSubjectsOptions
): Promise<void> => {
  await delay(500);
  const { fromTermId, toTermId, options } = params;
  
  if (options.copySubjects) {
    const sourceSubjects = subjectsByTerm[fromTermId] || [];
    const copiedSubjects = sourceSubjects.map((s) => ({
      ...s,
      id: generateId("subj"),
      termId: toTermId,
    }));
    
    subjectsByTerm[toTermId] = copiedSubjects;
    
    if (options.copyAllocations) {
      const sourceAllocations = allocationsByTerm[fromTermId] || [];
      
      // Map old subject IDs to new subject IDs
      const subjectIdMap = new Map<string, string>();
      sourceSubjects.forEach((oldSubj, index) => {
        subjectIdMap.set(oldSubj.id, copiedSubjects[index].id);
      });
      
      const copiedAllocations = sourceAllocations.map((a) => ({
        ...a,
        subjectId: subjectIdMap.get(a.subjectId) || a.subjectId,
      }));
      
      allocationsByTerm[toTermId] = copiedAllocations;
    }
  } else if (options.copyAllocations) {
    // Copy allocations only (subjects must already exist)
    const sourceAllocations = allocationsByTerm[fromTermId] || [];
    allocationsByTerm[toTermId] = [...sourceAllocations];
  }
};

// Helper: Check if subject has allocations
export const subjectHasAllocations = (termId: string, subjectId: string): boolean => {
  const allocations = allocationsByTerm[termId] || [];
  return allocations.some((a) => a.subjectId === subjectId && a.weeklyHours > 0);
};
