import { describe, expect, it } from "vitest";
import { validateHomeworkAssignment, validateHomeworkQuestion } from "./homeworkValidation";

const t = (key: string) => key;

function question(overrides = {}) {
  return {
    id: "question-1", assignmentId: "homework-1", questionTextAr: "Question",
    questionTextEn: "Question", questionType: "SHORT_ANSWER" as const,
    points: 1, order: 0, createdAt: "", ...overrides,
  };
}

describe("validateHomeworkQuestion", () => {
  it("accepts either localized prompt", () => {
    expect(validateHomeworkQuestion(question({ questionTextEn: "" }), t)).toEqual({});
  });

  it("accepts the builder boolean for true false", () => {
    expect(validateHomeworkQuestion(question({
      questionType: "TRUE_FALSE",
      correctAnswer: false,
    }), t)).toEqual({});
  });

  it("enforces backend question DTO boundaries", () => {
    expect(validateHomeworkQuestion(question({ questionTextEn: "x".repeat(8001) }), t))
      .toEqual(expect.objectContaining({ textEn: "questionTextTooLong" }));
    expect(validateHomeworkQuestion(question({ points: Number.NaN }), t))
      .toEqual(expect.objectContaining({ points: "invalid_points" }));
  });

  it("enforces backend option DTO boundaries", () => {
    const options = Array.from({ length: 51 }, (_, index) => ({
      id: `option-${index}`, textAr: "Option", textEn: "Option",
      isCorrect: index === 0, order: index,
    }));
    expect(validateHomeworkQuestion(question({ questionType: "MCQ_SINGLE", options }), t))
      .toEqual(expect.objectContaining({ options: "tooManyOptions" }));
    expect(validateHomeworkQuestion(question({ questionType: "MCQ_SINGLE", options: [
      { ...options[0], textEn: "x".repeat(1001) }, options[1],
    ] }), t)).toEqual(expect.objectContaining({ options: "optionTextTooLong" }));
  });

  it("forbids options on text questions", () => {
    expect(validateHomeworkQuestion(question({ options: [
      { id: "one", textAr: "Option", textEn: "Option", isCorrect: false, order: 0 },
    ] }), t)).toEqual(expect.objectContaining({ options: "textQuestionOptionsForbidden" }));
  });

  it("allows zero total marks and no questions like the backend", () => {
    const assignment = {
      id: "homework-1", lessonId: "homework", titleAr: "Title", titleEn: "Title",
      maxScore: 0, isPublished: false,
    };
    expect(validateHomeworkAssignment(assignment, [], t)).toEqual({});
  });

  it("enforces backend instructions and expected answer limits", () => {
    expect(validateHomeworkQuestion(question({ instructions: "x".repeat(4001) }), t))
      .toEqual(expect.objectContaining({ instructions: "instructionsTooLong" }));
    expect(validateHomeworkQuestion(question({ expectedAnswer: "x".repeat(8001) }), t))
      .toEqual(expect.objectContaining({ expectedAnswer: "expectedAnswerTooLong" }));
  });

  it("rejects question types unsupported by homework", () => {
    expect(validateHomeworkQuestion(question({ questionType: "MATCHING" }), t))
      .toEqual(expect.objectContaining({ general: "unsupportedQuestionType" }));
  });
});
