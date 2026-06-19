import type { LessonPlanItemStatus } from "../services/lessonPlansService";

export function lessonPlanItemAction(status: LessonPlanItemStatus) {
  const actions = {
    IN_PROGRESS: "start",
    DONE: "complete",
    SKIPPED: "skip",
    CANCELLED: "cancel",
  } as const;
  const action = actions[status as keyof typeof actions];
  if (!action)
    throw new Error(`Unsupported lesson plan item transition: ${status}`);
  return action;
}
