import type {
  CarryOverSubjectsOptions,
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";

export interface SubjectsAdapter {
  fetchSubjects(termId: string): Promise<Subject[]>;
  createSubject(
    termId: string,
    payload: Omit<Subject, "id" | "termId">
  ): Promise<Subject>;
  updateSubject(
    termId: string,
    subjectId: string,
    payload: Partial<Omit<Subject, "id" | "termId">>
  ): Promise<Subject>;
  deleteSubject(termId: string, subjectId: string): Promise<void>;
  fetchSubjectAllocations(termId: string): Promise<SubjectAllocation[]>;
  bulkUpsertSubjectAllocations(termId: string, items: SubjectAllocation[]): Promise<void>;
  carryOverSubjectsAndAllocations(params: CarryOverSubjectsOptions): Promise<void>;
  subjectHasAllocations(termId: string, subjectId: string): boolean;
}
