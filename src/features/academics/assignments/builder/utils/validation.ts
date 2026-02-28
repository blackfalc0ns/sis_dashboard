import { Assignment, AssignmentQuestion } from "@/services/academics/curriculumService";
import { ValidationErrors, QuestionValidationError } from "../types";
import { MIN_OPTIONS_COUNT } from "./constants";

export function validateAssignment(
  assignment: Assignment,
  questions: AssignmentQuestion[],
  t: (key: string) => string
): ValidationErrors {
  const errors: ValidationErrors = {};
  const generalErrors: string[] = [];

  // Validate title
  if (!assignment.titleAr?.trim()) {
    errors.titleAr = t("required_ar");
  }
  if (!assignment.titleEn?.trim()) {
    errors.titleEn = t("required_en");
  }

  // Check AR != EN for title
  if (assignment.titleAr?.trim() && assignment.titleEn?.trim()) {
    if (assignment.titleAr.trim().toLowerCase() === assignment.titleEn.trim().toLowerCase()) {
      errors.titleAr = t("arEnMustDiffer");
      errors.titleEn = t("arEnMustDiffer");
    }
  }

  // Check AR != EN for description if both filled
  if (assignment.descriptionAr?.trim() && assignment.descriptionEn?.trim()) {
    if (assignment.descriptionAr.trim().toLowerCase() === assignment.descriptionEn.trim().toLowerCase()) {
      errors.descriptionAr = t("arEnMustDiffer");
      errors.descriptionEn = t("arEnMustDiffer");
    }
  }

  // Validate max score
  if (!assignment.maxScore || assignment.maxScore <= 0) {
    errors.maxScore = t("invalid_max_score");
  }

  // Validate questions exist
  if (questions.length === 0) {
    generalErrors.push(t("at_least_one_question"));
  }

  // Validate each question
  const questionErrors: Record<string, QuestionValidationError> = {};
  questions.forEach((q) => {
    const qErrors = validateQuestion(q, t);
    if (Object.keys(qErrors).length > 0) {
      questionErrors[q.id] = qErrors;
    }
  });

  if (Object.keys(questionErrors).length > 0) {
    errors.questions = questionErrors;
  }

  if (generalErrors.length > 0) {
    errors.general = generalErrors;
  }

  return errors;
}

export function validateQuestion(
  question: AssignmentQuestion,
  t: (key: string) => string
): QuestionValidationError {
  const errors: QuestionValidationError = {};

  // Question text required
  if (!question.questionTextAr?.trim()) {
    errors.textAr = t("required_ar");
  }
  if (!question.questionTextEn?.trim()) {
    errors.textEn = t("required_en");
  }

  // Points validation
  if (question.points < 0) {
    errors.points = t("invalid_points");
  }

  // MCQ validation
  if (question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") {
    if (!question.options || question.options.length < MIN_OPTIONS_COUNT) {
      errors.options = t("minTwoOptions");
    } else {
      // Validate each option has text
      const emptyOptions = question.options.filter(
        (o) => !o.textAr?.trim() || !o.textEn?.trim()
      );
      if (emptyOptions.length > 0) {
        errors.options = t("all_options_required");
      }

      // Validate AR != EN for each option
      const sameTextOptions = question.options.filter(
        (o) => o.textAr?.trim() && o.textEn?.trim() && 
               o.textAr.trim().toLowerCase() === o.textEn.trim().toLowerCase()
      );
      if (sameTextOptions.length > 0) {
        errors.options = t("option_ar_en_must_differ");
      }

      // Validate correct answer selection
      const correctCount = question.options.filter((o) => o.isCorrect).length;
      if (question.questionType === "MCQ_SINGLE" && correctCount !== 1) {
        errors.correctAnswer = t("selectCorrectSingle");
      } else if (question.questionType === "MCQ_MULTI" && correctCount < 1) {
        errors.correctAnswer = t("selectCorrectMulti");
      }
    }
  }

  return errors;
}

export function validateForPublish(
  assignment: Assignment,
  questions: AssignmentQuestion[],
  t: (key: string) => string
): string[] {
  const errors: string[] = [];

  // Validate title
  if (!assignment.titleAr?.trim()) {
    errors.push(t("required_ar"));
  }
  if (!assignment.titleEn?.trim()) {
    errors.push(t("required_en"));
  }

  // Validate questions exist
  if (questions.length === 0) {
    errors.push(t("at_least_one_question"));
  }

  // Validate each question
  questions.forEach((q, index) => {
    const qNum = `Q${index + 1}`;

    if (!q.questionTextAr?.trim() || !q.questionTextEn?.trim()) {
      errors.push(`${qNum}: ${t("question_text_required")}`);
    }

    if (q.questionType === "MCQ_SINGLE" || q.questionType === "MCQ_MULTI") {
      if (!q.options || q.options.length < MIN_OPTIONS_COUNT) {
        errors.push(`${qNum}: ${t("minTwoOptions")}`);
      } else {
        // Check for empty options
        const emptyOptions = q.options.filter(
          (o) => !o.textAr?.trim() || !o.textEn?.trim()
        );
        if (emptyOptions.length > 0) {
          errors.push(`${qNum}: ${t("all_options_required")}`);
        }

        // Check for AR == EN in options
        const sameTextOptions = q.options.filter(
          (o) => o.textAr?.trim() && o.textEn?.trim() && 
                 o.textAr.trim().toLowerCase() === o.textEn.trim().toLowerCase()
        );
        if (sameTextOptions.length > 0) {
          errors.push(`${qNum}: ${t("option_ar_en_must_differ")}`);
        }

        // Check correct answer selection
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (q.questionType === "MCQ_SINGLE" && correctCount !== 1) {
          errors.push(`${qNum}: ${t("selectCorrectSingle")}`);
        } else if (q.questionType === "MCQ_MULTI" && correctCount < 1) {
          errors.push(`${qNum}: ${t("selectCorrectMulti")}`);
        }
      }
    }
  });

  // Validate points match
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  if ((assignment.maxScore || 0) !== totalPoints) {
    errors.push(t("points_sum_mismatch"));
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return (
    !!errors.titleAr ||
    !!errors.titleEn ||
    !!errors.descriptionAr ||
    !!errors.descriptionEn ||
    !!errors.maxScore ||
    !!errors.dueDate ||
    !!(errors.questions && Object.keys(errors.questions).length > 0) ||
    !!(errors.general && errors.general.length > 0)
  );
}
