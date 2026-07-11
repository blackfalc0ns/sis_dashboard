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

type GradeRuleWriteAcademicYear =
  | { academicYearId: string; yearId?: string }
  | { academicYearId?: string; yearId: string };

type GradeRuleWriteScope =
  | { scopeType: "school"; scopeId?: string; gradeId?: string }
  | (
      | { scopeId: string; gradeId?: string }
      | { scopeId?: string; gradeId: string }
    ) & { scopeType: "grade" };

export type SaveGradeRulePayload = GradeRuleWriteAcademicYear & GradeRuleWriteScope & {
  termId: string;
  passMark: number;
  gradingScale?: GradeRuleScale;
  rounding?: GradeRoundingMode;
};

export type UpdateGradeRulePayload = Partial<Pick<SaveGradeRulePayload, "passMark" | "gradingScale" | "rounding">>;

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
  subjectId?: string;
}

type EffectiveGradeRuleAcademicYear =
  | { academicYearId: string; yearId?: string }
  | { academicYearId?: string; yearId: string };

type RequiredScopeContext<TContextKey extends "stageId" | "gradeId" | "sectionId" | "classroomId"> =
  | ({ scopeId: string } & Partial<Record<TContextKey, string>>)
  | ({ scopeId?: string } & Record<TContextKey, string>);

type EffectiveGradeRuleScope =
  | { scopeType: "school"; scopeId?: string }
  | (RequiredScopeContext<"stageId"> & { scopeType: "stage" })
  | (RequiredScopeContext<"gradeId"> & { scopeType: "grade"; stageId?: string })
  | (RequiredScopeContext<"sectionId"> & {
      scopeType: "section";
      stageId?: string;
      gradeId?: string;
    })
  | (RequiredScopeContext<"classroomId"> & {
      scopeType: "classroom";
      stageId?: string;
      gradeId?: string;
      sectionId?: string;
    });

export type EffectiveGradeRuleRequest = EffectiveGradeRuleRequestBase
  & EffectiveGradeRuleAcademicYear
  & EffectiveGradeRuleScope;
