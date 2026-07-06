# Onboarding Edit Controls for All Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add summary-first edit controls to every onboarding setup step while preserving the existing create/setup flows.

**Architecture:** Reuse the existing step components and introduce a small local summary/edit state per step. `SetupGuideContent` will pass completion status, rooms data, and expanded localized copy into each step. Existing create APIs and dialogs remain unchanged; edit mode means “open the current setup controls.”

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, Vitest, Testing Library, Tailwind CSS.

---

## File Structure

- Modify `src/features/onboarding/components/steps/AcademicContextSetupStep.tsx`: add saved-data summary mode, edit/cancel actions, and direct edit mode when year/term data is incomplete.
- Modify `src/features/onboarding/components/steps/AcademicStructureSetupStep.tsx`: add summary mode for complete/partial structure counts and edit/cancel wrapper around the existing next-action form.
- Modify `src/features/onboarding/components/steps/SubjectsSetupStep.tsx`: add summary mode for subjects/allocations and edit/cancel wrapper around existing subject/allocation controls.
- Modify `src/features/onboarding/components/steps/RoomsSetupStep.tsx`: accept `rooms`, add summary mode for room count, and edit/cancel wrapper around existing room creation dialog.
- Modify `src/features/onboarding/components/SetupGuideContent.tsx`: pass each step evaluation status, rooms data, and new localized copy fields.
- Modify `src/messages/en.json` and `src/messages/ar.json`: add shared edit/cancel/saved-data labels and count labels for the affected steps.
- Modify `src/messages/__tests__/onboardingTranslations.test.ts`: assert representative new keys and keep EN/AR parity.
- Modify focused step tests under `src/features/onboarding/__tests__`: update each step test for summary → edit → cancel and incomplete direct-edit behavior.

## Shared Implementation Rules

- “Edit” must not add update/delete flows for existing records.
- Completed/populated steps render summary mode first.
- Incomplete steps render edit mode first.
- Cancel returns to summary mode only when summary data exists.
- Existing service calls and `refreshStep(...)` calls must remain unchanged.
- Keep `src/components/ui/input/Select.tsx` untouched; it has an unrelated unstaged user change.

### Task 1: Lock localization contract

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/onboardingTranslations.test.ts`

- [ ] **Step 1: Add failing translation assertions**

Add representative assertions to `src/messages/__tests__/onboardingTranslations.test.ts`:

```ts
expect(en.onboarding.steps.academicContext.edit).toBe("Edit");
expect(en.onboarding.steps.structure.stagesCount).toContain("{count");
expect(en.onboarding.steps.subjects.allocationsCount).toContain("{count");
expect(en.onboarding.steps.rooms.roomsCount).toContain("{count");
expect(ar.onboarding.steps.academicContext.cancel).toBeTruthy();
```

- [ ] **Step 2: Run translation test and verify RED**

Run:

```bash
npx vitest run src/messages/__tests__/onboardingTranslations.test.ts --reporter=dot
```

Expected: FAIL because the new keys do not exist.

- [ ] **Step 3: Add English messages**

Under each affected `onboarding.steps.*` object in `src/messages/en.json`, add:

```json
{
  "savedData": "Saved setup data",
  "edit": "Edit",
  "cancel": "Cancel"
}
```

Also add step-specific keys:

```json
{
  "academicContext": {
    "selectedYear": "Selected year: {name}"
  },
  "structure": {
    "stagesCount": "{count, plural, =0 {No stages} one {# stage} other {# stages}}",
    "gradesCount": "{count, plural, =0 {No grades} one {# grade} other {# grades}}",
    "sectionsCount": "{count, plural, =0 {No sections} one {# section} other {# sections}}",
    "incomplete": "Academic structure is still incomplete"
  },
  "subjects": {
    "subjectsCount": "{count, plural, =0 {No subjects} one {# subject} other {# subjects}}",
    "allocationsCount": "{count, plural, =0 {No allocations} one {# allocation} other {# allocations}}"
  },
  "rooms": {
    "roomsCount": "{count, plural, =0 {No rooms} one {# room} other {# rooms}}"
  }
}
```

- [ ] **Step 4: Add Arabic messages**

Add the same keys in `src/messages/ar.json` using Arabic text. Keep placeholders exactly the same (`{count}`, `{name}`).

- [ ] **Step 5: Run translation test and verify GREEN**

Run:

```bash
npx vitest run src/messages/__tests__/onboardingTranslations.test.ts --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts
git commit -m "feat: add onboarding edit step translations"
```

### Task 2: Academic context summary/edit mode

**Files:**
- Modify: `src/features/onboarding/components/steps/AcademicContextSetupStep.tsx`
- Test: `src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx`

- [ ] **Step 1: Replace/add failing tests**

Add tests that verify:

```ts
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
expect(screen.getByText(copy.yearsCount(1))).toBeVisible();
expect(screen.getByText(copy.termsCount(1))).toBeVisible();

await user.click(screen.getByRole("button", { name: copy.edit }));
expect(screen.getByRole("button", { name: copy.createTerm })).toBeVisible();

await user.click(screen.getByRole("button", { name: copy.cancel }));
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
```

Also test incomplete direct-edit:

```ts
render(
  <AcademicContextSetupStep
    copy={copy}
    data={{ years: [], termsByYear: {} }}
    selectedYear={null}
    refreshStep={vi.fn()}
  />,
);
expect(screen.getByRole("button", { name: copy.createYear })).toBeVisible();
expect(screen.queryByRole("heading", { name: copy.savedData })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx --reporter=dot
```

Expected: FAIL because `savedData`, `edit`, and `cancel` behavior does not exist.

- [ ] **Step 3: Expand copy interface**

Update `AcademicContextSetupStepCopy`:

```ts
export interface AcademicContextSetupStepCopy {
  summary: string;
  savedData: string;
  edit: string;
  cancel: string;
  yearsCount(count: number): string;
  termsCount(count: number): string;
  selectedYear(name: string): string;
  createYear: string;
  createTerm: string;
}
```

- [ ] **Step 4: Implement summary/edit state**

Add:

```ts
const hasYear = data.years.length > 0;
const hasTerms = countTerms(data) > 0;
const hasMinimumData = hasYear && hasTerms;
const [isEditing, setIsEditing] = useState(!hasMinimumData);

useEffect(() => {
  setIsEditing(!hasMinimumData);
}, [hasMinimumData]);
```

Render summary mode when `!isEditing` with heading `copy.savedData`, count cards, selected year text, and edit button. Render existing controls in edit mode with a cancel button only when `hasMinimumData`.

- [ ] **Step 5: Run test and verify GREEN**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding/components/steps/AcademicContextSetupStep.tsx src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx
git commit -m "feat: add edit mode to academic context onboarding"
```

### Task 3: Academic structure summary/edit mode

**Files:**
- Modify: `src/features/onboarding/components/steps/AcademicStructureSetupStep.tsx`
- Test: `src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx`

- [ ] **Step 1: Add failing summary/edit tests**

Use a tree with one stage, one grade, and one section. Assert summary first:

```ts
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
expect(screen.getByText(copy.stagesCount(1))).toBeVisible();
expect(screen.getByText(copy.gradesCount(1))).toBeVisible();
expect(screen.getByText(copy.sectionsCount(1))).toBeVisible();

await user.click(screen.getByRole("button", { name: copy.edit }));
expect(screen.getByRole("heading", { name: copy.complete })).toBeVisible();

await user.click(screen.getByRole("button", { name: copy.cancel }));
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
```

Also keep the existing create flow test with an incomplete tree and assert it opens directly in edit mode.

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx --reporter=dot
```

Expected: FAIL for missing copy fields and summary mode.

- [ ] **Step 3: Expand copy interface**

Add to `AcademicStructureSetupStepCopy`:

```ts
savedData: string;
edit: string;
cancel: string;
stagesCount(count: number): string;
gradesCount(count: number): string;
sectionsCount(count: number): string;
incomplete: string;
```

- [ ] **Step 4: Implement summary/edit wrapper**

Use:

```ts
const hasMinimumData =
  tree.stages.length > 0 && tree.grades.length > 0 && tree.sections.length > 0;
const [isEditing, setIsEditing] = useState(!hasMinimumData);

useEffect(() => {
  setIsEditing(!hasMinimumData);
}, [hasMinimumData]);
```

When `!isEditing`, render count cards and edit button. When `isEditing`, render existing next-action content plus cancel button when `hasMinimumData`.

- [ ] **Step 5: Run test and verify GREEN**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding/components/steps/AcademicStructureSetupStep.tsx src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx
git commit -m "feat: add edit mode to structure onboarding"
```

### Task 4: Subjects summary/edit mode

**Files:**
- Modify: `src/features/onboarding/components/steps/SubjectsSetupStep.tsx`
- Test: `src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx`

- [ ] **Step 1: Add failing summary/edit tests**

For populated subjects data:

```ts
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
expect(screen.getByText(copy.subjectsCount(1))).toBeVisible();
expect(screen.getByText(copy.allocationsCount(1))).toBeVisible();

await user.click(screen.getByRole("button", { name: copy.edit }));
expect(screen.getByRole("button", { name: copy.saveAllocation })).toBeVisible();

await user.click(screen.getByRole("button", { name: copy.cancel }));
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
```

For empty subjects data, assert direct edit mode and `copy.createSubject` visible.

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx --reporter=dot
```

Expected: FAIL.

- [ ] **Step 3: Expand copy interface**

Add:

```ts
savedData: string;
edit: string;
cancel: string;
subjectsCount(count: number): string;
allocationsCount(count: number): string;
```

- [ ] **Step 4: Implement summary/edit wrapper**

Use:

```ts
const hasMinimumData =
  subjectsData.subjects.length > 0 && subjectsData.allocations.length > 0;
const [isEditing, setIsEditing] = useState(!hasMinimumData);

useEffect(() => {
  setIsEditing(!hasMinimumData);
}, [hasMinimumData]);
```

Keep the existing subject dialog and allocation save behavior in edit mode.

- [ ] **Step 5: Run test and verify GREEN**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding/components/steps/SubjectsSetupStep.tsx src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx
git commit -m "feat: add edit mode to subjects onboarding"
```

### Task 5: Rooms summary/edit mode and data flow

**Files:**
- Modify: `src/features/onboarding/components/steps/RoomsSetupStep.tsx`
- Modify: `src/features/onboarding/components/SetupGuideContent.tsx`
- Test: `src/features/onboarding/__tests__/RoomsSetupStep.test.tsx`

- [ ] **Step 1: Add failing room summary/edit tests**

Render with one room:

```ts
render(
  <RoomsSetupStep
    copy={copy}
    rooms={[{ id: "room-1", schoolId: "school-1", name: "Room 101" } as Room]}
    schoolId="school-1"
    refreshStep={vi.fn()}
  />,
);

expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
expect(screen.getByText(copy.roomsCount(1))).toBeVisible();
```

Then click edit and assert `copy.createRoom`, click cancel and assert summary returns. Keep the existing create-room test with `rooms={[]}` and assert direct edit mode.

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/RoomsSetupStep.test.tsx --reporter=dot
```

Expected: FAIL because `rooms` prop and summary mode do not exist.

- [ ] **Step 3: Expand copy and props**

Update `RoomsSetupStepCopy`:

```ts
export interface RoomsSetupStepCopy {
  summary: string;
  savedData: string;
  edit: string;
  cancel: string;
  roomsCount(count: number): string;
  createRoom: string;
  missingSchool: string;
  saveFailed: string;
}
```

Update props:

```ts
interface RoomsSetupStepProps {
  copy: RoomsSetupStepCopy;
  rooms: Room[];
  schoolId: string;
  refreshStep(stepId: "rooms"): Promise<void> | void;
}
```

- [ ] **Step 4: Implement summary/edit wrapper**

Use:

```ts
const hasMinimumData = rooms.length > 0;
const [isEditing, setIsEditing] = useState(!hasMinimumData);

useEffect(() => {
  setIsEditing(!hasMinimumData);
}, [hasMinimumData]);
```

Render summary mode with `copy.savedData`, `copy.roomsCount(rooms.length)`, and edit button. Render existing create-room action/dialog in edit mode with cancel button when `hasMinimumData`.

- [ ] **Step 5: Pass rooms data from SetupGuideContent**

In `createStepContent`, derive:

```ts
const rooms = snapshot.rooms.status === "success"
  ? snapshot.rooms.data
  : snapshot.rooms.data ?? [];
```

Pass:

```tsx
<RoomsSetupStep
  copy={copy.rooms}
  refreshStep={result.refreshStep}
  rooms={rooms}
  schoolId={result.schoolId}
/>
```

- [ ] **Step 6: Run room test and verify GREEN**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/RoomsSetupStep.test.tsx --reporter=dot
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/onboarding/components/steps/RoomsSetupStep.tsx src/features/onboarding/components/SetupGuideContent.tsx src/features/onboarding/__tests__/RoomsSetupStep.test.tsx
git commit -m "feat: add edit mode to rooms onboarding"
```

### Task 6: Wire localized copy for all steps and run integration checks

**Files:**
- Modify: `src/features/onboarding/components/SetupGuideContent.tsx`
- Test: `src/features/onboarding/__tests__/SetupGuideCard.test.tsx`
- Test: `src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx`
- Test: `src/features/onboarding/__tests__/SetupGuide.test.tsx`

- [ ] **Step 1: Complete copy mapping**

Map the new fields in `SetupGuideContent`:

```ts
academicContext: {
  savedData: t("steps.academicContext.savedData"),
  edit: t("steps.academicContext.edit"),
  cancel: t("steps.academicContext.cancel"),
  selectedYear: (name) => t("steps.academicContext.selectedYear", { name }),
}
```

Repeat for `structure`, `subjects`, and `rooms` using the keys from Task 1.

- [ ] **Step 2: Run full onboarding test group**

Run:

```bash
npx vitest run src/features/onboarding src/messages/__tests__/onboardingTranslations.test.ts --reporter=dot
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit integration fixes**

If Task 6 changed files after earlier commits:

```bash
git add src/features/onboarding src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts
git commit -m "fix: wire onboarding edit step copy"
```

If there are no changes, skip this commit.

### Task 7: Final quality gates

**Files:**
- Review all files changed by Tasks 1-6.

- [ ] **Step 1: Run focused tests**

```bash
npx vitest run src/features/onboarding src/messages/__tests__/onboardingTranslations.test.ts --reporter=dot
```

Expected: PASS.

- [ ] **Step 2: Run typecheck and targeted lint**

```bash
npm run typecheck
npx eslint src/features/onboarding src/messages/__tests__/onboardingTranslations.test.ts
```

Expected: both commands exit 0.

- [ ] **Step 3: Inspect status and diff checks**

```bash
git diff --check
git status --short
git log --oneline -8
```

Confirm only the user-owned `src/components/ui/input/Select.tsx` remains unstaged outside committed work.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run --reporter=dot
```

Expected: PASS. Existing jsdom, chart sizing, and React `act` warnings may remain, but no test may fail.

- [ ] **Step 5: Report completion with evidence**

Summarize commits, verification commands, and the remaining unrelated `Select.tsx` unstaged change.
