# Grades Rules Backend-Aligned UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend-supported list filtering and an on-demand effective-rule inspector without unnecessary requests.

**Architecture:** The list owns `GET /grades/rules`. A dedicated inspector consumes the bootstrap hierarchy and calls `GET /grades/rules/effective` only for a complete target.

**Tech Stack:** Next.js, React, TypeScript, next-intl, existing Select/DataTable components, Vitest.

## Global Constraints

- List requests use only `academicYearId`, `termId`, `scopeType`, `scopeId`, and `gradeId`.
- Never call the effective-rule endpoint per row or for incomplete targets.
- Rules remain writable only at `SCHOOL` and `GRADE`.

---

## File Structure

- Create `src/features/grades/rules/utils/effectiveRuleScope.ts` with scope payload tests.
- Modify `src/features/grades/rules/services/gradesRulesService.ts` for optional list filters.
- Create `src/features/grades/rules/components/EffectiveGradeRuleInspector.tsx` with component tests.
- Modify `src/features/grades/rules/pages/GradesRulesListPage.tsx` for filters and inspector integration.

## Task 1: Build effective-rule payloads

**Files:** Create `src/features/grades/rules/utils/effectiveRuleScope.ts`; create `src/features/grades/rules/utils/__tests__/effectiveRuleScope.test.ts`.

- [ ] **Step 1: Write a failing test**

```ts
expect(buildEffectiveRuleScope("classroom", { stage: "stage-1", grade: "grade-1" })).toBeNull();
expect(buildEffectiveRuleScope("classroom", { stage: "stage-1", grade: "grade-1", section: "section-1", classroom: "classroom-1" })).toMatchObject({ scopeType: "classroom", scopeId: "classroom-1", stageId: "stage-1", gradeId: "grade-1", sectionId: "section-1", classroomId: "classroom-1" });
```

- [ ] **Step 2: Verify failure**

Run: `npm run test:run -- src/features/grades/rules/utils/__tests__/effectiveRuleScope.test.ts`

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Implement the builder**

```ts
export function buildEffectiveRuleScope(scopeType: ExamScopeType, selected: Partial<Record<ExamScopeType, string>>) {
  const scopeId = scopeType === "school" ? undefined : selected[scopeType];
  if (scopeType !== "school" && !scopeId) return null;
  if (scopeType === "grade" && !selected.stage) return null;
  if (scopeType === "section" && (!selected.stage || !selected.grade)) return null;
  if (scopeType === "classroom" && (!selected.stage || !selected.grade || !selected.section)) return null;
  return { scopeType, scopeId, stageId: selected.stage, gradeId: selected.grade, sectionId: selected.section, classroomId: selected.classroom };
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/grades/rules/utils/__tests__/effectiveRuleScope.test.ts`

Expected: PASS.

```bash
git add src/features/grades/rules/utils/effectiveRuleScope.ts src/features/grades/rules/utils/__tests__/effectiveRuleScope.test.ts
git commit -m "feat(grades): build effective rule scope payloads"
```

## Task 2: Support backend list filters

**Files:** Modify `src/features/grades/rules/services/gradesRulesService.ts`; modify `src/features/grades/rules/pages/GradesRulesListPage.tsx` and its test.

- [ ] **Step 1: Write a failing filter test**

```tsx
await userEvent.selectOptions(screen.getByLabelText(/scope/i), "grade-1");
await waitFor(() => expect(mockedFetchGradeRules).toHaveBeenLastCalledWith("year-1", "term-1", { scopeType: "grade", scopeId: "grade-1", gradeId: "grade-1" }));
```

- [ ] **Step 2: Verify failure**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`

Expected: FAIL because the list has no backend filters.

- [ ] **Step 3: Implement optional query filters**

```ts
export async function fetchGradeRules(academicYearId: string, termId: string, filters: { scopeType?: ExamScopeType; scopeId?: string; gradeId?: string } = {}) {
  const response = await apiGet<BackendGradeRulesListResponse>("/grades/rules", { params: { academicYearId, termId, ...filters } });
  return response.items.map(mapGradeRule);
}
```

Add School/Grade list controls. Reset `scopeId` when scope type changes, then reload only after a valid selection is settled.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`

Expected: PASS.

```bash
git add src/features/grades/rules/services/gradesRulesService.ts src/features/grades/rules/pages/GradesRulesListPage.tsx src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx
git commit -m "feat(grades): filter rules list with backend query"
```

## Task 3: Add the effective-rule inspector

**Files:** Create `src/features/grades/rules/components/EffectiveGradeRuleInspector.tsx`; create `src/features/grades/rules/components/__tests__/EffectiveGradeRuleInspector.test.tsx`; modify `src/features/grades/rules/pages/GradesRulesListPage.tsx`.

- [ ] **Step 1: Write a failing inspector test**

```tsx
await userEvent.selectOptions(screen.getByLabelText(/stage/i), "stage-1");
expect(mockedFetchEffectiveGradeRule).not.toHaveBeenCalled();
await userEvent.selectOptions(screen.getByLabelText(/grade/i), "grade-1");
await waitFor(() => expect(mockedFetchEffectiveGradeRule).toHaveBeenCalledTimes(1));
```

- [ ] **Step 2: Verify failure**

Run: `npm run test:run -- src/features/grades/rules/components/__tests__/EffectiveGradeRuleInspector.test.tsx`

Expected: FAIL because the inspector does not exist.

- [ ] **Step 3: Implement inspection**

```tsx
const requestScope = buildEffectiveRuleScope(targetScopeType, selectedScopeIds);
useEffect(() => {
  if (!requestScope || !academicYearId || !termId) return;
  void fetchEffectiveGradeRule({ academicYearId, termId, ...requestScope }).then(setEffectiveRule);
}, [academicYearId, requestScope, termId]);
```

Use Stage → Grade → Section → Classroom selectors, reset descendants, and show source, pass mark, rounding, and `resolvedFrom`. Stage, Section, and Classroom show inherited behavior and no save action.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/grades/rules/components/__tests__/EffectiveGradeRuleInspector.test.tsx`

Expected: PASS.

```bash
git add src/features/grades/rules/components src/features/grades/rules/pages/GradesRulesListPage.tsx
git commit -m "feat(grades): add effective rule inspector"
```

## Task 4: Final verification

- [ ] **Step 1: Run checks**

Run: `npm run test:run -- src/features/grades/rules && npm run typecheck && npx eslint src/features/grades/rules`

Expected: PASS.

- [ ] **Step 2: Verify request policy manually**

Open `/en/grades/rules`; change one list filter and verify one list request. Select only Stage in the inspector and verify no effective-rule request. Complete Grade and verify one request containing `stageId`, `gradeId`, `scopeType=grade`, and `scopeId`.
