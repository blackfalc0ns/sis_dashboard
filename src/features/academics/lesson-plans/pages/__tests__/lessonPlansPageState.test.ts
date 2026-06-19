import { describe, expect, it } from "vitest";
import type { LessonPlan } from "../../services/lessonPlansService";
import { canEditLessonPlans } from "../lessonPlansPageState";

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
