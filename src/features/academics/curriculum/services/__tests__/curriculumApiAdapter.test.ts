import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCurriculumApiAdapter } from "../curriculumApiAdapter";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiDelete = vi.mocked(apiDelete);

describe("curriculumApiAdapter", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPost.mockReset();
    mockedApiPatch.mockReset();
    mockedApiDelete.mockReset();
  });

  it("lists curricula with backend-supported filters and unwraps items", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "curriculum-1",
          curriculumId: "curriculum-1",
          academicYearId: "year-1",
          termId: "term-1",
          gradeId: "grade-1",
          subjectId: "subject-1",
          title: "Math",
          description: null,
          status: "DRAFT",
          publishedAt: null,
          archivedAt: null,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          academicYear: { id: "year-1", name: "2026", nameAr: "٢٠٢٦", nameEn: "2026" },
          term: { id: "term-1", name: "Term 1", nameAr: "الفصل ١", nameEn: "Term 1" },
          grade: { id: "grade-1", name: "Grade 1", nameAr: "الأول", nameEn: "Grade 1" },
          subject: {
            id: "subject-1",
            name: "Math",
            nameAr: "رياضيات",
            nameEn: "Math",
            code: null,
            color: null,
          },
          unitCount: 0,
          lessonCount: 0,
        },
      ],
    });

    const result = await createCurriculumApiAdapter().listCurricula({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      search: "math",
    });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/academics/curriculum?academicYearId=year-1&termId=term-1&gradeId=grade-1&subjectId=subject-1&search=math",
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Math");
  });

  it("fetches curriculum detail from the curriculum id route", async () => {
    mockedApiGet.mockResolvedValueOnce({
      id: "curriculum-1",
      curriculumId: "curriculum-1",
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
      description: null,
      status: "DRAFT",
      publishedAt: null,
      archivedAt: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      academicYear: { id: "year-1", name: "2026", nameAr: "٢٠٢٦", nameEn: "2026" },
      term: { id: "term-1", name: "Term 1", nameAr: "الفصل ١", nameEn: "Term 1" },
      grade: { id: "grade-1", name: "Grade 1", nameAr: "الأول", nameEn: "Grade 1" },
      subject: {
        id: "subject-1",
        name: "Math",
        nameAr: "رياضيات",
        nameEn: "Math",
        code: null,
        color: null,
      },
      unitCount: 0,
      lessonCount: 0,
      units: [],
    });

    await createCurriculumApiAdapter().getCurriculum("curriculum-1");

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/academics/curriculum/curriculum-1",
    );
  });

  it("uses nested unit, lesson, and content routes with supported request bodies", async () => {
    const adapter = createCurriculumApiAdapter();
    const unitResponse = {
      id: "unit-1",
      unitId: "unit-1",
      curriculumId: "curriculum-1",
      title: "Numbers",
      description: null,
      sortOrder: 2,
      estimatedLessons: null,
      lessonCount: 0,
      lessons: [],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const lessonResponse = {
      id: "lesson-1",
      lessonId: "lesson-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      title: "Counting",
      description: null,
      objectives: [],
      sortOrder: 3,
      estimatedMinutes: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const contentResponse = {
      id: "content-1",
      contentItemId: "content-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      lessonId: "lesson-1",
      type: "video_link",
      title: "Watch",
      bodyText: null,
      url: "https://example.com/video",
      file: null,
      sortOrder: 0,
      isRequired: true,
      estimatedMinutes: null,
      metadata: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    mockedApiPatch
      .mockResolvedValueOnce(unitResponse)
      .mockResolvedValueOnce(lessonResponse);
    mockedApiPost.mockResolvedValueOnce(contentResponse);

    await adapter.reorderUnit("curriculum-1", "unit-1", { sortOrder: 2 });
    await adapter.reorderLesson("curriculum-1", "unit-1", "lesson-1", {
      sortOrder: 3,
    });
    await adapter.createLessonContent("curriculum-1", "unit-1", "lesson-1", {
      type: "VIDEO_LINK",
      title: "Watch",
      url: "https://example.com/video",
      fileId: null,
      bodyText: null,
    });

    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      1,
      "/academics/curriculum/curriculum-1/units/unit-1/reorder",
      { sortOrder: 2 },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      2,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/reorder",
      { sortOrder: 3 },
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content",
      {
        type: "VIDEO_LINK",
        title: "Watch",
        url: "https://example.com/video",
        fileId: null,
        bodyText: null,
      },
    );
  });
});
