import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  BackendGradeRuleResponse,
  BackendGradeRulesListResponse,
} from "../../gradebook/types/api.types";
import type {
  EffectiveGradeRule,
  GradeRoundingMode,
  GradeRuleRecord,
  SaveGradeRulePayload,
  UpdateGradeRulePayload,
} from "../types";

function toGradeRoundingMode(value: string | undefined): GradeRoundingMode {
  const normalized = value?.toUpperCase();
  if (
    normalized === "NONE" ||
    normalized === "DECIMAL_0" ||
    normalized === "DECIMAL_1" ||
    normalized === "DECIMAL_2"
  ) {
    return normalized;
  }
  return "DECIMAL_1";
}

function mapGradeRule(response: BackendGradeRuleResponse): GradeRuleRecord {
  return {
    id: response.id ?? response.ruleId ?? "",
    academicYearId: response.academicYearId ?? response.yearId ?? "",
    termId: response.termId ?? "",
    scopeType: (response.scopeType ?? "school") as GradeRuleRecord["scopeType"],
    scopeId: response.scopeId ?? "",
    gradeId: response.gradeId ?? null,
    gradingScale: "PERCENTAGE",
    passMark: response.passMark ?? 50,
    rounding: toGradeRoundingMode(response.rounding),
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

export async function fetchGradeRules(
  academicYearId: string,
  termId: string,
): Promise<GradeRuleRecord[]> {
  const response = await apiGet<BackendGradeRulesListResponse>("/grades/rules", {
    params: { academicYearId, termId },
  });
  return response.items.map(mapGradeRule);
}

export async function fetchEffectiveGradeRule(
  payload: Omit<SaveGradeRulePayload, "passMark" | "gradingScale" | "rounding">,
): Promise<EffectiveGradeRule> {
  const response = await apiGet<BackendGradeRuleResponse>("/grades/rules/effective", {
    params: {
      ...payload,
      scopeId: payload.scopeId || undefined,
      gradeId: payload.gradeId || undefined,
    },
  });
  const rule = mapGradeRule(response);
  return {
    ...rule,
    id: response.id ?? response.ruleId ?? "",
    ruleId: response.ruleId ?? response.id ?? null,
    source: response.source ?? "DEFAULT",
  };
}

export async function saveGradeRule(payload: SaveGradeRulePayload): Promise<GradeRuleRecord> {
  const response = await apiPost<BackendGradeRuleResponse>("/grades/rules", {
    ...payload,
    scopeId: payload.scopeId || undefined,
    gradeId: payload.gradeId || undefined,
  });
  return mapGradeRule(response);
}

export async function updateGradeRule(
  ruleId: string,
  payload: UpdateGradeRulePayload,
): Promise<GradeRuleRecord> {
  const response = await apiPatch<BackendGradeRuleResponse>(
    `/grades/rules/${ruleId}`,
    payload,
  );
  return mapGradeRule(response);
}
