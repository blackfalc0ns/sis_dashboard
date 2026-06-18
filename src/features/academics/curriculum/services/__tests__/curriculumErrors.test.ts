import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { curriculumUiError } from "../curriculumErrors";

describe("curriculumErrors", () => {
  it("maps known curriculum and lesson-content domain codes", () => {
    expect(
      curriculumUiError(
        new ApiError(
          "backend",
          400,
          "academics.lesson_content.invalid_type_payload",
        ),
        "Fallback",
      ).message,
    ).toBe("The content fields do not match the selected content type.");
  });

  it("preserves trace ids and nested validation details", () => {
    const result = curriculumUiError(
      new ApiError(
        "Validation failed",
        400,
        "validation.failed",
        undefined,
        { title: ["Title is required"], url: "URL must use HTTP or HTTPS" },
        "trace-123",
      ),
      "Fallback",
    );

    expect(result).toEqual({
      message: "Check the submitted curriculum fields.",
      traceId: "trace-123",
      details: ["Title is required", "URL must use HTTP or HTTPS"],
    });
  });

  it("falls back for non-api errors", () => {
    expect(curriculumUiError(new Error("boom"), "Fallback")).toEqual({
      message: "Fallback",
      details: [],
    });
  });
});
