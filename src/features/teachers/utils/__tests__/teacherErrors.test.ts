import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { toTeacherUiError } from "../teacherErrors";

describe("teacher error mapping", () => {
  it("maps conflicts to the affected form field", () => {
    const uiError = toTeacherUiError(
      new ApiError("Code exists", 409, "teachers.profile.code_conflict"),
    );
    expect(uiError.fieldErrors).toEqual({ teacherCode: "Code exists" });
  });

  it("associates identity conflicts with either supported login mode", () => {
    const uiError = toTeacherUiError(
      new ApiError("Identity exists", 409, "teachers.account.identity_conflict"),
    );
    expect(uiError.fieldErrors).toEqual({
      username: "Identity exists",
      loginEmail: "Identity exists",
    });
  });

  it("maps validation detail messages without exposing the raw error", () => {
    const uiError = toTeacherUiError(
      new ApiError("Validation failed", 400, "validation.failed", undefined, {
        fields: ["phone must be a valid phone number"],
      }),
    );
    expect(uiError.fieldErrors).toEqual({
      phone: "phone must be a valid phone number",
    });
  });

  it("marks lifecycle conflicts for refresh and allocation routing", () => {
    expect(
      toTeacherUiError(
        new ApiError("State changed", 409, "teachers.lifecycle.invalid_transition"),
      ).shouldRefresh,
    ).toBe(true);
    expect(
      toTeacherUiError(
        new ApiError("Assignments exist", 409, "teachers.lifecycle.active_assignments"),
      ).allocationConflict,
    ).toBe(true);
  });

  it("preserves safe support metadata for inconsistent teacher identity", () => {
    const uiError = toTeacherUiError(
      new ApiError(
        "Teacher identity state is not safe for this operation",
        409,
        "teachers.account.role_transition_conflict",
        undefined,
        { reasonCode: "teacher_identity_inconsistent" },
        "trace-123",
      ),
    );

    expect(uiError).toMatchObject({
      reasonCode: "teacher_identity_inconsistent",
      traceId: "trace-123",
      shouldRefresh: true,
      identityIntegrityConflict: true,
    });
  });
});
