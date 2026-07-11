import { describe, expect, it } from "vitest";
import { submissionStatusMessageKey } from "../submissionStatus";

describe("submission status presentation", () => {
  it.each([
    ["in_progress", "IN_PROGRESS"],
    ["submitted", "SUBMITTED"],
    ["corrected", "CORRECTED"],
  ] as const)("maps %s to the existing %s translation", (status, key) => {
    expect(submissionStatusMessageKey(status)).toBe(key);
  });
});
