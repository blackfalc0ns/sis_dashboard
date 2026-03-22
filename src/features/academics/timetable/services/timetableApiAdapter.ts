import { apiWithToken } from "@/lib/api";
import type { TimetableAdapter } from "@/features/academics/timetable/services/timetableAdapter";
import type {
  TimetableConflict,
  TimetableEntry,
  TimetableValidationResult,
} from "@/features/academics/timetable/types/timetable";

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

export const createTimetableApiAdapter = (
  detectConflicts: TimetableAdapter["detectConflicts"],
  basePath: string = "/academics/timetable"
): TimetableAdapter => ({
  async fetchTimetable(termId, sectionId, classroomId) {
    const queryParams: Record<string, string> = { termId, sectionId };
    if (classroomId) {
      queryParams.classroomId = classroomId;
    }

    return unwrap<TimetableEntry[]>(
      apiWithToken(`${basePath}${buildQuery(queryParams)}`, {
        method: "GET",
      })
    );
  },

  async fetchAllTimetablesForTerm(termId) {
    return unwrap<TimetableEntry[]>(
      apiWithToken(`${basePath}/all${buildQuery({ termId })}`, {
        method: "GET",
      })
    );
  },

  async upsertTimetableEntries(termId, sectionId, entries, classroomId) {
    return unwrap<TimetableEntry[]>(
      apiWithToken(`${basePath}/entries`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          classroomId,
          entries,
        }),
      })
    );
  },

  async deleteTimetableEntry(termId, sectionId, day, period, classroomId) {
    const queryParams: Record<string, string> = {
      termId,
      sectionId,
      day: String(day),
      period: String(period),
    };
    if (classroomId) {
      queryParams.classroomId = classroomId;
    }

    await unwrap<void>(
      apiWithToken(`${basePath}/entry${buildQuery(queryParams)}`, {
        method: "DELETE",
      })
    );
  },

  async validateTimetable() {
    return unwrap<TimetableValidationResult>(
      apiWithToken(`${basePath}/validate`, {
        method: "POST",
      })
    );
  },

  async publishTimetable(termId, sectionId, classroomId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          classroomId,
        }),
      })
    );
  },

  async unpublishTimetable(termId, sectionId, classroomId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/unpublish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          classroomId,
        }),
      })
    );
  },

  detectConflicts,
});

export const createTimetableConflictRequest = (
  entries: TimetableEntry[],
  sections: Array<{ id: string; nameAr: string; nameEn: string }>,
  classrooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  teachers: Array<{ id: string; nameAr: string; nameEn: string }>,
  rooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>
): {
  entries: TimetableEntry[];
  sections: Array<{ id: string; nameAr: string; nameEn: string }>;
  classrooms: Array<{ id: string; nameAr: string; nameEn: string }>;
  teachers: Array<{ id: string; nameAr: string; nameEn: string }>;
  rooms: Array<{ id: string; nameAr: string; nameEn: string }>;
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>;
} => ({
  entries,
  sections,
  classrooms,
  teachers,
  rooms,
  subjects,
});

export type { TimetableConflict, TimetableEntry, TimetableValidationResult };
