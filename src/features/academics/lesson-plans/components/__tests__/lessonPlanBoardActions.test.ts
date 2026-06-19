import { describe, expect, it } from "vitest";
import {
  lessonPlanItemAction,
  lessonPlanItemTransitions,
} from "../lessonPlanBoardActions";

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

  it.each([
    ["PLANNED", ["IN_PROGRESS", "DONE", "SKIPPED", "CANCELLED"]],
    ["IN_PROGRESS", ["DONE", "SKIPPED", "CANCELLED"]],
    ["DONE", []],
    ["SKIPPED", []],
    ["CANCELLED", []],
    ["UNKNOWN", []],
  ] as const)("exposes backend transitions from %s", (status, expected) => {
    expect(lessonPlanItemTransitions(status)).toEqual(expected);
  });
});
