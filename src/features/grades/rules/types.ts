import type { ExamScopeType } from "../shared/types";

export type GradeRuleScale = "PERCENTAGE";
export type GradeRoundingMode = "NONE" | "DECIMAL_0" | "DECIMAL_1" | "DECIMAL_2";

export interface GradeRuleRecord {
  id: string;
  academicYearId: string;
  termId: string;
  scopeType: ExamScopeType;
  scopeId: string;
  gradeId: string | null;
  gradingScale: GradeRuleScale;
  passMark: number;
  rounding: GradeRoundingMode;
  createdAt?: string;
  updatedAt?: string;
}

export interface EffectiveGradeRule extends Omit<GradeRuleRecord, "id" | "academicYearId" | "termId"> {
  id: string | null;
  ruleId: string | null;
  source: "DEFAULT" | "SCHOOL" | "GRADE" | "STAGE";
  resolvedFrom: {
    requestedScopeType: ExamScopeType;
    requestedScopeKey: string;
    stageId: string | null;
    gradeId: string | null;
    sectionId: string | null;
    classroomId: string | null;
  };
}

export interface BackendGradeRuleResponse {
  id: string;
  academicYearId: string;
  yearId: string;
  termId: string;
  scopeType: ExamScopeType;
  scopeKey: string;
  scopeId: string;
  gradeId: string | null;
  gradingScale: "percentage";
  passMark: number;
  rounding: "none" | "decimal_0" | "decimal_1" | "decimal_2";
  createdAt: string;
  updatedAt: string;
}

export interface BackendGradeRulesListResponse {
  items: BackendGradeRuleResponse[];
}

export interface BackendEffectiveGradeRuleResponse {
  source: "DEFAULT" | "SCHOOL" | "GRADE" | "STAGE";
  id: string | null;
  ruleId: string | null;
  scopeType: ExamScopeType;
  scopeKey: string;
  scopeId: string;
  gradeId: string | null;
  gradingScale: "percentage";
  passMark: number;
  rounding: "none" | "decimal_0" | "decimal_1" | "decimal_2";
  resolvedFrom: EffectiveGradeRule["resolvedFrom"];
}

export interface SaveGradeRulePayload {
  academicYearId: string;
  termId: string;
  scopeType: ExamScopeType;
  scopeId?: string;
  gradeId?: string;
  passMark: number;
  gradingScale: GradeRuleScale;
  rounding: GradeRoundingMode;
}

export type UpdateGradeRulePayload = Pick<SaveGradeRulePayload, "passMark" | "gradingScale" | "rounding">;

export interface GradeRulesListRequest {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  scopeType?: ExamScopeType;
  scopeId?: string;
  gradeId?: string;
}

interface EffectiveGradeRuleRequestBase {
  termId: string;
  scopeType: ExamScopeType;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
}

export type EffectiveGradeRuleRequest = EffectiveGradeRuleRequestBase & (
  | { academicYearId: string; yearId?: string }
  | { academicYearId?: string; yearId: string }
);
