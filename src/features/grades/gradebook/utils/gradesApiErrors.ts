import { isApiError } from "@/lib/api-error";

/**
 * Maps backend / API errors to translation key suffixes.
 * Usage: `t(\`errors.\${mapGradesApiError(error)}\`)`
 */

const BACKEND_CODE_TO_KEY: Record<string, string> = {
  "grades.term.closed": "termClosed",
  "grades.assessment.locked": "assessmentLocked",
  "grades.assessment.not_published": "assessmentNotPublished",
  "grades.gradebook.no_enrollment": "studentNotInScope",
};

const STATUS_TO_KEY: Record<number, string> = {
  401: "unauthorized",
  403: "permissionDenied",
  409: "conflict",
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
