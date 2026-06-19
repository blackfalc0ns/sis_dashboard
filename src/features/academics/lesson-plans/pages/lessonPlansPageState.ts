import type { LessonPlan } from "../services/lessonPlansService";

export function canEditLessonPlans(input: {
  canManage: boolean;
  termStatus: string;
  plans: LessonPlan[];
}) {
  return (
    input.canManage &&
    input.termStatus !== "closed" &&
    input.plans.every((plan) => plan.status !== "ARCHIVED")
  );
}
