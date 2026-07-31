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

type LessonPlanItemTransition = Exclude<
  LessonPlanItemStatus,
  "PLANNED" | "UNKNOWN"
>;

const transitions: Record<
  LessonPlanItemStatus,
  readonly LessonPlanItemTransition[]
> = {
  PLANNED: ["IN_PROGRESS", "DONE", "SKIPPED", "CANCELLED"],
  IN_PROGRESS: ["DONE", "SKIPPED", "CANCELLED"],
  DONE: [],
  SKIPPED: [],
  CANCELLED: [],
  RESCHEDULED: [],
  UNKNOWN: [],
};

export function lessonPlanItemTransitions(status: LessonPlanItemStatus) {
  return transitions[status];
}
