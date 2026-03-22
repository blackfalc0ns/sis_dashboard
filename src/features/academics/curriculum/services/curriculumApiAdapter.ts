import { apiWithToken } from "@/lib/api";
import type { CurriculumAdapter } from "@/features/academics/curriculum/services/curriculumAdapter";
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentQuestion,
  CarryOverCurriculumOptions,
  Curriculum,
  Lesson,
  LessonAttachment,
  LessonVideo,
  Unit,
} from "@/features/academics/curriculum/services/curriculumService";

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

const jsonHeaders = {
  "Content-Type": "application/json",
};

const buildQuery = (params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `?${search.toString()}`;
};

const createVideoUploadBody = (
  file: File,
  payload: { titleAr: string; titleEn: string }
) => {
  const body = new FormData();
  body.append("file", file);
  body.append("titleAr", payload.titleAr);
  body.append("titleEn", payload.titleEn);
  return body;
};

const createAssignmentAttachmentBody = (
  file: File,
  meta?: { title?: string }
) => {
  const body = new FormData();
  body.append("file", file);
  if (meta?.title) {
    body.append("title", meta.title);
  }
  return body;
};

export const createCurriculumApiAdapter = (
  basePath: string = "/academics/curriculum"
): CurriculumAdapter => ({
  async fetchCurriculum(termId, gradeId, subjectId) {
    return unwrap<Curriculum | null>(
      apiWithToken(
        `${basePath}${buildQuery({ termId, gradeId, subjectId })}`,
        { method: "GET" }
      )
    );
  },

  async createCurriculum(termId, gradeId, subjectId, name) {
    return unwrap<Curriculum>(
      apiWithToken(`${basePath}`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ termId, gradeId, subjectId, name }),
      })
    );
  },

  async updateCurriculum(curriculumId, payload) {
    return unwrap<Curriculum>(
      apiWithToken(`${basePath}/${curriculumId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async fetchUnits(curriculumId) {
    return unwrap<Unit[]>(
      apiWithToken(`${basePath}/${curriculumId}/units`, {
        method: "GET",
      })
    );
  },

  async createUnit(curriculumId, payload) {
    return unwrap<Unit>(
      apiWithToken(`${basePath}/${curriculumId}/units`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async updateUnit(unitId, payload) {
    return unwrap<Unit>(
      apiWithToken(`${basePath}/units/${unitId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteUnit(unitId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/units/${unitId}`, {
        method: "DELETE",
      })
    );
  },

  async reorderUnits(curriculumId, orderedUnitIds) {
    await unwrap<void>(
      apiWithToken(`${basePath}/${curriculumId}/units/reorder`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ orderedUnitIds }),
      })
    );
  },

  async fetchLessons(unitId) {
    return unwrap<Lesson[]>(
      apiWithToken(`${basePath}/units/${unitId}/lessons`, {
        method: "GET",
      })
    );
  },

  async fetchAllLessons(curriculumId) {
    return unwrap<Lesson[]>(
      apiWithToken(`${basePath}/${curriculumId}/lessons`, {
        method: "GET",
      })
    );
  },

  async createLesson(unitId, payload) {
    return unwrap<Lesson>(
      apiWithToken(`${basePath}/units/${unitId}/lessons`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async updateLesson(lessonId, payload) {
    return unwrap<Lesson>(
      apiWithToken(`${basePath}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteLesson(lessonId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/lessons/${lessonId}`, {
        method: "DELETE",
      })
    );
  },

  async reorderLessons(unitId, orderedLessonIds) {
    await unwrap<void>(
      apiWithToken(`${basePath}/units/${unitId}/lessons/reorder`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ orderedLessonIds }),
      })
    );
  },

  async updateLessonSchedule(lessonId, plannedWeek) {
    return unwrap<Lesson>(
      apiWithToken(`${basePath}/lessons/${lessonId}/schedule`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ plannedWeek }),
      })
    );
  },

  async markLessonDone(lessonId) {
    return unwrap<Lesson>(
      apiWithToken(`${basePath}/lessons/${lessonId}/done`, {
        method: "POST",
      })
    );
  },

  async undoLessonDone(lessonId) {
    return unwrap<Lesson>(
      apiWithToken(`${basePath}/lessons/${lessonId}/done`, {
        method: "DELETE",
      })
    );
  },

  async carryOverCurriculum(params) {
    await unwrap<void>(
      apiWithToken(`${basePath}/carry-over`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(params satisfies CarryOverCurriculumOptions),
      })
    );
  },

  async fetchLessonAttachments(lessonId) {
    return unwrap<LessonAttachment[]>(
      apiWithToken(`${basePath}/lessons/${lessonId}/attachments`, {
        method: "GET",
      })
    );
  },

  async uploadLessonAttachmentFile(lessonId, file, meta) {
    const body = new FormData();
    body.append("file", file);
    if (meta?.title) {
      body.append("title", meta.title);
    }
    if (meta?.category) {
      body.append("category", meta.category);
    }
    return unwrap<LessonAttachment>(
      apiWithToken(`${basePath}/lessons/${lessonId}/attachments/file`, {
        method: "POST",
        body,
      })
    );
  },

  async createLessonAttachmentLink(lessonId, payload) {
    return unwrap<LessonAttachment>(
      apiWithToken(`${basePath}/lessons/${lessonId}/attachments/link`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteAttachment(attachmentId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/attachments/${attachmentId}`, {
        method: "DELETE",
      })
    );
  },

  async fetchLessonVideo(lessonId) {
    return unwrap<LessonVideo | null>(
      apiWithToken(`${basePath}/lessons/${lessonId}/video`, {
        method: "GET",
      })
    );
  },

  async upsertLessonVideoLink(lessonId, payload) {
    return unwrap<LessonVideo>(
      apiWithToken(`${basePath}/lessons/${lessonId}/video/link`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async uploadLessonVideoFile(lessonId, file, payload) {
    return unwrap<LessonVideo>(
      apiWithToken(`${basePath}/lessons/${lessonId}/video/file`, {
        method: "PUT",
        body: createVideoUploadBody(file, payload),
      })
    );
  },

  async deleteLessonVideo(lessonId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/lessons/${lessonId}/video`, {
        method: "DELETE",
      })
    );
  },

  async fetchLessonAssignments(lessonId) {
    return unwrap<Assignment[]>(
      apiWithToken(`${basePath}/lessons/${lessonId}/assignments`, {
        method: "GET",
      })
    );
  },

  async fetchAssignmentById(lessonId, assignmentId) {
    return unwrap<Assignment | null>(
      apiWithToken(`${basePath}/lessons/${lessonId}/assignments/${assignmentId}`, {
        method: "GET",
      })
    );
  },

  async createAssignment(lessonId, payload) {
    return unwrap<Assignment>(
      apiWithToken(`${basePath}/lessons/${lessonId}/assignments`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async updateAssignment(assignmentId, payload) {
    return unwrap<Assignment>(
      apiWithToken(`${basePath}/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteAssignment(assignmentId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/assignments/${assignmentId}`, {
        method: "DELETE",
      })
    );
  },

  async fetchAssignmentAttachments(assignmentId) {
    return unwrap<AssignmentAttachment[]>(
      apiWithToken(`${basePath}/assignments/${assignmentId}/attachments`, {
        method: "GET",
      })
    );
  },

  async uploadAssignmentAttachmentFile(assignmentId, file, meta) {
    return unwrap<AssignmentAttachment>(
      apiWithToken(`${basePath}/assignments/${assignmentId}/attachments/file`, {
        method: "POST",
        body: createAssignmentAttachmentBody(file, meta),
      })
    );
  },

  async createAssignmentAttachmentLink(assignmentId, payload) {
    return unwrap<AssignmentAttachment>(
      apiWithToken(`${basePath}/assignments/${assignmentId}/attachments/link`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteAssignmentAttachment(attachmentId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/assignments/attachments/${attachmentId}`, {
        method: "DELETE",
      })
    );
  },

  async fetchAssignmentQuestions(assignmentId) {
    return unwrap<AssignmentQuestion[]>(
      apiWithToken(`${basePath}/assignments/${assignmentId}/questions`, {
        method: "GET",
      })
    );
  },

  async createAssignmentQuestion(assignmentId, payload) {
    return unwrap<AssignmentQuestion>(
      apiWithToken(`${basePath}/assignments/${assignmentId}/questions`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async updateAssignmentQuestion(questionId, payload) {
    return unwrap<AssignmentQuestion>(
      apiWithToken(`${basePath}/questions/${questionId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteAssignmentQuestion(questionId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/questions/${questionId}`, {
        method: "DELETE",
      })
    );
  },

  async reorderAssignmentQuestions(assignmentId, orderedQuestionIds) {
    await unwrap<void>(
      apiWithToken(`${basePath}/assignments/${assignmentId}/questions/reorder`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ orderedQuestionIds }),
      })
    );
  },

  async bulkUpdateQuestionPoints(assignmentId, updates) {
    await unwrap<void>(
      apiWithToken(`${basePath}/assignments/${assignmentId}/questions/points`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ updates }),
      })
    );
  },
});

export const curriculumApiAdapter = createCurriculumApiAdapter();

export type {
  Assignment,
  AssignmentAttachment,
  AssignmentQuestion,
  Curriculum,
  Lesson,
  LessonAttachment,
  LessonVideo,
  Unit,
};
