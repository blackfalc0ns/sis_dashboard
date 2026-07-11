# Grades Rules List and Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/grades/rules` a list of created grade rules and move the rule editor to direct create and edit routes.

**Architecture:** Keep API access in the current rules service. Add a focused list page and make the existing editor receive its mode and optional rule ID from route wrappers. The editor keeps effective-rule lookup at all hierarchy levels but permits writes only at `SCHOOL` and `GRADE`.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, existing UI components, Vitest.

## Global Constraints

- Fetch the list once with `GET /grades/rules` for the active year and term.
- Do not resolve effective rules for each table row.
- Preserve active year and term when navigating between list and editor.
- Only save rules at backend-supported `SCHOOL` and `GRADE` scopes.

---

## File Structure

- Create `src/features/grades/rules/pages/GradesRulesListPage.tsx`: list page, empty state, and navigation.
- Modify `src/features/grades/rules/pages/GradesRulesPage.tsx`: route-aware create/edit editor.
- Modify `src/app/[lang]/(dashboard)/grades/(with-context)/rules/page.tsx`: list route.
- Create `src/app/[lang]/(dashboard)/grades/(with-context)/rules/new/page.tsx`: create route.
- Create `src/app/[lang]/(dashboard)/grades/(with-context)/rules/[ruleId]/page.tsx`: edit route.
- Create or modify `src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx` and `GradesRulesPage.test.tsx`.

## Task 1: Add a rules list page

**Files:**

- Create `src/features/grades/rules/pages/GradesRulesListPage.tsx`
- Create `src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`

**Consumes:** `fetchGradeRules(academicYearId, termId): Promise<GradeRuleRecord[]>`.

**Produces:** `GradesRulesListPage` for `/grades/rules`.

- [ ] **Step 1: Write the failing test**

```tsx
it("loads rules once and opens the selected row", async () => {
  mockedFetchGradeRules.mockResolvedValue([rule]);
  render(<GradesRulesListPage />);
  expect(await screen.findByText("70")).toBeVisible();
  expect(mockedFetchGradeRules).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole("row", { name: /70/i }));
  expect(mockedPush).toHaveBeenCalledWith(expect.stringContaining(`/grades/rules/${rule.id}`));
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`

Expected: FAIL because `GradesRulesListPage` does not exist.

- [ ] **Step 3: Implement the list page**

```tsx
const openRule = (rule: GradeRuleRecord) => {
  router.push(`/${locale}/grades/rules/${rule.id}?year=${academicYearId}&term=${termId}`);
};

const createRule = () => {
  router.push(`/${locale}/grades/rules/new?year=${academicYearId}&term=${termId}`);
};
```

Fetch only `fetchGradeRules(academicYearId, termId)`. Render columns for scope, pass mark, rounding, and updated date; rows call `openRule`. Render the project empty state when the returned list is empty and a create button that calls `createRule`.

- [ ] **Step 4: Verify the test passes**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/grades/rules/pages/GradesRulesListPage.tsx src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx
git commit -m "feat(grades): add grade rules list page"
```

## Task 2: Make the editor route-aware

**Files:**

- Modify `src/features/grades/rules/pages/GradesRulesPage.tsx`
- Create or modify `src/features/grades/rules/pages/__tests__/GradesRulesPage.test.tsx`

**Consumes:** `mode: "create" | "edit"`, `ruleId?: string`.

**Produces:** `GradesRulesPage({ mode, ruleId })`, returning to the list after cancel or successful save.

- [ ] **Step 1: Write failing tests**

```tsx
it("hydrates the editor with the route rule in edit mode", async () => {
  mockedFetchGradeRules.mockResolvedValue([rule]);
  render(<GradesRulesPage mode="edit" ruleId={rule.id} />);
  expect(await screen.findByDisplayValue("70")).toBeVisible();
});

it("disables save for a section effective-rule view", async () => {
  render(<GradesRulesPage mode="create" />);
  await userEvent.selectOptions(screen.getByLabelText(/section/i), section.id);
  expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesPage.test.tsx`

Expected: FAIL because the editor has no route-mode props.

- [ ] **Step 3: Implement mode and return navigation**

```tsx
interface GradesRulesPageProps {
  mode: "create" | "edit";
  ruleId?: string;
}

const returnToList = () => {
  router.push(`/${locale}/grades/rules?year=${academicYearId}&term=${termId}`);
};
```

In edit mode, load the scoped rules list and hydrate fields from the rule whose `id === ruleId`; if it is missing, show the existing error and call `returnToList`. Save with `updateGradeRule` in edit mode and `saveGradeRule` in create mode, then call `returnToList`. Keep hierarchy controls and effective-rule lookup, but keep saving disabled unless the selected scope is `SCHOOL` or `GRADE`.

- [ ] **Step 4: Verify the tests pass**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/grades/rules/pages/GradesRulesPage.tsx src/features/grades/rules/pages/__tests__/GradesRulesPage.test.tsx
git commit -m "feat(grades): make rules editor route-aware"
```

## Task 3: Add list, create, and edit routes

**Files:**

- Modify `src/app/[lang]/(dashboard)/grades/(with-context)/rules/page.tsx`
- Create `src/app/[lang]/(dashboard)/grades/(with-context)/rules/new/page.tsx`
- Create `src/app/[lang]/(dashboard)/grades/(with-context)/rules/[ruleId]/page.tsx`

**Consumes:** `GradesRulesListPage` and route-aware `GradesRulesPage`.

**Produces:** `/grades/rules`, `/grades/rules/new`, `/grades/rules/:ruleId`.

- [ ] **Step 1: Write a failing route test**

```tsx
it("uses the list, create, and edit route components", () => {
  expect(RulesPage).toBeDefined();
  expect(NewRulePage).toBeDefined();
  expect(RulePage).toBeDefined();
});
```

- [ ] **Step 2: Verify it fails**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`

Expected: FAIL because the two new route files do not exist.

- [ ] **Step 3: Add wrappers**

```tsx
// rules/page.tsx
export default function RulesPage() { return <GradesRulesListPage />; }

// rules/new/page.tsx
export default function NewRulePage() { return <GradesRulesPage mode="create" />; }

// rules/[ruleId]/page.tsx
export default function RulePage({ params }: { params: { ruleId: string } }) {
  return <GradesRulesPage mode="edit" ruleId={params.ruleId} />;
}
```

Match the project’s existing Next.js dynamic-route params convention if `params` is asynchronous.

- [ ] **Step 4: Verify routes and types**

Run: `npm run typecheck && npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx src/features/grades/rules/pages/__tests__/GradesRulesPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/[lang]/(dashboard)/grades/(with-context)/rules
git commit -m "feat(grades): add rules list and editor routes"
```

## Task 4: Final verification

- [ ] **Step 1: Run static checks**

Run: `npm run typecheck && npx eslint src/features/grades/rules src/app/[lang]/(dashboard)/grades/(with-context)/rules`

Expected: PASS with no errors.

- [ ] **Step 2: Run focused tests**

Run: `npm run test:run -- src/features/grades/rules/pages/__tests__`

Expected: PASS.

- [ ] **Step 3: Manually verify navigation**

Open `/en/grades/rules`, confirm one rules-list request, click a row, confirm `/en/grades/rules/:ruleId`, then save a School or Grade rule and confirm the list route opens.
