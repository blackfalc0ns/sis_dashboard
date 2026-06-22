import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { homeworkApiAdapter } from "@/features/academics/homework/services/homeworkApiAdapter";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

describe("homeworkApiAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists assignments from the core homework endpoint with filters", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [{ id: "homework-1", title: "HW", status: "draft" }],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    await expect(
      homeworkApiAdapter.listAssignments({
        academicYearId: "year-1",
        termId: "term-1",
        status: "draft",
      }),
    ).resolves.toEqual({
      items: [expect.objectContaining({ id: "homework-1", title: "HW" })],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/homework/assignments", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        status: "draft",
      },
    });
  });

  it("creates assignments with the required homework payload", async () => {
    mockedApiPost.mockResolvedValueOnce({
      id: "homework-2",
      title: "New homework",
      status: "draft",
    });

    await homeworkApiAdapter.createAssignment({
      academicYearId: "year-1",
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      title: "New homework",
      targetMode: "classroom",
      dueAt: "2026-06-30T12:00:00.000Z",
    });

    expect(mockedApiPost).toHaveBeenCalledWith("/homework/assignments", {
      academicYearId: "year-1",
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      title: "New homework",
      targetMode: "classroom",
      dueAt: "2026-06-30T12:00:00.000Z",
      mode: "homework",
      isGraded: true,
    });
  });

  it("uses dedicated lifecycle endpoints", async () => {
    mockedApiPost.mockResolvedValue({ id: "homework-1", status: "published" });

    await homeworkApiAdapter.publishAssignment("homework-1");
    await homeworkApiAdapter.closeAssignment("homework-1");
    await homeworkApiAdapter.cancelAssignment("homework-1");

    expect(mockedApiPost).toHaveBeenNthCalledWith(
      1,
      "/homework/assignments/homework-1/publish",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/homework/assignments/homework-1/close",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/homework/assignments/homework-1/cancel",
    );
  });

  it("wires question and attachment endpoints under the homework assignment", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });
    mockedApiPatch.mockResolvedValueOnce({ question: { questionId: "question-1", homeworkId: "homework-1", type: "short_text", prompt: "Q", points: 0, sortOrder: 2, isRequired: true, options: [], createdAt: "", updatedAt: "" } });
    mockedApiDelete.mockResolvedValueOnce(undefined);
    mockedApiPost.mockResolvedValueOnce({ attachment: {
      attachmentId: "attachment-1", homeworkId: "homework-1", fileId: "file-1",
      title: "Worksheet", description: null, sortOrder: 0,
      file: { filename: "worksheet.pdf", mimeType: "application/pdf", sizeBytes: "1200" },
      createdAt: "", updatedAt: "",
    } });

    await homeworkApiAdapter.listQuestions("homework-1");
    await homeworkApiAdapter.reorderQuestion("homework-1", "question-1", 2);
    await homeworkApiAdapter.deleteQuestion("homework-1", "question-1");
    await homeworkApiAdapter.createAttachment("homework-1", {
      fileId: "file-1",
      title: "Worksheet",
    });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions",
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/reorder",
      { sortOrder: 2 },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1",
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/attachments",
      { fileId: "file-1", title: "Worksheet" },
    );
  });

  it("unwraps question detail responses", async () => {
    mockedApiPost.mockResolvedValueOnce({
      question: { questionId: "question-1", homeworkId: "homework-1", type: "short_text", prompt: "Explain", points: 2, sortOrder: 0, isRequired: true, options: [], createdAt: "", updatedAt: "" },
    });

    await expect(homeworkApiAdapter.createQuestion("homework-1", {
      id: "temp-1", assignmentId: "homework-1", questionTextAr: "Explain",
      questionTextEn: "Explain", questionType: "SHORT_ANSWER", points: 2,
      order: 0, createdAt: "",
    })).resolves.toEqual(expect.objectContaining({ id: "question-1", questionType: "SHORT_ANSWER" }));
  });

  it("reconciles options through dedicated endpoints when updating a question", async () => {
    const backendQuestion = {
      questionId: "question-1", homeworkId: "homework-1", type: "single_choice",
      prompt: "Pick", points: 2, sortOrder: 0, isRequired: true, createdAt: "", updatedAt: "",
    };
    mockedApiGet.mockResolvedValueOnce({ question: { ...backendQuestion, options: [
      { optionId: "option-1", questionId: "question-1", text: "Old", isCorrect: true, sortOrder: 0 },
      { optionId: "option-removed", questionId: "question-1", text: "Remove", isCorrect: false, sortOrder: 1 },
    ] } }).mockResolvedValueOnce({ question: { ...backendQuestion, options: [] } });
    mockedApiPatch.mockResolvedValue({ question: { ...backendQuestion, options: [] } });
    mockedApiPost.mockResolvedValue({ question: { ...backendQuestion, options: [] } });

    await homeworkApiAdapter.updateQuestion("homework-1", "question-1", {
      id: "question-1", assignmentId: "homework-1", questionTextAr: "Pick",
      questionTextEn: "Pick", questionType: "MCQ_SINGLE", points: 2, order: 0,
      options: [
        { id: "option-1", textAr: "Updated", textEn: "Updated", isCorrect: true, order: 0 },
        { id: "temp-option-2", textAr: "New", textEn: "New", isCorrect: false, order: 1 },
      ], createdAt: "",
    });

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/option-1",
      { text: "Updated", isCorrect: true },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/option-1/reorder",
      { sortOrder: 0 },
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options",
      { text: "New", isCorrect: false, sortOrder: 1 },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/option-removed",
    );
  });

  it("updates hidden true false options without deleting them", async () => {
    const backendQuestion = {
      questionId: "question-1", homeworkId: "homework-1", type: "true_false",
      prompt: "Valid?", points: 1, sortOrder: 0, isRequired: true, createdAt: "", updatedAt: "",
      options: [
        { optionId: "true", questionId: "question-1", text: "True", isCorrect: true, sortOrder: 0 },
        { optionId: "false", questionId: "question-1", text: "False", isCorrect: false, sortOrder: 1 },
      ],
    };
    mockedApiGet.mockResolvedValueOnce({ question: backendQuestion })
      .mockResolvedValueOnce({ question: backendQuestion });
    mockedApiPatch.mockResolvedValue({ question: backendQuestion });

    await homeworkApiAdapter.updateQuestion("homework-1", "question-1", {
      id: "question-1", assignmentId: "homework-1", questionTextAr: "Valid?",
      questionTextEn: "Valid?", questionType: "TRUE_FALSE", correctAnswer: false,
      points: 1, order: 0, createdAt: "",
    });

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/true",
      { text: "True", isCorrect: false },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/false",
      { text: "False", isCorrect: true },
    );
    expect(mockedApiDelete).not.toHaveBeenCalled();
  });
});
