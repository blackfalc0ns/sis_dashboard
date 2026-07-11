import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { BackendEffectiveGradeRuleResponse, BackendGradeRuleResponse, BackendGradeRulesListResponse, EffectiveGradeRule, EffectiveGradeRuleRequest, GradeRoundingMode, GradeRuleRecord, GradeRulesListRequest, SaveGradeRulePayload, UpdateGradeRulePayload } from "../types";

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
    id: value.id,
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

type BackendRuleWritePayload = {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  scopeType?: "school" | "grade";
  scopeId?: string;
  gradeId?: string;
  passMark?: number;
  gradingScale?: BackendGradeRuleResponse["gradingScale"];
  rounding?: BackendGradeRuleResponse["rounding"];
};

function validatePassMark(passMark: number | undefined): void {
  if (passMark === undefined) return;
  if (!Number.isFinite(passMark) || passMark < 0 || passMark > 100 || !Number.isInteger(passMark * 100)) {
    throw new Error("Pass mark must be a number from 0 to 100 with at most two decimal places.");
  }
}

function mapRuleWritePayload(payload: SaveGradeRulePayload | UpdateGradeRulePayload): BackendRuleWritePayload {
  validatePassMark(payload.passMark);
  const { gradingScale, rounding, ...fields } = payload;
  return {
    ...fields,
    ...(gradingScale ? { gradingScale: gradingScale.toLowerCase() as BackendGradeRuleResponse["gradingScale"] } : {}),
    ...(rounding ? { rounding: rounding.toLowerCase() as BackendGradeRuleResponse["rounding"] } : {}),
  };
}

export async function fetchGradeRules(query: GradeRulesListRequest = {}): Promise<GradeRuleRecord[]> {
  const response = await apiGet<BackendGradeRulesListResponse>("/grades/rules", {
    params: Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== "")),
  });
  return response.items.map(mapRule);
}

export async function fetchEffectiveGradeRule(payload: EffectiveGradeRuleRequest): Promise<EffectiveGradeRule> {
  const response = await apiGet<BackendEffectiveGradeRuleResponse>("/grades/rules/effective", {
    params: Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")),
  });
  return mapEffectiveRule(response);
}

export async function saveGradeRule(payload: SaveGradeRulePayload): Promise<GradeRuleRecord> {
  return mapRule(await apiPost<BackendGradeRuleResponse>("/grades/rules", mapRuleWritePayload(payload)));
}

export async function updateGradeRule(ruleId: string, payload: UpdateGradeRulePayload): Promise<GradeRuleRecord> {
  return mapRule(await apiPatch<BackendGradeRuleResponse>(`/grades/rules/${ruleId}`, mapRuleWritePayload(payload)));
}
