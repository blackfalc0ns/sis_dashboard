import { describe, expect, it } from "vitest";
import { mapBackendAssessmentToAssessment, mapBackendColumnToAssessment } from "../gradebookMappers";

describe("gradebook assessment contract mappers", () => {
  it.each([
    ["QUESTION_BASED"],
    ["question_based"],
  ])("maps backend %s delivery mode to question-based", (deliveryMode) => {
    const assessment = mapBackendAssessmentToAssessment({
      id: "assessment-1",
      deliveryMode,
      titleEn: "Question exam",
      titleAr: "Question exam",
    });

    expect(assessment.deliveryMode).toBe("QUESTION_BASED");
  });

  it.each([
    ["SCORE_ONLY"],
    ["score_only"],
    [undefined],
  ])("maps backend %s delivery mode to score-only", (deliveryMode) => {
    const assessment = mapBackendColumnToAssessment({
      id: "column-1",
      assessmentId: "assessment-1",
      deliveryMode,
      titleEn: "Score exam",
      titleAr: "Score exam",
    });

    expect(assessment.deliveryMode).toBe("SCORE_ONLY");
  });
});
