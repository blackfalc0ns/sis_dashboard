const HOMEWORK_ERROR_KEYS: Record<string, string> = {
  "homework.assignment.not_found": "notFound",
  "homework.assignment.not_mutable": "notMutable",
  "homework.assignment.not_publishable": "notPublishable",
  "homework.assignment.already_published": "alreadyPublished",
  "homework.assignment.already_closed": "alreadyClosed",
  "homework.assignment.cancelled": "cancelled",
  "homework.assignment.schedule_mismatch": "scheduleMismatch",
  "homework.assignment.allocation_mismatch": "allocationMismatch",
  "homework.assignment.due_date_invalid": "dueDateInvalid",
  "homework.assignment.target_required": "targetRequired",
  "homework.assignment.no_eligible_targets": "noEligibleTargets",
  "homework.assignment.target_conflict": "targetConflict",
  "homework.assignment.validation_failed": "validationFailed",
  "homework.assignment.invalid_question_structure": "invalidQuestionStructure",
  "homework.question.invalid_type_payload": "questionInvalidTypePayload",
  "homework.question.invalid_options": "questionInvalidOptions",
  "homework.question.invalid_reorder": "questionInvalidReorder",
  "homework.question.read_only": "questionReadOnly",
  "validation.failed": "validationFailed",
};

interface MaybeApiError {
  code?: string;
  message?: string;
  response?: {
    data?: {
      error?: {
        code?: string;
        message?: string;
      };
    };
  };
}

export function mapHomeworkApiError(error: unknown): string {
  const maybeError = error as MaybeApiError;
  const code = maybeError.response?.data?.error?.code ?? maybeError.code;
  if (code && HOMEWORK_ERROR_KEYS[code]) {
    return HOMEWORK_ERROR_KEYS[code];
  }
  return "generic";
}
