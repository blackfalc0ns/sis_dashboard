import { describe, expect, it } from "vitest";
import { shouldLoadExcusePeriods } from "./excusePeriodLoading";

describe("shouldLoadExcusePeriods", () => {
  it.each([
    ["ABSENCE", false],
    ["LATE", true],
    ["EARLY_LEAVE", true],
  ] as const)("returns %s for %s excuses", (type, expected) => {
    expect(shouldLoadExcusePeriods(type)).toBe(expected);
  });

  it("defers loading during the modal opening transition", () => {
    expect(shouldLoadExcusePeriods("LATE", true)).toBe(false);
  });
});
