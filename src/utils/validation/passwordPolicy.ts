import { isApiError } from "@/lib/api-error";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 256;

export type PasswordPolicyReason =
  | "password_too_short"
  | "password_missing_uppercase"
  | "password_missing_lowercase"
  | "password_missing_number"
  | "password_missing_symbol"
  | "password_too_long";

const PASSWORD_POLICY_CODE = "iam.credentials.password_policy_failed";
const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const NUMBER_PATTERN = /\d/;
const SYMBOL_PATTERN = /[\p{P}\p{S}]/u;

export function getPasswordPolicyFailures(
  password: string,
): PasswordPolicyReason[] {
  const failures: PasswordPolicyReason[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    failures.push("password_too_short");
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    failures.push("password_too_long");
  }
  if (!UPPERCASE_PATTERN.test(password)) {
    failures.push("password_missing_uppercase");
  }
  if (!LOWERCASE_PATTERN.test(password)) {
    failures.push("password_missing_lowercase");
  }
  if (!NUMBER_PATTERN.test(password)) {
    failures.push("password_missing_number");
  }
  if (!SYMBOL_PATTERN.test(password)) {
    failures.push("password_missing_symbol");
  }

  return failures;
}

export function getPasswordPolicyApiFailures(
  error: unknown,
): PasswordPolicyReason[] {
  if (!isApiError(error) || error.code !== PASSWORD_POLICY_CODE) {
    return [];
  }

  const details = error.details;
  if (!details || typeof details !== "object" || !("reasons" in details)) {
    return [];
  }

  const reasons = (details as { reasons?: unknown }).reasons;
  return Array.isArray(reasons) ? reasons.filter(isPasswordPolicyReason) : [];
}

function isPasswordPolicyReason(reason: unknown): reason is PasswordPolicyReason {
  return (
    reason === "password_too_short" ||
    reason === "password_too_long" ||
    reason === "password_missing_uppercase" ||
    reason === "password_missing_lowercase" ||
    reason === "password_missing_number" ||
    reason === "password_missing_symbol"
  );
}
