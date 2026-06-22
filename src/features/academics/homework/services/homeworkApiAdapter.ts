import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type {
  BackendHomeworkAssignmentDto,
  BackendHomeworkAttachmentDetailResponse,
  BackendHomeworkAttachmentsResponse,
  BackendHomeworkListResponse,
  BackendHomeworkQuestionDto,
  BackendHomeworkQuestionDetailResponse,
  BackendHomeworkQuestionsResponse,
  BackendHomeworkTargetsResponse,
  CreateHomeworkAssignmentRequest,
  HomeworkAdapter,
  HomeworkAssignmentListFilters,
  UpdateHomeworkAssignmentRequest,
} from "./homeworkApi.types";
import {
  mapBackendHomeworkAssignmentToUi,
  mapBackendHomeworkAttachmentToBuilder,
  mapBackendHomeworkQuestionToBuilder,
  mapBackendHomeworkTargetToUi,
  mapBuilderOptionToHomeworkPayload,
  mapBuilderQuestionToHomeworkCreatePayload,
  mapBuilderQuestionToHomeworkUpdatePayload,
  mapHomeworkCreateFormToPayload,
} from "./homeworkMappers";

const BASE_PATH = "/homework/assignments";

function extractQuestionList(
  response: BackendHomeworkQuestionsResponse | BackendHomeworkQuestionDto[],
): BackendHomeworkQuestionDto[] {
  if (Array.isArray(response)) return response;
  return response.items;
}

function extractAttachmentList(response: BackendHomeworkAttachmentsResponse) {
  return response.items;
}

function extractTargetList(response: BackendHomeworkTargetsResponse) {
  return response.items ?? response.targets ?? [];
}

function questionPath(homeworkId: string, questionId: string) {
  return `${BASE_PATH}/${homeworkId}/questions/${questionId}`;
}

async function reconcileQuestionOptions(
  homeworkId: string,
  questionId: string,
  question: AssignmentQuestion,
  currentQuestion: BackendHomeworkQuestionDto,
) {
  const path = questionPath(homeworkId, questionId);
  const requestedOptions = question.options ?? [];
  const requestedIds = new Set(requestedOptions.map(({ id }) => id));
  const currentIds = new Set(currentQuestion.options.map(({ optionId }) => optionId));

  for (const option of currentQuestion.options) {
    if (!requestedIds.has(option.optionId)) {
      await apiDelete(`${path}/options/${option.optionId}`);
    }
  }

  for (const option of requestedOptions) {
    const payload = mapBuilderOptionToHomeworkPayload(option);
    if (!currentIds.has(option.id)) {
      await apiPost(`${path}/options`, payload);
      continue;
    }
    await apiPatch(`${path}/options/${option.id}`, {
      text: payload.text,
      isCorrect: payload.isCorrect,
    });
    await apiPatch(`${path}/options/${option.id}/reorder`, {
      sortOrder: option.order,
    });
  }
}

function isChoiceQuestion(question: AssignmentQuestion) {
  return question.questionType === "MCQ_SINGLE" ||
    question.questionType === "MCQ_MULTI" ||
    question.questionType === "TRUE_FALSE";
}

async function updateTrueFalseOptions(
  path: string,
  currentQuestion: BackendHomeworkQuestionDto,
  correctAnswer: boolean,
) {
  const desired = [
    { text: "True", isCorrect: correctAnswer, sortOrder: 0 },
    { text: "False", isCorrect: !correctAnswer, sortOrder: 1 },
  ];
  for (const option of desired) {
    const currentOption = currentQuestion.options.find(({ sortOrder }) => sortOrder === option.sortOrder);
    if (currentOption) {
      await apiPatch(`${path}/options/${currentOption.optionId}`, {
        text: option.text,
        isCorrect: option.isCorrect,
      });
    } else {
      await apiPost(`${path}/options`, option);
    }
  }
}

export const homeworkApiAdapter: HomeworkAdapter = {
  async listAssignments(filters: HomeworkAssignmentListFilters) {
    const response = await apiGet<BackendHomeworkListResponse>(BASE_PATH, {
      params: filters,
    });
    return {
      items: response.items.map(mapBackendHomeworkAssignmentToUi),
      meta: response.meta,
    };
  },

  async createAssignment(payload: CreateHomeworkAssignmentRequest) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      BASE_PATH,
      mapHomeworkCreateFormToPayload(payload),
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async getAssignment(homeworkId: string) {
    const response = await apiGet<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async updateAssignment(
    homeworkId: string,
    payload: UpdateHomeworkAssignmentRequest,
  ) {
    const response = await apiPatch<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}`,
      payload,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async publishAssignment(homeworkId: string) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}/publish`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async closeAssignment(homeworkId: string) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}/close`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async cancelAssignment(homeworkId: string) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}/cancel`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async listTargets(homeworkId: string) {
    const response = await apiGet<BackendHomeworkTargetsResponse>(
      `${BASE_PATH}/${homeworkId}/targets`,
    );
    return extractTargetList(response).map(mapBackendHomeworkTargetToUi);
  },

  async resolveTargets(homeworkId: string) {
    const response = await apiPost<BackendHomeworkTargetsResponse>(
      `${BASE_PATH}/${homeworkId}/targets/resolve`,
    );
    return extractTargetList(response).map(mapBackendHomeworkTargetToUi);
  },

  async listQuestions(homeworkId: string) {
    const response = await apiGet<BackendHomeworkQuestionsResponse | BackendHomeworkQuestionDto[]>(
      `${BASE_PATH}/${homeworkId}/questions`,
    );
    return extractQuestionList(response).map(mapBackendHomeworkQuestionToBuilder);
  },

  async createQuestion(homeworkId: string, question: AssignmentQuestion) {
    const response = await apiPost<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions`,
      mapBuilderQuestionToHomeworkCreatePayload(question),
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async updateQuestion(
    homeworkId: string,
    questionId: string,
    question: AssignmentQuestion,
  ) {
    const path = questionPath(homeworkId, questionId);
    const current = await apiGet<BackendHomeworkQuestionDetailResponse>(path);
    if (!isChoiceQuestion(question)) {
      for (const option of current.question.options) {
        await apiDelete(`${path}/options/${option.optionId}`);
      }
    }
    await apiPatch<BackendHomeworkQuestionDetailResponse>(
      path,
      mapBuilderQuestionToHomeworkUpdatePayload(question),
    );
    if (question.questionType === "TRUE_FALSE") {
      await updateTrueFalseOptions(path, current.question, question.correctAnswer ?? true);
    } else if (isChoiceQuestion(question)) {
      await reconcileQuestionOptions(homeworkId, questionId, question, current.question);
    }
    const response = await apiGet<BackendHomeworkQuestionDetailResponse>(path);
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async deleteQuestion(homeworkId: string, questionId: string) {
    await apiDelete(`${BASE_PATH}/${homeworkId}/questions/${questionId}`);
  },

  async reorderQuestion(homeworkId: string, questionId: string, order: number) {
    const response = await apiPatch<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/reorder`,
      { sortOrder: order },
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async createOption(homeworkId, questionId, option) {
    const response = await apiPost<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/options`,
      mapBuilderOptionToHomeworkPayload(option),
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async updateOption(homeworkId, questionId, option) {
    const response = await apiPatch<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/options/${option.id}`,
      mapBuilderOptionToHomeworkPayload(option),
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async deleteOption(homeworkId, questionId, optionId) {
    await apiDelete(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/options/${optionId}`,
    );
  },

  async listAttachments(homeworkId: string) {
    const response = await apiGet<BackendHomeworkAttachmentsResponse>(
      `${BASE_PATH}/${homeworkId}/attachments`,
    );
    return extractAttachmentList(response).map(mapBackendHomeworkAttachmentToBuilder);
  },

  async createAttachment(homeworkId: string, payload) {
    const response = await apiPost<BackendHomeworkAttachmentDetailResponse>(
      `${BASE_PATH}/${homeworkId}/attachments`,
      payload,
    );
    return mapBackendHomeworkAttachmentToBuilder(response.attachment);
  },

  async deleteAttachment(homeworkId: string, attachmentId: string) {
    await apiDelete(`${BASE_PATH}/${homeworkId}/attachments/${attachmentId}`);
  },
};
