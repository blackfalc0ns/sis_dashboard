import type { ExamScopeType } from "../../shared/types";

export interface EffectiveRuleScopeInput {
  scopeType: ExamScopeType;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export function buildEffectiveRuleScope(
  scopeType: ExamScopeType,
  selected: Partial<Record<ExamScopeType, string>>,
): EffectiveRuleScopeInput | null {
  const scopeId = scopeType === "school" ? undefined : selected[scopeType];
  if (scopeType !== "school" && !scopeId) return null;
  if (scopeType === "grade" && !selected.stage) return null;
  if (scopeType === "section" && (!selected.stage || !selected.grade)) return null;
  if (scopeType === "classroom" && (!selected.stage || !selected.grade || !selected.section)) return null;

  return {
    scopeType,
    scopeId,
    stageId: selected.stage,
    gradeId: selected.grade,
    sectionId: selected.section,
    classroomId: selected.classroom,
  };
}
