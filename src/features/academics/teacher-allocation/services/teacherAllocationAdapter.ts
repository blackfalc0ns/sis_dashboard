import type {
  CarryOverTeacherAllocationsOptions,
  Teacher,
  TeacherAllocation,
  TeacherLoad,
  ValidationResult,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";

interface StructureData {
  grades?: Grade[];
  sections?: Section[];
  classrooms?: Classroom[];
  subjects?: Subject[];
}

export interface TeacherAllocationAdapter {
  fetchTeachers(): Promise<Teacher[]>;
  createTeacher(payload: Omit<Teacher, "id">): Promise<Teacher>;
  updateTeacher(
    teacherId: string,
    payload: Partial<Omit<Teacher, "id">>
  ): Promise<Teacher>;
  deleteTeacher(teacherId: string): Promise<void>;
  fetchTeacherAllocations(termId: string): Promise<TeacherAllocation[]>;
  bulkUpsertTeacherAllocations(
    termId: string,
    items: Omit<TeacherAllocation, "id" | "termId">[]
  ): Promise<void>;
  clearAllocationsForSubject(
    termId: string,
    gradeId: string,
    subjectId: string
  ): Promise<void>;
  applyTeacherToGrade(
    termId: string,
    gradeId: string,
    subjectId: string,
    teacherId: string | null,
    sectionIds: string[],
    classroomIdsBySection?: Record<string, string[]>
  ): Promise<void>;
  calculateTeacherLoads(
    termId: string,
    structureData: StructureData,
    subjectAllocations: SubjectAllocation[],
    teacherAllocations?: TeacherAllocation[]
  ): Promise<TeacherLoad[]>;
  validateAllocations(
    termId: string,
    structureData: StructureData,
    subjectAllocations: SubjectAllocation[]
  ): Promise<ValidationResult>;
  carryOverTeacherAllocations(
    params: CarryOverTeacherAllocationsOptions
  ): Promise<void>;
}
