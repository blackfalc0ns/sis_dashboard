import { apiWithToken } from "@/lib/api";
import type { StructureAdapter } from "@/features/academics/academic-structure-tree/services/structureAdapter";
import type {
  AcademicYear,
  CarryOverOptions,
  Classroom,
  Grade,
  Section,
  Stage,
  StructureTree,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
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

export const createStructureApiAdapter = (
  basePath: string = "/academics/structure"
): StructureAdapter => ({
  async fetchAcademicYears() {
    return unwrap<AcademicYear[]>(
      apiWithToken(`${basePath}/years`, { method: "GET" })
    );
  },

  async fetchTermsByYear(yearId) {
    return unwrap<Term[]>(
      apiWithToken(`${basePath}/terms${buildQuery({ yearId })}`, { method: "GET" })
    );
  },

  async createAcademicYear(payload) {
    return unwrap<AcademicYear>(
      apiWithToken(`${basePath}/years`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  },

  async updateAcademicYear(id, payload) {
    return unwrap<AcademicYear>(
      apiWithToken(`${basePath}/years/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  },

  async createTerm(payload) {
    return unwrap<Term>(
      apiWithToken(`${basePath}/terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  },

  async updateTerm(id, payload) {
    return unwrap<Term>(
      apiWithToken(`${basePath}/terms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  },

  async fetchStructureTree(yearId, termId) {
    return unwrap<StructureTree>(
      apiWithToken(`${basePath}/tree${buildQuery({ yearId, termId })}`, {
        method: "GET",
      })
    );
  },

  async createStage(yearId, termId, payload) {
    return unwrap<Stage>(
      apiWithToken(`${basePath}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async updateStage(yearId, termId, id, payload) {
    return unwrap<Stage>(
      apiWithToken(`${basePath}/stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async deleteStage(yearId, termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/stages/${id}${buildQuery({ yearId, termId })}`, {
        method: "DELETE",
      })
    );
  },

  async createGrade(yearId, termId, payload) {
    return unwrap<Grade>(
      apiWithToken(`${basePath}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async updateGrade(yearId, termId, id, payload) {
    return unwrap<Grade>(
      apiWithToken(`${basePath}/grades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async deleteGrade(yearId, termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/grades/${id}${buildQuery({ yearId, termId })}`, {
        method: "DELETE",
      })
    );
  },

  async createSection(yearId, termId, payload) {
    return unwrap<Section>(
      apiWithToken(`${basePath}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async updateSection(yearId, termId, id, payload) {
    return unwrap<Section>(
      apiWithToken(`${basePath}/sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async deleteSection(yearId, termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/sections/${id}${buildQuery({ yearId, termId })}`, {
        method: "DELETE",
      })
    );
  },

  async createClassroom(yearId, termId, payload) {
    return unwrap<Classroom>(
      apiWithToken(`${basePath}/classrooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async updateClassroom(yearId, termId, id, payload) {
    return unwrap<Classroom>(
      apiWithToken(`${basePath}/classrooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, ...payload }),
      })
    );
  },

  async deleteClassroom(yearId, termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/classrooms/${id}${buildQuery({ yearId, termId })}`, {
        method: "DELETE",
      })
    );
  },

  async reorderGrades(yearId, termId, stageId, orderedGradeIds) {
    await unwrap<void>(
      apiWithToken(`${basePath}/grades/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, stageId, orderedGradeIds }),
      })
    );
  },

  async reorderSections(yearId, termId, gradeId, orderedSectionIds) {
    await unwrap<void>(
      apiWithToken(`${basePath}/sections/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, gradeId, orderedSectionIds }),
      })
    );
  },

  async reorderClassrooms(yearId, termId, sectionId, orderedClassroomIds) {
    await unwrap<void>(
      apiWithToken(`${basePath}/classrooms/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearId, termId, sectionId, orderedClassroomIds }),
      })
    );
  },

  async carryOverStructure(options) {
    await unwrap<void>(
      apiWithToken(`${basePath}/carry-over`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options satisfies CarryOverOptions),
      })
    );
  },
});

export const structureApiAdapter = createStructureApiAdapter();
