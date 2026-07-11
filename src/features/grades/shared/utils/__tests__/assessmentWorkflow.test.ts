import { describe, expect, it } from "vitest";
import { isAssessmentMetadataEditable, isGradeEntryAvailable } from "../assessmentWorkflow";

describe("assessment metadata editing", () => {
  it.each(["draft", "published", "approved"] as const)(
    "allows scope changes before the assessment is locked (%s)",
    (approvalStatus) => {
      expect(isAssessmentMetadataEditable({ approvalStatus, isLocked: false })).toBe(true);
    },
  );

  it("keeps locked assessments read-only", () => {
    expect(isAssessmentMetadataEditable({ approvalStatus: "approved", isLocked: true })).toBe(false);
  });

  it.each([
    ["draft", false],
    ["published", true],
    ["approved", true],
  ] as const)("allows bulk grade entry only after publication (%s)", (approvalStatus, expected) => {
    expect(isGradeEntryAvailable({ approvalStatus, isLocked: false, deliveryMode: "SCORE_ONLY" })).toBe(expected);
  });

  it("rejects question-based assessments even after publication", () => {
    expect(isGradeEntryAvailable({ approvalStatus: "published", isLocked: false, deliveryMode: "QUESTION_BASED" })).toBe(false);
  });
});
