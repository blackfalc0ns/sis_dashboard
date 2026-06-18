import { describe, expect, it, vi } from "vitest";
import type { CurriculumAdapter } from "../curriculumAdapter";
import {
  activateCurriculumAdapter,
  createCurriculum,
  createLesson,
  createLessonContent,
  fetchCurriculumForScope,
  getCurriculum,
  listLessonContent,
} from "../curriculumService";

describe("curriculumService backend boundary", () => {
  it("finds the selected scoped curriculum through list then detail", async () => {
    const adapter = {
      listCurricula: vi.fn().mockResolvedValue([{ id: "curriculum-1" }]),
      getCurriculum: vi.fn().mockResolvedValue({ id: "curriculum-1", units: [] }),
    } as unknown as CurriculumAdapter;

    activateCurriculumAdapter(adapter);

    await expect(
      fetchCurriculumForScope({
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
      }),
    ).resolves.toEqual({ id: "curriculum-1", units: [] });

    expect(adapter.listCurricula).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
    });
    expect(adapter.getCurriculum).toHaveBeenCalledWith("curriculum-1");
  });

  it("returns null for an empty scoped list", async () => {
    const adapter = {
      listCurricula: vi.fn().mockResolvedValue([]),
      getCurriculum: vi.fn(),
    } as unknown as CurriculumAdapter;

    activateCurriculumAdapter(adapter);

    await expect(
      fetchCurriculumForScope({
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
      }),
    ).resolves.toBeNull();
    expect(adapter.getCurriculum).not.toHaveBeenCalled();
  });

  it("forwards hierarchy ids for lesson and content mutations", async () => {
    const adapter = {
      createCurriculum: vi.fn().mockResolvedValue({ id: "curriculum-1" }),
      getCurriculum: vi.fn().mockResolvedValue({ id: "curriculum-1" }),
      createLesson: vi.fn().mockResolvedValue({ id: "lesson-1" }),
      createLessonContent: vi.fn().mockResolvedValue({ id: "content-1" }),
      listLessonContent: vi.fn().mockResolvedValue([]),
    } as unknown as CurriculumAdapter;

    activateCurriculumAdapter(adapter);

    await createCurriculum({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
    });
    await getCurriculum("curriculum-1");
    await createLesson("curriculum-1", "unit-1", { title: "Counting" });
    await createLessonContent("curriculum-1", "unit-1", "lesson-1", {
      type: "TEXT",
      title: "Read",
      bodyText: "Hello",
      fileId: null,
      url: null,
    });
    await listLessonContent("curriculum-1", "unit-1", "lesson-1");

    expect(adapter.createCurriculum).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
    });
    expect(adapter.createLesson).toHaveBeenCalledWith("curriculum-1", "unit-1", {
      title: "Counting",
    });
    expect(adapter.createLessonContent).toHaveBeenCalledWith(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      {
        type: "TEXT",
        title: "Read",
        bodyText: "Hello",
        fileId: null,
        url: null,
      },
    );
  });
});
