import { describe, expect, it } from "vitest";
import { buildRulesLocation, findRuleForEditor } from "../rulesRoute";

describe("findRuleForEditor", () => {
  it("returns only the rule addressed by the edit route", () => {
    const rule = { id: "rule-2", scopeType: "grade" };
    expect(findRuleForEditor([{ id: "rule-1" }, rule], "rule-2")).toBe(rule);
  });

  it("preserves the editor route when synchronizing query parameters", () => {
    expect(buildRulesLocation("/en/grades/rules/rule-2", "year=year-1&term=term-1")).toBe(
      "/en/grades/rules/rule-2?year=year-1&term=term-1",
    );
  });
});
