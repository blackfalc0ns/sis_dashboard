import { describe, expect, it } from "vitest";
import { mapHomeworkApiError } from "@/features/academics/homework/services/homeworkErrors";

describe("homeworkErrors", () => {
  it("maps backend homework error envelopes to UI keys", () => {
    expect(
      mapHomeworkApiError({
        response: {
          data: {
            error: {
              code: "homework.assignment.not_publishable",
            },
          },
        },
      }),
    ).toBe("notPublishable");
  });

  it("falls back for unknown errors", () => {
    expect(mapHomeworkApiError(new Error("Network failed"))).toBe("generic");
  });

  it.each([
    ["homework.question.invalid_type_payload", "questionInvalidTypePayload"],
    ["homework.question.invalid_options", "questionInvalidOptions"],
    ["homework.question.invalid_reorder", "questionInvalidReorder"],
    ["homework.question.read_only", "questionReadOnly"],
    ["homework.assignment.invalid_question_structure", "invalidQuestionStructure"],
  ])("maps %s to %s", (code, key) => {
    expect(mapHomeworkApiError({ code })).toBe(key);
  });
});
