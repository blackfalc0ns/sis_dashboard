export function findRuleForEditor<T extends { id: string }>(rules: T[], ruleId: string | undefined): T | null {
  return rules.find((rule) => rule.id === ruleId) ?? null;
}
