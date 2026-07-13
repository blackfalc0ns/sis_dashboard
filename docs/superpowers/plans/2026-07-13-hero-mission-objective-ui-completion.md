# Hero Mission Objective UI Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Hero Journey mission modal's DTO-backed UI while keeping Grade-dependent lesson loading and removing unrelated scope controls.

**Architecture:** Keep request normalization and dirty-field filtering in the existing contract/service boundary. Simplify the modal's scope state to stage and Grade, retain the existing mission lesson selector, and make each objective card a complete editor for the objective DTO fields. Add localized labels and focused interaction tests without introducing a new form library.

**Tech Stack:** React 19, Next.js 16, TypeScript, next-intl, existing `Select`, `Input`, `TextArea`, `Button`, Vitest, Testing Library.

## Global Constraints

- Preserve `POST /reinforcement/hero/missions` and the existing mission PATCH route.
- Preserve Grade because `fetchCurriculumForScope` requires `academicYearId`, `termId`, `gradeId`, and `subjectId`.
- Remove Section and Classroom controls and stop serializing them into mission metadata.
- Keep published protected fields disabled and keep archived missions non-editable.
- Objective type defaults to `manual`; objective `isRequired` defaults to `true`.
- Preserve explicit blank/null semantics through the existing dirty-field submission contract.
- Do not add a validation or form-management dependency.
- Preserve unrelated staged and unstaged work in the shared working tree.

---

### Task 1: Add failing coverage for the completed objective editor

**Files:**

- Modify: `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`

**Interfaces:**

- Consumes: `HeroJourneyMissionFormModal` and the existing `HeroMissionObjectiveCandidate` form shape.
- Produces: regression coverage for field rendering, defaults, and dirty objective submission.

- [ ] **Step 1: Write failing tests**

Add tests that render a draft mission and assert:

```tsx
expect(screen.getByLabelText("heroJourney.missionForm.labels.objectiveType")).toHaveValue("manual");
expect(screen.getByLabelText("heroJourney.missionForm.labels.objectiveSubtitleEn")).toHaveValue("");
expect(screen.getByLabelText("heroJourney.missionForm.labels.objectiveSubtitleAr")).toHaveValue("");
expect(screen.getByLabelText("heroJourney.missionForm.labels.objectiveLessonRef")).toHaveValue("");
expect(screen.getByLabelText("heroJourney.missionForm.labels.objectiveAssessment")).toBeInTheDocument();
expect(screen.getByLabelText("heroJourney.missionForm.labels.objectiveRequired")).toBeChecked();
```

Add a submission test that changes the objective type to `quiz`, fills a subtitle, and verifies `onSubmit` receives `objectives` marked dirty with those values. Add a create-mode test that confirms Section and Classroom labels are absent while Grade remains present.

- [ ] **Step 2: Run the focused test and confirm red**

Run:

```powershell
npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
```

Expected: FAIL because objective type, subtitles, links, required status, and the removed-scope assertions are not yet represented by the current modal.

---

### Task 2: Simplify mission scope state and add objective controls

**Files:**

- Modify: `src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx`

**Interfaces:**

- Consumes: `HeroMissionObjectiveCandidate`, Grade-based `onLoadLessons`, existing subject and assessment options.
- Produces: a modal that renders all authorable objective DTO fields and only the supported academic scope controls.

- [ ] **Step 1: Remove Section/Classroom form state and controls**

Delete `sectionId`, `classroomId`, their option props/derived options, related reset handlers, assessment scope auto-resolution, and the `academicScope` metadata write. Keep `stageId`, `gradeId`, and Grade-dependent lesson loading. Update the lesson disabled/no-options copy to refer only to Grade and Subject.

- [ ] **Step 2: Add objective state handlers**

Keep objective state as `HeroMissionObjectiveCandidate[]`. Ensure `blankObjective()` returns `type: "manual"`, empty titles/subtitles/links, no sort order, and `isRequired: true`. Extend `updateObjective` to accept type, subtitle, linked references, order, and required changes while marking `objectives` dirty. Add a small helper for objective type options:

```ts
const objectiveTypeOptions = HERO_MISSION_OBJECTIVE_TYPES.map((type) => ({
  value: type,
  label: t(`objectiveTypes.${type}`),
}));
```

- [ ] **Step 3: Render the complete objective card**

Use the existing UI primitives. Each card should contain:

- Type `Select`.
- Title EN/AR `Input` with `maxLength={255}`.
- Subtitle EN/AR `TextArea` with `maxLength={500}`.
- Linked lesson reference `Input` with `maxLength={255}`.
- Linked assessment `Select` using the existing assessment options.
- Positive order `Input`, blank when unset.
- Required native checkbox input, defaulted to checked.
- Remove button with the existing draft/create/published rules.

Do not add a generic metadata JSON editor. Keep all new controls disabled for published missions and keep title/brief/position/sortOrder editable according to the existing status rules.

- [ ] **Step 4: Run the focused test and confirm green**

Run the same Vitest command from Task 1. Expected: PASS.

---

### Task 3: Localize labels and verify the integrated form

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`

**Interfaces:**

- Consumes: the new modal translation keys under `heroJourney.missionForm`.
- Produces: English/Arabic labels and objective-type names with no untranslated keys.

- [ ] **Step 1: Add matching translation keys**

Add labels for objective type, subtitles, lesson reference, assessment, and required status. Add six objective type labels under `objectiveTypes`: manual, lesson, quiz, assessment, task, and custom. Add Arabic equivalents with the same key structure.

- [ ] **Step 2: Extend tests for localized key usage**

Keep the existing mocked translator and assert controls by their translation keys, ensuring the component does not hardcode user-facing English text.

- [ ] **Step 3: Run integrated checks**

Run:

```powershell
npm run test:run -- src/features/hero-journey
npm run typecheck
npm run lint -- src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
```

Expected: all Hero Journey tests pass, TypeScript exits 0, and ESLint reports no findings.

---

## Final Verification

- [ ] Run `git diff --check`.
- [ ] Parse `src/messages/en.json` and `src/messages/ar.json` as JSON.
- [ ] Confirm Section/Classroom no longer appear in the mission modal while Grade remains.
- [ ] Confirm the working tree still contains unrelated user changes and no destructive cleanup was performed.
