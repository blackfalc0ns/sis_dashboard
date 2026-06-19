import { describe, expect, it } from "vitest";
import type { LessonPlan } from "../../services/lessonPlansService";
import {
  canEditLessonPlans,
  resolveLessonPlansView,
} from "../lessonPlansPageState";

const plan = (status: LessonPlan["status"]) => ({ status }) as LessonPlan;
describe("lesson plans mutation gate", () => {
  it.each([
    [{ canManage: true, termStatus: "open", plans: [plan("ACTIVE")] }, true],
    [{ canManage: true, termStatus: "closed", plans: [plan("ACTIVE")] }, false],
    [{ canManage: true, termStatus: "open", plans: [plan("ARCHIVED")] }, false],
    [{ canManage: false, termStatus: "open", plans: [plan("ACTIVE")] }, false],
  ])(
    "derives editability from permission, term, and plan state",
    (input, expected) => expect(canEditLessonPlans(input)).toBe(expected),
  );
});

describe("lesson plans page state", () => {
  const resolvedScope = {
    loading: false,
    scopeResolved: true,
    dataChecked: true,
    selectedSectionId: "classroom-1",
    selectedSubjectId: "subject-1",
    teacherSubjectAllocationId: "allocation-1",
    curriculumId: "curriculum-1",
    weeks: [{}],
    lessons: [{}],
  };

  it.each([
    [{ loading: true }, "loading"],
    [{ selectedSectionId: undefined }, "no-selection"],
    [{ teacherSubjectAllocationId: undefined }, "no-allocation"],
    [{ curriculumId: undefined }, "no-curriculum"],
    [{ dataChecked: false }, "loading"],
    [{ weeks: [] }, "no-weeks"],
    [{ lessons: [] }, "no-lessons"],
    [{}, "ready"],
  ] as const)("resolves scoped data to %s", (overrides, expected) => {
    expect(resolveLessonPlansView({ ...resolvedScope, ...overrides })).toBe(
      expected,
    );
  });
});
