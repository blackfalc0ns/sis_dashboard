import { describe, expect, it } from "vitest";
import { canSyncCurriculumFilters, curriculumOptionsContextKey } from "../curriculumFilterState";

describe("curriculum filter URL restoration", () => {
  it("does not synchronize URL filters before options load", () => {
    expect(canSyncCurriculumFilters(null, "year-1", "term-1")).toBe(false);
  });

  it("synchronizes only after options for the current context load", () => {
    const loadedContext = curriculumOptionsContextKey("year-1", "term-1");

    expect(canSyncCurriculumFilters(loadedContext, "year-1", "term-1")).toBe(true);
    expect(canSyncCurriculumFilters(loadedContext, "year-2", "term-1")).toBe(false);
  });
});
