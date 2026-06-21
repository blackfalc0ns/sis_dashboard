import { isApiError } from "@/lib/api-error";

/**
 * Maps backend / API errors to translation key suffixes.
 * Usage: `t(\`errors.\${mapGradesApiError(error)}\`)`
 */

const BACKEND_CODE_TO_KEY: Record<string, string> = {
  "grades.term.closed": "term_closed",
  "grades.assessment.locked": "assessment_locked",
  "grades.assessment.not_published": "assessment_not_published",
  "grades.assessment.not_approved": "assessment_not_approved",
  "grades.assessment.invalid_status_transition": "invalid_status_transition",
  "grades.assessment.already_published": "assessment_already_published",
  "grades.assessment.already_approved": "assessment_already_approved",
  "grades.assessment.already_locked": "assessment_already_locked",
  "grades.assessment.invalid_scope": "invalid_scope",
  "grades.gradebook.no_enrollment": "gradebook_no_enrollment",
  "grades.item.out_of_range": "score_out_of_range",
  "grades.question.structure_locked": "question_structure_locked",
  "grades.question.points_mismatch": "question_points_mismatch",
  "grades.answer.invalid_question": "invalid_question",
  "grades.answer.invalid_option": "invalid_option",
  "grades.submission.already_submitted": "submission_already_submitted",
  "grades.submission.locked": "submission_locked",
  "grades.submission.not_submitted": "submission_not_submitted",
  "grades.review.already_finalized": "review_already_finalized",
  "grades.review.pending_answers": "review_pending_answers",
  "grades.rule.conflict": "rule_conflict",
};

const STATUS_TO_KEY: Record<number, string> = {
  401: "unauthorized",
  403: "permission_denied",
  404: "not_found",
  409: "conflict",
  422: "validation_failed",
};

export function mapGradesApiError(error: unknown): string {
  if (isApiError(error)) {
    // Check backend domain error code first
    const codeKey = BACKEND_CODE_TO_KEY[error.code];
    if (codeKey) return codeKey;

    // Check HTTP status
    const statusKey = STATUS_TO_KEY[error.status];
    if (statusKey) return statusKey;
  }

  return "generic";
}
