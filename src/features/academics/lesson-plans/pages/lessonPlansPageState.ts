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

export type LessonPlansViewState =
  | "loading"
  | "no-selection"
  | "no-allocation"
  | "no-curriculum"
  | "no-weeks"
  | "no-lessons"
  | "ready";

export function resolveLessonPlansView(input: {
  loading: boolean;
  scopeResolved: boolean;
  dataChecked: boolean;
  selectedSectionId?: string;
  selectedSubjectId?: string;
  teacherSubjectAllocationId?: string;
  curriculumId?: string;
  weeks?: unknown[];
  lessons?: unknown[];
}): LessonPlansViewState {
  if (input.loading || !input.scopeResolved) return "loading";
  if (!input.selectedSectionId || !input.selectedSubjectId) {
    return "no-selection";
  }
  if (!input.teacherSubjectAllocationId) return "no-allocation";
  if (!input.curriculumId) return "no-curriculum";
  if (!input.dataChecked) return "loading";
  if ((input.weeks ?? []).length === 0) return "no-weeks";
  if ((input.lessons ?? []).length === 0) return "no-lessons";
  return "ready";
}
