import { apiWithToken } from "@/lib/api";
import type {
  CarryOverTeacherAllocationsOptions,
  Teacher,
  TeacherAllocation,
  TeacherLoad,
  ValidationResult,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { TeacherAllocationAdapter } from "@/features/academics/teacher-allocation/services/teacherAllocationAdapter";
import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface StructureData {
  grades?: Grade[];
  sections?: Section[];
  classrooms?: Classroom[];
  subjects?: Subject[];
}

const unwrap = async <T>(request: Promise<ApiEnvelope<T> | T>): Promise<T> => {
  const response = await request;

  if (
    response &&
    typeof response === "object" &&
    ("data" in response || "error" in response || "message" in response)
  ) {
    const envelope = response as ApiEnvelope<T>;
    if (envelope.error) {
      throw new Error(envelope.error);
    }
    if (typeof envelope.data === "undefined") {
      throw new Error(envelope.message || "Missing API response data");
    }
    return envelope.data;
  }

  return response as T;
};

const buildQuery = (params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `?${search.toString()}`;
};

export const createTeacherAllocationApiAdapter = (
  basePath: string = "/academics/teacher-allocation"
): TeacherAllocationAdapter => ({
  async fetchTeachers() {
    return unwrap<Teacher[]>(
      apiWithToken(`${basePath}/teachers`, {
        method: "GET",
      })
    );
  },

  async createTeacher(payload) {
    return unwrap<Teacher>(
      apiWithToken(`${basePath}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );
  },

  async updateTeacher(teacherId, payload) {
    return unwrap<Teacher>(
      apiWithToken(`${basePath}/teachers/${teacherId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteTeacher(teacherId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/teachers/${teacherId}`, {
        method: "DELETE",
      })
    );
  },

  async fetchTeacherAllocations(termId) {
    return unwrap<TeacherAllocation[]>(
      apiWithToken(`${basePath}/allocations${buildQuery({ termId })}`, {
        method: "GET",
      })
    );
  },

  async bulkUpsertTeacherAllocations(termId, items) {
    await unwrap<void>(
      apiWithToken(`${basePath}/allocations`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          items,
        }),
      })
    );
  },

  async clearAllocationsForSubject(termId, gradeId, subjectId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/allocations/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          gradeId,
          subjectId,
        }),
      })
    );
  },

  async applyTeacherToGrade(
    termId,
    gradeId,
    subjectId,
    teacherId,
    sectionIds,
    classroomIdsBySection
  ) {
    await unwrap<void>(
      apiWithToken(`${basePath}/allocations/apply-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          gradeId,
          subjectId,
          teacherId,
          sectionIds,
          classroomIdsBySection,
        }),
      })
    );
  },

  async calculateTeacherLoads(termId, structureData, subjectAllocations, teacherAllocations) {
    return unwrap<TeacherLoad[]>(
      apiWithToken(`${basePath}/analytics/teacher-loads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          structureData,
          subjectAllocations,
          teacherAllocations,
        }),
      })
    );
  },

  async validateAllocations(termId, structureData, subjectAllocations) {
    return unwrap<ValidationResult>(
      apiWithToken(`${basePath}/validation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          structureData,
          subjectAllocations,
        }),
      })
    );
  },

  async carryOverTeacherAllocations(params) {
    await unwrap<void>(
      apiWithToken(`${basePath}/carry-over`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })
    );
  },
});

export const teacherAllocationApiAdapter = createTeacherAllocationApiAdapter();

export const normalizeTeacherAllocationValidationInput = (
  structureData: StructureData,
  subjectAllocations: SubjectAllocation[]
) => ({
  structureData,
  subjectAllocations,
});

export type {
  CarryOverTeacherAllocationsOptions,
  Teacher,
  TeacherAllocation,
  TeacherLoad,
  ValidationResult,
};
