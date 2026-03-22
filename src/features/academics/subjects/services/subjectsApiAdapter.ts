import { apiWithToken } from "@/lib/api";
import type {
  CarryOverSubjectsOptions,
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type { SubjectsAdapter } from "@/features/academics/subjects/services/subjectsAdapter";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface SubjectAllocationPayload {
  gradeId: string;
  subjectId: string;
  weeklyHours: number;
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

export const createSubjectsApiAdapter = (
  basePath: string = "/academics/subjects"
): SubjectsAdapter => ({
  async fetchSubjects(termId) {
    return unwrap<Subject[]>(
      apiWithToken(`${basePath}${buildQuery({ termId })}`, {
        method: "GET",
      })
    );
  },

  async createSubject(termId, payload) {
    return unwrap<Subject>(
      apiWithToken(basePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          ...payload,
        }),
      })
    );
  },

  async updateSubject(termId, subjectId, payload) {
    return unwrap<Subject>(
      apiWithToken(`${basePath}/${subjectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          ...payload,
        }),
      })
    );
  },

  async deleteSubject(termId, subjectId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/${subjectId}${buildQuery({ termId })}`, {
        method: "DELETE",
      })
    );
  },

  async fetchSubjectAllocations(termId) {
    return unwrap<SubjectAllocation[]>(
      apiWithToken(`${basePath}/allocations${buildQuery({ termId })}`, {
        method: "GET",
      })
    );
  },

  async bulkUpsertSubjectAllocations(termId, items) {
    await unwrap<void>(
      apiWithToken(`${basePath}/allocations`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          items: items.map(
            (item): SubjectAllocationPayload => ({
              gradeId: item.gradeId,
              subjectId: item.subjectId,
              weeklyHours: item.weeklyHours,
            })
          ),
        }),
      })
    );
  },

  async carryOverSubjectsAndAllocations(params) {
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

  subjectHasAllocations() {
    throw new Error(
      "subjectHasAllocations is not supported by the API adapter. Fetch allocations and compute this in the caller."
    );
  },
});

export const subjectsApiAdapter = createSubjectsApiAdapter();

export const supportsSubjectsAllocationPresenceCheck = (
  adapter: SubjectsAdapter
): boolean => adapter.subjectHasAllocations !== subjectsApiAdapter.subjectHasAllocations;

export const computeSubjectHasAllocations = (
  allocations: SubjectAllocation[],
  subjectId: string
): boolean => allocations.some((allocation) => allocation.subjectId === subjectId && allocation.weeklyHours > 0);

export type { CarryOverSubjectsOptions, Subject, SubjectAllocation };
