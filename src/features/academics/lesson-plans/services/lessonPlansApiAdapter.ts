import { apiWithToken } from "@/lib/api";
import type {
  LessonPlan,
  LessonPlanItem,
  LessonPlanSummary,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import type {
  LessonPlanItemUpsertPayload,
  LessonPlansAdapter,
} from "@/features/academics/lesson-plans/services/lessonPlansAdapter";

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

export const createLessonPlansApiAdapter = (
  basePath: string = "/academics/lesson-plans"
): LessonPlansAdapter => ({
  async fetchLessonPlans(termId, sectionId, subjectId, classroomId) {
    const queryParams: Record<string, string> = { termId, sectionId, subjectId };
    if (classroomId) {
      queryParams.classroomId = classroomId;
    }

    return unwrap<LessonPlan[]>(
      apiWithToken(`${basePath}${buildQuery(queryParams)}`, {
        method: "GET",
      })
    );
  },

  async upsertLessonPlanItem(payload) {
    return unwrap<LessonPlanItem>(
      apiWithToken(`${basePath}/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteLessonPlanItem(termId, sectionId, subjectId, itemId, classroomId) {
    const queryParams: Record<string, string> = {
      termId,
      sectionId,
      subjectId,
      itemId,
    };
    if (classroomId) {
      queryParams.classroomId = classroomId;
    }

    await unwrap<void>(
      apiWithToken(`${basePath}/items${buildQuery(queryParams)}`, {
        method: "DELETE",
      })
    );
  },

  async reorderLessonPlanItems(termId, sectionId, subjectId, weekIndex, orderedItemIds, classroomId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/items/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          subjectId,
          weekIndex,
          orderedItemIds,
          classroomId,
        }),
      })
    );
  },

  async moveLessonPlanItem(termId, sectionId, subjectId, itemId, toWeekIndex, toOrder, classroomId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/items/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          subjectId,
          itemId,
          toWeekIndex,
          toOrder,
          classroomId,
        }),
      })
    );
  },

  async updateLessonPlanItemStatus(termId, sectionId, subjectId, itemId, status, classroomId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/items/${itemId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          subjectId,
          status,
          classroomId,
        }),
      })
    );
  },

  async updateLessonPlanItemNotes(termId, sectionId, subjectId, itemId, notesAr, notesEn, classroomId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/items/${itemId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          subjectId,
          notesAr,
          notesEn,
          classroomId,
        }),
      })
    );
  },

  async getLessonPlanSummary(termId, sectionId, subjectId, classroomId) {
    const queryParams: Record<string, string> = { termId, sectionId, subjectId };
    if (classroomId) {
      queryParams.classroomId = classroomId;
    }

    return unwrap<LessonPlanSummary>(
      apiWithToken(`${basePath}/summary${buildQuery(queryParams)}`, {
        method: "GET",
      })
    );
  },

  async bulkAutoPlan(termId, sectionId, subjectId, classroomId, teacherId, lessonIds, weekCount) {
    await unwrap<void>(
      apiWithToken(`${basePath}/auto-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          sectionId,
          subjectId,
          classroomId,
          teacherId,
          lessonIds,
          weekCount,
        } satisfies Omit<LessonPlanItemUpsertPayload, "weekIndex" | "lessonId"> & {
          lessonIds: string[];
          weekCount: number;
        }),
      })
    );
  },
});

export const lessonPlansApiAdapter = createLessonPlansApiAdapter();
