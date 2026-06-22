import type {
  Assignment,
  AssignmentQuestion,
} from "@/features/academics/curriculum/services/curriculumService";
import type {
  QuestionValidationError,
  ValidationErrors,
} from "@/features/academics/curriculum/types/types";

const SUPPORTED_TYPES = new Set([
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
]);
const CHOICE_TYPES = new Set(["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE"]);

function validatePromptAndPoints(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  const errors: QuestionValidationError = {};
  const prompt = question.questionTextEn?.trim() || question.questionTextAr?.trim() || "";
  if (!prompt) errors.textEn = t("question_text_required");
  else if (prompt.length > 8000) errors.textEn = t("questionTextTooLong");
  if (!Number.isFinite(question.points) || question.points < 0) {
    errors.points = t("invalid_points");
  }
  if ((question.instructions?.trim().length ?? 0) > 4000) {
    errors.instructions = t("instructionsTooLong");
  }
  if ((question.expectedAnswer?.trim().length ?? 0) > 8000) {
    errors.expectedAnswer = t("expectedAnswerTooLong");
  }
  return errors;
}

function validateOptionStructure(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  const options = question.options ?? [];
  if (!CHOICE_TYPES.has(question.questionType) && options.length > 0) return { options: t("textQuestionOptionsForbidden") };
  if (options.length > 50) return { options: t("tooManyOptions") };
  if (options.some((option) => (option.textEn?.trim() || option.textAr?.trim() || "").length > 1000)) return { options: t("optionTextTooLong") };
  if (options.some((option) => !option.textAr?.trim() && !option.textEn?.trim())) return { options: t("all_options_required") };
  if (question.questionType === "TRUE_FALSE") return {};
  if ((question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") && options.length < 2) return { options: t("minTwoOptions") };
  return {};
}

function validateCorrectOptions(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  const correctCount = (question.options ?? []).filter(({ isCorrect }) => isCorrect).length;
  if (question.questionType === "MCQ_SINGLE" && correctCount !== 1) return { correctAnswer: t("selectCorrectSingle") };
  if (question.questionType === "MCQ_MULTI" && correctCount < 1) return { correctAnswer: t("selectCorrectMulti") };
  return {};
}

export function validateHomeworkQuestion(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  return {
    ...(!SUPPORTED_TYPES.has(question.questionType) && { general: t("unsupportedQuestionType") }),
    ...validatePromptAndPoints(question, t),
    ...validateOptionStructure(question, t),
    ...validateCorrectOptions(question, t),
  };
}

export function validateHomeworkAssignment(
  assignment: Assignment,
  questions: AssignmentQuestion[],
  t: (key: string) => string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!assignment.titleAr?.trim() && !assignment.titleEn?.trim()) {
    errors.titleEn = t("question_text_required");
  }
  if (typeof assignment.maxScore !== "number" ||
      !Number.isFinite(assignment.maxScore) || assignment.maxScore < 0) {
    errors.maxScore = t("invalid_max_score");
  }
  if (assignment.expectedTimeMinutes != null &&
      (!Number.isFinite(assignment.expectedTimeMinutes) || assignment.expectedTimeMinutes < 0)) {
    errors.expectedTimeMinutes = t("invalid_expected_time");
  }
  const questionErrors = Object.fromEntries(
    questions
      .map((question) => [question.id, validateHomeworkQuestion(question, t)])
      .filter(([, questionError]) => Object.keys(questionError).length > 0),
  );
  if (Object.keys(questionErrors).length) errors.questions = questionErrors;
  return errors;
}
