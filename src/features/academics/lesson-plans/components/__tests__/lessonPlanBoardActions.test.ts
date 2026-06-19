import { describe, expect, it } from "vitest";
import { lessonPlanItemAction } from "../lessonPlanBoardActions";

describe("lesson plan board actions", () => {
  it.each([
    ["IN_PROGRESS", "start"],
    ["DONE", "complete"],
    ["SKIPPED", "skip"],
    ["CANCELLED", "cancel"],
  ] as const)("maps %s to %s", (status, action) =>
    expect(lessonPlanItemAction(status)).toBe(action),
  );
  it("rejects unsupported reset-to-planned transitions", () =>
    expect(() => lessonPlanItemAction("PLANNED")).toThrow());
});
