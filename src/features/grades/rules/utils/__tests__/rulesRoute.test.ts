import { describe, expect, it } from "vitest";
import { findRuleForEditor } from "../rulesRoute";

describe("findRuleForEditor", () => {
  it("returns only the rule addressed by the edit route", () => {
    const rule = { id: "rule-2", scopeType: "grade" };
    expect(findRuleForEditor([{ id: "rule-1" }, rule], "rule-2")).toBe(rule);
  });
});
