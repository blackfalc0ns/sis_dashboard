import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  getPasswordPolicyApiFailures,
  getPasswordPolicyFailures,
} from "@/utils/validation/passwordPolicy";

describe("password policy", () => {
  it("reports every unmet credential requirement", () => {
    expect(getPasswordPolicyFailures("short")).toEqual([
      "password_too_short",
      "password_missing_uppercase",
      "password_missing_number",
      "password_missing_symbol",
    ]);
  });

  it("accepts a password that meets the credential policy", () => {
    expect(getPasswordPolicyFailures("Strong#1a")).toEqual([]);
  });

  it("extracts supported reasons from the password policy API error", () => {
    const error = new ApiError(
      "Password does not meet credential policy",
      400,
      "iam.credentials.password_policy_failed",
      undefined,
      {
        reasons: [
          "password_too_short",
          "password_missing_uppercase",
          "unknown_reason",
        ],
      },
    );

    expect(getPasswordPolicyApiFailures(error)).toEqual([
      "password_too_short",
      "password_missing_uppercase",
    ]);
  });
});
