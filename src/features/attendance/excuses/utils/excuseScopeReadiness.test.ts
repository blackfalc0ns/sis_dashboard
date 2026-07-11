import { describe, expect, it } from "vitest";
import { getReadyExcuseScope } from "./excuseScopeReadiness";

describe("getReadyExcuseScope", () => {
  it("does not return a request scope before an explicit complete selection", () => {
    expect(getReadyExcuseScope("SCHOOL", {}, false)).toBeNull();
    expect(getReadyExcuseScope("STAGE", {}, true)).toBeNull();
    expect(
      getReadyExcuseScope("SECTION", { stageId: "stage-1" }, true),
    ).toBeNull();
  });

  it("returns an explicitly selected complete absence scope", () => {
    expect(
      getReadyExcuseScope("STAGE", { stageId: "stage-1" }, true, "ABSENCE"),
    ).toEqual({
      scopeType: "STAGE",
      scopeIds: { stageId: "stage-1" },
    });
  });

  it("requires grade-or-deeper context for period-based requests", () => {
    expect(
      getReadyExcuseScope("STAGE", { stageId: "stage-1" }, true, "LATE"),
    ).toBeNull();
    expect(
      getReadyExcuseScope(
        "GRADE",
        { stageId: "stage-1", gradeId: "grade-1" },
        true,
        "LATE",
      ),
    ).toEqual({
      scopeType: "GRADE",
      scopeIds: { stageId: "stage-1", gradeId: "grade-1" },
    });
  });
});
