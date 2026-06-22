import type { HomeworkAdapter } from "./homeworkApi.types";
import { homeworkApiAdapter } from "./homeworkApiAdapter";

let homeworkAdapter: HomeworkAdapter = homeworkApiAdapter;

export const getHomeworkAdapter = () => homeworkAdapter;

export const setHomeworkAdapter = (adapter: HomeworkAdapter) => {
  homeworkAdapter = adapter;
};

export const resetHomeworkAdapter = () => {
  homeworkAdapter = homeworkApiAdapter;
};

export const listHomeworkAssignments: HomeworkAdapter["listAssignments"] = (
  filters,
) => homeworkAdapter.listAssignments(filters);

export const createHomeworkAssignment: HomeworkAdapter["createAssignment"] = (
  payload,
) => homeworkAdapter.createAssignment(payload);

export const fetchHomeworkAssignment: HomeworkAdapter["getAssignment"] = (
  homeworkId,
) => homeworkAdapter.getAssignment(homeworkId);

export const updateHomeworkAssignment: HomeworkAdapter["updateAssignment"] = (
  homeworkId,
  payload,
) => homeworkAdapter.updateAssignment(homeworkId, payload);

export const publishHomeworkAssignment: HomeworkAdapter["publishAssignment"] = (
  homeworkId,
) => homeworkAdapter.publishAssignment(homeworkId);

export const closeHomeworkAssignment: HomeworkAdapter["closeAssignment"] = (
  homeworkId,
) => homeworkAdapter.closeAssignment(homeworkId);

export const cancelHomeworkAssignment: HomeworkAdapter["cancelAssignment"] = (
  homeworkId,
) => homeworkAdapter.cancelAssignment(homeworkId);

export const listHomeworkTargets: HomeworkAdapter["listTargets"] = (
  homeworkId,
) => homeworkAdapter.listTargets(homeworkId);

export const resolveHomeworkTargets: HomeworkAdapter["resolveTargets"] = (
  homeworkId,
) => homeworkAdapter.resolveTargets(homeworkId);

export const listHomeworkQuestions: HomeworkAdapter["listQuestions"] = (
  homeworkId,
) => homeworkAdapter.listQuestions(homeworkId);

export const createHomeworkQuestion: HomeworkAdapter["createQuestion"] = (
  homeworkId,
  question,
) => homeworkAdapter.createQuestion(homeworkId, question);

export const updateHomeworkQuestion: HomeworkAdapter["updateQuestion"] = (
  homeworkId,
  questionId,
  question,
) => homeworkAdapter.updateQuestion(homeworkId, questionId, question);

export const deleteHomeworkQuestion: HomeworkAdapter["deleteQuestion"] = (
  homeworkId,
  questionId,
) => homeworkAdapter.deleteQuestion(homeworkId, questionId);

export const reorderHomeworkQuestion: HomeworkAdapter["reorderQuestion"] = (
  homeworkId,
  questionId,
  order,
) => homeworkAdapter.reorderQuestion(homeworkId, questionId, order);

export const listHomeworkAttachments: HomeworkAdapter["listAttachments"] = (
  homeworkId,
) => homeworkAdapter.listAttachments(homeworkId);

export const createHomeworkAttachment: HomeworkAdapter["createAttachment"] =
  (homeworkId, payload) =>
    homeworkAdapter.createAttachment(homeworkId, payload);

export const deleteHomeworkAttachment: HomeworkAdapter["deleteAttachment"] = (
  homeworkId,
  attachmentId,
) => homeworkAdapter.deleteAttachment(homeworkId, attachmentId);
