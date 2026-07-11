import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { ExamScopeType } from "../../shared/types";
import type { BackendEffectiveGradeRuleResponse, BackendGradeRuleResponse, BackendGradeRulesListResponse, EffectiveGradeRule, EffectiveGradeRuleRequest, GradeRoundingMode, GradeRuleRecord, SaveGradeRulePayload, UpdateGradeRulePayload } from "../types";

const gradeRoundingByBackend: Record<BackendGradeRuleResponse["rounding"], GradeRoundingMode> = {
  none: "NONE",
  decimal_0: "DECIMAL_0",
  decimal_1: "DECIMAL_1",
  decimal_2: "DECIMAL_2",
};

function mapGradeRounding(rounding: BackendGradeRuleResponse["rounding"]): GradeRoundingMode {
  return gradeRoundingByBackend[rounding];
}

function mapRule(value: BackendGradeRuleResponse): GradeRuleRecord {
  return {
    id: value.id,
    academicYearId: value.academicYearId,
    termId: value.termId,
    scopeType: value.scopeType,
    scopeId: value.scopeKey,
    gradeId: value.gradeId,
    gradingScale: "PERCENTAGE",
    passMark: value.passMark,
    rounding: mapGradeRounding(value.rounding),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function mapEffectiveRule(value: BackendEffectiveGradeRuleResponse): EffectiveGradeRule {
  return {
    id: value.id ?? "",
    ruleId: value.ruleId,
    source: value.source,
    scopeType: value.scopeType,
    scopeId: value.scopeKey,
    gradeId: value.gradeId,
    gradingScale: "PERCENTAGE",
    passMark: value.passMark,
    rounding: mapGradeRounding(value.rounding),
    resolvedFrom: value.resolvedFrom,
  };
}

export async function fetchGradeRules(academicYearId: string, termId: string, filters: { scopeType?: ExamScopeType; scopeId?: string; gradeId?: string } = {}): Promise<GradeRuleRecord[]> {
  const response = await apiGet<BackendGradeRulesListResponse>("/grades/rules", { params: { academicYearId, termId, ...filters } });
  return response.items.map(mapRule);
}

export async function fetchEffectiveGradeRule(payload: EffectiveGradeRuleRequest): Promise<EffectiveGradeRule> {
  const response = await apiGet<BackendEffectiveGradeRuleResponse>("/grades/rules/effective", {
    params: Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")),
  });
  return mapEffectiveRule(response);
}

export async function saveGradeRule(payload: SaveGradeRulePayload): Promise<GradeRuleRecord> {
  return mapRule(await apiPost<BackendGradeRuleResponse>("/grades/rules", payload));
}

export async function updateGradeRule(ruleId: string, payload: UpdateGradeRulePayload): Promise<GradeRuleRecord> {
  return mapRule(await apiPatch<BackendGradeRuleResponse>(`/grades/rules/${ruleId}`, payload));
}
