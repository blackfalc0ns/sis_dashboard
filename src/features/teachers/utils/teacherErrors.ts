import { ApiError, isApiError } from "@/lib/api-error";

export interface TeacherUiError {
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
  traceId?: string;
  reasonCode?: string;
  shouldRefresh: boolean;
  allocationConflict: boolean;
  identityIntegrityConflict: boolean;
}

const errorFieldByCode: Record<string, string> = {
  "teachers.profile.code_conflict": "teacherCode",
  "iam.user.username_invalid": "username",
  "iam.user.username_taken": "username",
  "iam.user.login_email_taken": "loginEmail",
  "iam.user.email_taken": "loginEmail",
  "iam.user.login_domain_missing": "loginEmail",
};

const identityConflictCode = "teachers.account.identity_conflict";

const refreshCodes = new Set([
  "teachers.account.role_transition_conflict",
  "teachers.lifecycle.invalid_transition",
  "teachers.lifecycle.archive_conflict",
]);

function validationFieldErrors(apiError: ApiError) {
  if (apiError.errors) {
    return Object.fromEntries(
      Object.entries(apiError.errors).map(([field, messages]) => [
        field,
        messages[0] ?? apiError.message,
      ]),
    );
  }

  const details = apiError.details as
    | { fields?: string[] }
    | undefined;
  if (details?.fields?.length) {
    return Object.fromEntries(
      details.fields.map((message) => [message.split(/\s|\./, 1)[0], message]),
    );
  }

  if (apiError.code === identityConflictCode) {
    return { username: apiError.message, loginEmail: apiError.message };
  }

  const configuredField = errorFieldByCode[apiError.code];
  return configuredField ? { [configuredField]: apiError.message } : {};
}

export function toTeacherUiError(error: unknown): TeacherUiError {
  const apiError = isApiError(error)
    ? error
    : new ApiError("An unexpected error occurred", 0, "client.unknown_error");

  const details = apiError.details as { reasonCode?: string } | undefined;

  return {
    code: apiError.code,
    message: apiError.message,
    fieldErrors: validationFieldErrors(apiError),
    traceId: apiError.traceId,
    reasonCode: details?.reasonCode,
    shouldRefresh: refreshCodes.has(apiError.code),
    allocationConflict:
      apiError.code === "teachers.lifecycle.active_assignments",
    identityIntegrityConflict:
      apiError.code === "teachers.account.role_transition_conflict" &&
      details?.reasonCode === "teacher_identity_inconsistent",
  };
}
