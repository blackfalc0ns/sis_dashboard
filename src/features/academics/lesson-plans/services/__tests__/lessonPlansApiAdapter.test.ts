import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { lessonPlansApiAdapter } from "../lessonPlansApiAdapter";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

describe("lesson plans API adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses allocation-scoped list and workflow routes", async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({
        termId: "term-1",
        academicYearId: "year-1",
        weeks: [],
      });
    await lessonPlansApiAdapter.listLessonPlans({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
    });
    await lessonPlansApiAdapter.listWeeks({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
    });
    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/lesson-plans?termId=term-1&teacherSubjectAllocationId=allocation-1",
    );
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/lesson-plans/weeks?termId=term-1&teacherSubjectAllocationId=allocation-1",
    );
  });

  it("uses supported move, reorder, lifecycle, and delete routes", async () => {
    vi.mocked(apiPatch).mockResolvedValue({});
    vi.mocked(apiPost).mockResolvedValue({});
    vi.mocked(apiDelete).mockResolvedValue({ ok: true });
    await lessonPlansApiAdapter.moveLessonPlanItem("item-1", {
      weekIndex: 3,
      sortOrder: 0,
    });
    await lessonPlansApiAdapter.reorderLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
      payload: { sortOrder: 2 },
    });
    await lessonPlansApiAdapter.skipLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
      payload: { note: "Holiday" },
    });
    await lessonPlansApiAdapter.deleteLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
    });
    expect(apiPatch).toHaveBeenNthCalledWith(
      1,
      "/academics/lesson-plans/items/item-1/move",
      { weekIndex: 3, sortOrder: 0 },
    );
    expect(apiPatch).toHaveBeenNthCalledWith(
      2,
      "/academics/lesson-plans/plan-1/items/item-1/reorder",
      { sortOrder: 2 },
    );
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items/item-1/skip",
      { note: "Holiday" },
    );
    expect(apiDelete).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items/item-1",
    );
  });
});
