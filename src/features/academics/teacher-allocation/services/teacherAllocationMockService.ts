import type {
  ApplyTeacherToGradeRequest,
  ClearSubjectAllocationsRequest,
  CreateTeacherAllocationRequest,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";
import type {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";

let nextAllocationSequence = 1;

const mockTeachers: Teacher[] = [
  {
    id: "teacher-1",
    nameAr: "Ahmed Mohamed",
    nameEn: "Ahmed Mohamed",
    email: "ahmed@school.test",
    maxWeeklyLoad: 24,
    subjects: ["subject-1"],
    isActive: true,
  },
];

const allocationsByTerm: Record<string, TeacherAllocation[]> = {};

function createAllocationId() {
  nextAllocationSequence += 1;
  return `mock-allocation-${nextAllocationSequence}`;
}

function ensureTermAllocations(termId: string) {
  if (!allocationsByTerm[termId]) {
    allocationsByTerm[termId] = [];
  }

  return allocationsByTerm[termId];
}

export async function fetchMockTeachers(): Promise<Teacher[]> {
  return mockTeachers.filter((teacher) => teacher.isActive);
}

export async function fetchMockTeacherAllocations(
  termId: string,
): Promise<TeacherAllocation[]> {
  return [...(allocationsByTerm[termId] || [])];
}

export async function createMockTeacherAllocation(
  payload: CreateTeacherAllocationRequest,
): Promise<TeacherAllocation> {
  const allocations = ensureTermAllocations(payload.termId);
  const allocation: TeacherAllocation = {
    id: createAllocationId(),
    termId: payload.termId,
    sectionId: "",
    classroomId: payload.classroomId,
    subjectId: payload.subjectId,
    teacherId: payload.teacherUserId,
  };

  allocations.push(allocation);
  return allocation;
}

export async function bulkCreateMockTeacherAllocations(
  termId: string,
  allocations: TeacherAllocation[],
): Promise<void> {
  const termAllocations = ensureTermAllocations(termId);
  allocations
    .filter((allocation) => allocation.teacherId && allocation.classroomId)
    .forEach((allocation) => {
      termAllocations.push({
        ...allocation,
        id: createAllocationId(),
        termId,
      });
    });
}

export async function clearMockSubjectAllocations(
  payload: ClearSubjectAllocationsRequest,
): Promise<void> {
  allocationsByTerm[payload.termId] = (allocationsByTerm[payload.termId] || [])
    .filter((allocation) => allocation.subjectId !== payload.subjectId);
}

export async function deleteMockTeacherAllocation(
  allocationId: string,
): Promise<void> {
  Object.keys(allocationsByTerm).forEach((termId) => {
    allocationsByTerm[termId] = allocationsByTerm[termId].filter(
      (allocation) => allocation.id !== allocationId,
    );
  });
}

export async function applyMockTeacherToGrade(
  payload: ApplyTeacherToGradeRequest,
): Promise<void> {
  const allocations = ensureTermAllocations(payload.termId);
  (payload.classroomIds || []).forEach((classroomId) => {
    allocations.push({
      id: createAllocationId(),
      termId: payload.termId,
      sectionId: "",
      classroomId,
      subjectId: payload.subjectId,
      teacherId: payload.teacherUserId,
    });
  });
}
