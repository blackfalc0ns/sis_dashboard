import { describe, expect, it } from "vitest";
import { buildEffectiveRuleScope } from "../effectiveRuleScope";

describe("buildEffectiveRuleScope", () => {
  it("does not build a classroom request before all hierarchy IDs are selected", () => {
    expect(buildEffectiveRuleScope("classroom", { stage: "stage-1", grade: "grade-1" })).toBeNull();
  });

  it("includes the target and all parents for a classroom request", () => {
    expect(buildEffectiveRuleScope("classroom", {
      stage: "stage-1", grade: "grade-1", section: "section-1", classroom: "classroom-1",
    })).toEqual({
      scopeType: "classroom", scopeId: "classroom-1", stageId: "stage-1",
      gradeId: "grade-1", sectionId: "section-1", classroomId: "classroom-1",
    });
  });
});
