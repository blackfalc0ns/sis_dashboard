import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EffectiveGradeRuleRequest } from "../../types";

const { apiGet, apiPost, apiPatch } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiGet, apiPost, apiPatch }));

import {
  fetchEffectiveGradeRule,
  fetchGradeRules,
  saveGradeRule,
  updateGradeRule,
} from "../gradesRulesService";

describe("gradesRulesService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires scope-specific context while allowing a school request without an ID", () => {
    const requests: EffectiveGradeRuleRequest[] = [
      { academicYearId: "year-1", termId: "term-1", scopeType: "school" },
      { yearId: "year-1", termId: "term-1", scopeType: "stage", stageId: "stage-1" },
      { academicYearId: "year-1", termId: "term-1", scopeType: "grade", gradeId: "grade-1" },
      { academicYearId: "year-1", termId: "term-1", scopeType: "section", sectionId: "section-1" },
      { academicYearId: "year-1", termId: "term-1", scopeType: "classroom", classroomId: "classroom-1" },
    ];

    // @ts-expect-error Non-school scopes need either scopeId or their matching context ID.
    const missingStageContext: EffectiveGradeRuleRequest = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "stage",
    };
    // @ts-expect-error Non-school scopes need either scopeId or their matching context ID.
    const missingGradeContext: EffectiveGradeRuleRequest = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "grade",
    };
    // @ts-expect-error Non-school scopes need either scopeId or their matching context ID.
    const missingSectionContext: EffectiveGradeRuleRequest = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "section",
    };
    // @ts-expect-error Non-school scopes need either scopeId or their matching context ID.
    const missingClassroomContext: EffectiveGradeRuleRequest = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "classroom",
    };

    expect(requests).toHaveLength(5);
    expect([
      missingStageContext,
      missingGradeContext,
      missingSectionContext,
      missingClassroomContext,
    ]).toHaveLength(4);
  });

  it("maps the backend list contract and preserves optional query aliases and filters", async () => {
    apiGet.mockResolvedValue({
      items: [{
        id: "rule-1",
        academicYearId: "year-1",
        yearId: "year-1",
        termId: "term-1",
        scopeType: "grade",
        scopeKey: "grade-1",
        scopeId: "grade-1",
        gradeId: "grade-1",
        gradingScale: "percentage",
        passMark: 62.5,
        rounding: "decimal_1",
        createdAt: "2026-07-11T10:00:00.000Z",
        updatedAt: "2026-07-11T10:00:00.000Z",
      }],
    });

    const rules = await fetchGradeRules({
      yearId: "year-1",
      termId: "term-1",
      scopeType: "grade",
      scopeId: "grade-1",
      gradeId: "grade-1",
    });

    expect(apiGet).toHaveBeenCalledWith("/grades/rules", {
      params: {
        yearId: "year-1",
        termId: "term-1",
        scopeType: "grade",
        scopeId: "grade-1",
        gradeId: "grade-1",
      },
    });
    expect(rules).toEqual([expect.objectContaining({
      id: "rule-1",
      academicYearId: "year-1",
      scopeId: "grade-1",
      gradingScale: "PERCENTAGE",
      rounding: "DECIMAL_1",
    })]);
  });

  it("preserves nullable default-rule identifiers, resolution metadata, and omits absent query keys", async () => {
    apiGet.mockResolvedValue({
      source: "DEFAULT",
      id: null,
      ruleId: null,
      scopeType: "classroom",
      scopeKey: "classroom-1",
      scopeId: "classroom-1",
      gradeId: "grade-1",
      gradingScale: "percentage",
      passMark: 50,
      rounding: "decimal_2",
      resolvedFrom: {
        requestedScopeType: "classroom",
        requestedScopeKey: "classroom-1",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
    });

    const rule = await fetchEffectiveGradeRule({
      yearId: "year-1",
      termId: "term-1",
      scopeType: "classroom",
      scopeId: "classroom-1",
    });

    expect(apiGet).toHaveBeenCalledWith("/grades/rules/effective", {
      params: {
        yearId: "year-1",
        termId: "term-1",
        scopeType: "classroom",
        scopeId: "classroom-1",
      },
    });
    expect(rule).toEqual(expect.objectContaining({
      id: null,
      ruleId: null,
      source: "DEFAULT",
      scopeId: "classroom-1",
      rounding: "DECIMAL_2",
      resolvedFrom: {
        requestedScopeType: "classroom",
        requestedScopeKey: "classroom-1",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
    }));
  });

  it("upserts a grade rule with the backend's lower-case enum payload and full response", async () => {
    apiPost.mockResolvedValue({
      id: "rule-1",
      academicYearId: "year-1",
      yearId: "year-1",
      termId: "term-1",
      scopeType: "grade",
      scopeKey: "grade-1",
      scopeId: "grade-1",
      gradeId: "grade-1",
      gradingScale: "percentage",
      passMark: 60.25,
      rounding: "decimal_1",
      createdAt: "2026-07-11T10:00:00.000Z",
      updatedAt: "2026-07-11T10:00:00.000Z",
    });
    const payload = {
      yearId: "year-1",
      termId: "term-1",
      scopeType: "grade" as const,
      gradeId: "grade-1",
      passMark: 60.25,
      gradingScale: "PERCENTAGE" as const,
      rounding: "DECIMAL_1" as const,
    };

    const rule = await saveGradeRule(payload);

    expect(apiPost).toHaveBeenCalledWith("/grades/rules", {
      yearId: "year-1",
      termId: "term-1",
      scopeType: "grade",
      gradeId: "grade-1",
      passMark: 60.25,
      gradingScale: "percentage",
      rounding: "decimal_1",
    });
    expect(rule).toEqual(expect.objectContaining({
      id: "rule-1",
      academicYearId: "year-1",
      scopeId: "grade-1",
      gradeId: "grade-1",
      passMark: 60.25,
      gradingScale: "PERCENTAGE",
      rounding: "DECIMAL_1",
    }));
  });

  it("patches the optional writable fields by rule UUID and maps the response", async () => {
    apiPatch.mockResolvedValue({
      id: "rule-1",
      academicYearId: "year-1",
      yearId: "year-1",
      termId: "term-1",
      scopeType: "school",
      scopeKey: "school-1",
      scopeId: "school-1",
      gradeId: null,
      gradingScale: "percentage",
      passMark: 70,
      rounding: "decimal_0",
      createdAt: "2026-07-11T10:00:00.000Z",
      updatedAt: "2026-07-11T10:01:00.000Z",
    });
    const payload = { passMark: 70, rounding: "DECIMAL_0" as const };

    const rule = await updateGradeRule("rule-1", payload);

    expect(apiPatch).toHaveBeenCalledWith("/grades/rules/rule-1", {
      passMark: 70,
      rounding: "decimal_0",
    });
    expect(rule).toEqual(expect.objectContaining({
      id: "rule-1",
      gradeId: null,
      passMark: 70,
      rounding: "DECIMAL_0",
    }));
  });

  it.each([0, 100, 50.25])("accepts the backend pass-mark boundary %s", async (passMark) => {
    apiPost.mockResolvedValue({});

    await expect(saveGradeRule({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "school",
      passMark,
    })).resolves.toBeDefined();

    expect(apiPost).toHaveBeenCalledWith("/grades/rules", expect.objectContaining({ passMark }));
  });

  it.each([-0.01, 100.01, 50.123])("rejects an invalid pass mark before sending %s", async (passMark) => {
    await expect(saveGradeRule({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "school",
      passMark,
    })).rejects.toThrow("Pass mark must be a number from 0 to 100 with at most two decimal places.");

    expect(apiPost).not.toHaveBeenCalled();
  });
});
