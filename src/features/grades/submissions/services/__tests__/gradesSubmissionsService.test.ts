import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  fetchGradeSubmission,
  finalizeSubmissionReview,
  listAssessmentSubmissions,
  reviewSubmissionAnswer,
  saveSubmissionAnswer,
  saveSubmissionAnswers,
  submitGradeSubmission,
  syncSubmissionGradeItem,
} from "../gradesSubmissionsService";

describe("grades submission endpoint contracts", () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset().mockResolvedValue({}));
  });

  it("lists assessment submissions with supported filters", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({ items: [] });

    await listAssessmentSubmissions("assessment-1", {
      status: "SUBMITTED",
      classroomId: "classroom-1",
      search: "Sara",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/grades/assessments/assessment-1/submissions",
      { params: { status: "SUBMITTED", classroomId: "classroom-1", search: "Sara" } },
    );
  });

  it("fetches submission detail and saves single and bulk answers", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({ id: "submission-1" });

    await fetchGradeSubmission("submission-1");
    await saveSubmissionAnswer("submission-1", "question-1", {
      answerText: "Answer",
      selectedOptionIds: ["option-1"],
    });
    await saveSubmissionAnswers("submission-1", [
      { questionId: "question-1", answerText: "Answer" },
    ]);

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/grades/submissions/submission-1");
    expect(apiMocks.apiPut).toHaveBeenNthCalledWith(
      1,
      "/grades/submissions/submission-1/answers/question-1",
      { answerText: "Answer", selectedOptionIds: ["option-1"] },
    );
    expect(apiMocks.apiPut).toHaveBeenNthCalledWith(
      2,
      "/grades/submissions/submission-1/answers",
      { answers: [{ questionId: "question-1", answerText: "Answer" }] },
    );
  });

  it("submits, reviews, finalizes, and syncs a submission", async () => {
    await submitGradeSubmission("submission-1");
    await reviewSubmissionAnswer("submission-1", "answer-1", {
      awardedPoints: 4,
      reviewerComment: "Correct",
      reviewerCommentAr: null,
    });
    await finalizeSubmissionReview("submission-1");
    await syncSubmissionGradeItem("submission-1");

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/grades/submissions/submission-1/submit",
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/grades/submissions/submission-1/answers/answer-1/review",
      { awardedPoints: 4, reviewerComment: "Correct", reviewerCommentAr: null },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/grades/submissions/submission-1/review/finalize",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      "/grades/submissions/submission-1/sync-grade-item",
    );
  });
});
