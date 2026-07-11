# Grades Contract and UI/UX Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match every grades frontend workflow to a pinned Moazez Backend contract and improve the affected UI/UX through 30 small, independently verifiable sessions.

**Architecture:** Keep backend DTOs exact at the API boundary, map them into focused UI models, and verify each vertical slice from service through page behavior. A versioned contract matrix records endpoint coverage and a compact handoff file makes every session executable in a fresh context.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, existing `@/lib/api` client and UI components, Vitest, Testing Library, Playwright, ESLint.

## Global Constraints

- Source specification: `docs/superpowers/specs/2026-07-11-grades-contract-and-ui-ux-alignment-design.md`.
- Backend source: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`; Session 1 pins the exact commit.
- Preserve existing application tokens, components, typography, routes, and bilingual conventions.
- Do not change the backend or introduce a visual rebrand.
- Do not absorb unrelated mismatches; record them in the matrix under their assigned session.
- Use exact backend enum casing, required fields, nullability, nested shapes, validation limits, permissions, and domain errors.
- Every session uses TDD for behavior changes and finishes with a focused test, type-check evidence, matrix update, and next-session handoff.
- UI sessions verify English, Arabic, RTL, keyboard focus, light/dark themes, and widths 375, 768, 1024, and 1440 pixels where applicable.
- Preserve unrelated user changes in the working tree and commit only files owned by the current session.

## Shared Session Protocol

Every session after Session 1 performs these steps in order:

- [ ] Read the design, this plan, `docs/superpowers/grades-contract-matrix.md`, and the preceding handoff in `docs/superpowers/grades-alignment-sessions/`.
- [ ] Confirm the backend checkout is at the matrix's pinned commit with `git rev-parse HEAD`; do not silently audit another revision.
- [ ] Inspect the named backend controllers, DTOs, presenters/use cases where response construction matters, and the exact frontend files listed by the task.
- [ ] Update or add a focused test fixture that exactly reflects the backend DTO, then run `npm run test:run -- <test-path>` and confirm the new assertion fails for the intended mismatch or missing UX behavior.
- [ ] Implement the smallest contract-correct or UX-correct change; do not add compatibility fallbacks for shapes the pinned backend never returns.
- [ ] Re-run `npm run test:run -- <test-path>` and confirm PASS.
- [ ] Run `npm run typecheck`; distinguish new failures from documented pre-existing failures.
- [ ] For UI work, run the relevant page and verify required states with the in-app browser; record viewport, locale, direction, theme, keyboard, and outcome.
- [ ] Update only the owned rows in `docs/superpowers/grades-contract-matrix.md` to `matched`, `fixed`, or `blocked`, with exact evidence.
- [ ] Create `docs/superpowers/grades-alignment-sessions/session-NN.md` using the completion-record fields in the design, including a self-contained prompt for Session N+1.
- [ ] Run `git diff --check`, review the scoped diff, and commit with a message describing the verified vertical slice.

---

### Session 1: Endpoint Inventory and Pinned Contract

**Files:**
- Create: `docs/superpowers/grades-contract-matrix.md`
- Create: `docs/superpowers/grades-alignment-sessions/session-01.md`
- Inspect: all backend `src/modules/grades/**/controller/*.ts` and referenced DTO files
- Inspect: `src/features/grades/**/*`, grades routes under `src/app/[lang]/(dashboard)`, `src/hooks/usePermissions.ts`

**Produces:** A pinned backend commit, one matrix row per grades endpoint, frontend consumer paths, assigned session, and initial `not_checked` status.

- [ ] Clone or fetch the backend outside this repository, checkout its current `main`, and record `git rev-parse HEAD`, commit date, and repository URL.
- [ ] Enumerate controller decorators and build matrix columns for method, route, permission, request DTO, response DTO, frontend service/type/mapper/page/test, assigned session, status, evidence, and risk.
- [ ] Cross-check the number of matrix rows against the backend controller methods so no endpoint is omitted.
- [ ] Add the Session 2 prompt and commit the two documentation files.

### Session 2: Shared Contract Foundation

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/shared/types.ts`
- Modify: `src/features/grades/gradebook/utils/gradesApiErrors.ts`
- Test: `src/features/grades/gradebook/utils/__tests__/gradesApiErrors.test.ts`
- Test: relevant mapper/service tests affected by shared types

**Produces:** Exact shared enums, common DTO fragments, nullable fields, and localized error mapping used by later sessions.

- [ ] Add failing type/fixture assertions for every shared mismatch identified by Session 1, including backend-required versus nullable fields.
- [ ] Replace broad `string` or incorrectly optional fields only when the backend contract provides a stable enum or required shape.
- [ ] Add exact backend domain errors to the existing mapping without exposing raw server text.

### Session 3: Rules List and Effective Resolution

**Files:**
- Modify: `src/features/grades/rules/types.ts`
- Modify: `src/features/grades/rules/services/gradesRulesService.ts`
- Test: `src/features/grades/rules/services/__tests__/gradesRulesService.test.ts`

- [ ] Cover `GET /grades/rules` and `GET /grades/rules/effective`, including query keys, required scope context, response nesting, source/resolution metadata, and nullability.
- [ ] Correct the service boundary and mapping while preserving the public UI model expected by rules pages.

### Session 4: Rule Create and Update

**Files:**
- Modify: `src/features/grades/rules/types.ts`
- Modify: `src/features/grades/rules/services/gradesRulesService.ts`
- Test: `src/features/grades/rules/services/__tests__/gradesRulesService.test.ts`

- [ ] Cover `POST /grades/rules` and `PATCH /grades/rules/:ruleId`, asserting exact payload field names, enum casing, optional scope IDs, numerical validation, and returned DTO.
- [ ] Remove frontend-only payload properties and inline casing conversions not accepted by the backend.

### Session 5: Rules List UX

**Files:**
- Modify: `src/features/grades/rules/pages/GradesRulesListPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`

- [ ] Add failing tests for loading, empty, retryable error, effective-source indication, permission-aware actions, and opening a rule.
- [ ] Implement semantic list/table behavior, visible focus, localized states, stable actions, and responsive presentation without changing the design system.

### Session 6: Rule Editor UX

**Files:**
- Modify: `src/features/grades/rules/pages/GradesRulesPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create or modify: focused rule-editor component test near the page

- [ ] Cover create/edit initialization, field validation, server failure with preserved input, saving/disabled state, success navigation, unsaved-change protection, Arabic labels, and keyboard order.
- [ ] Ensure validation constraints match Session 4 rather than duplicating different frontend rules.

### Session 7: Assessment List and Detail

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/assessments/types.ts`
- Modify: `src/features/grades/assessments/services/gradesAssessmentsService.ts`
- Test: `src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts`

- [ ] Cover `GET /grades/assessments` and `GET /grades/assessments/:assessmentId`, including filters, scope fields, titles, status, delivery mode, dates, weights, and nullable scores.
- [ ] Make mapper fixtures exact representations of backend response DTOs.

### Session 8: Assessment Create, Update, and Delete

**Files:**
- Modify: `src/features/grades/assessments/types.ts`
- Modify: `src/features/grades/assessments/utils/assessmentContract.ts`
- Modify: `src/features/grades/assessments/services/gradesAssessmentsService.ts`
- Test: `src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts`
- Test: `src/features/grades/assessments/utils/__tests__/assessmentContract.test.ts`

- [ ] Cover POST, PATCH, and DELETE assessment endpoints with exact score-only versus question-based payload rules and deletion response behavior.
- [ ] Centralize payload construction in the existing contract utility and reject mutually invalid fields before sending.

### Session 9: Assessment Workflow Actions

**Files:**
- Modify: `src/features/grades/assessments/services/gradesAssessmentsService.ts`
- Modify: `src/features/grades/shared/utils/assessmentWorkflow.ts`
- Test: `src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts`
- Test: `src/features/grades/shared/utils/__tests__/assessmentWorkflow.test.ts`

- [ ] Cover publish, approve, and lock routes, permissions, legal source states, returned assessment state, and backend transition errors.
- [ ] Ensure the client state machine permits exactly the transitions supported by the backend.

### Session 10: Assessment List and Workflow UX

**Files:**
- Modify: `src/features/grades/assessments/components/GradesAssessmentsSection.tsx`
- Modify: `src/features/grades/assessments/pages/GradesAssessmentsPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create or modify: focused assessment-list component test

- [ ] Test loading, empty, error/retry, filters, permission-aware actions, pending action state, confirmation, and backend transition failure.
- [ ] Prevent duplicate workflow actions and keep status/action feedback understandable without relying only on color.

### Session 11: Question List and Embedded Question Models

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/assessments/types.ts`
- Modify: `src/features/grades/assessments/services/gradesAssessmentsService.ts`
- Test: `src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts`
- Test: `src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts`

- [ ] Define distinct exact types for full assessment questions and the smaller question summaries embedded in submission detail.
- [ ] Add fixtures proving mappers never read `assessmentId`, metadata, options, answer keys, or timestamps from DTOs that omit them.

### Session 12: Question Create and Update

**Files:**
- Modify: `src/features/grades/assessments/services/gradesAssessmentsService.ts`
- Modify: `src/features/grades/assessments/types.ts`
- Test: `src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts`

- [ ] Cover question create/update routes and exact payloads for prompt, type, points, order, required state, metadata, answer key, and backend validation limits.
- [ ] Keep conversion between UI question names and backend names in one tested mapper.

### Session 13: Options, Ordering, and Question Deletion

**Files:**
- Modify: `src/features/grades/assessments/services/gradesAssessmentsService.ts`
- Modify: `src/features/grades/assessments/types.ts`
- Test: `src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts`

- [ ] Cover option mutation, question/option ordering, answer-key semantics, metadata, and deletion endpoints found in the matrix.
- [ ] Verify MCQ single, MCQ multi, true/false, and free-text cases with backend-valid fixtures.

### Session 14: Question Builder UX

**Files:**
- Modify: `src/features/grades/assessments/components/AssessmentQuestionsBuilder.tsx`
- Modify: `src/features/grades/assessments/components/AssessmentQuestionDesktopLayout.tsx`
- Modify: `src/features/grades/assessments/components/AssessmentQuestionMobileLayout.tsx`
- Modify: `src/features/grades/assessments/components/AssessmentQuestionSettingsPanel.tsx`
- Modify: `src/features/grades/assessments/components/AssessmentQuestionBuilderHeader.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create or modify: focused builder component tests

- [ ] Test validation summaries, question navigation, dirty/saving/error state, reorder keyboard alternative, destructive confirmation, and small-screen editing.
- [ ] Verify total points and required-question feedback are announced and remain correct after reorder/delete failures.

### Session 15: Submission List and Detail

**Files:**
- Modify: `src/features/grades/submissions/types.ts`
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/submissions/services/gradesSubmissionsService.ts`
- Test: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`
- Test: `src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts`

- [ ] Cover submission list filters and detail response with exact required fields, `maxScore` nullability, assessment-summary nullability, embedded questions, answers, selected-option labels, and progress.
- [ ] Replace the incorrect full-question intersection with the exact embedded-question DTO established in Session 11.

### Session 16: Answer Save, Bulk Save, and Submit

**Files:**
- Modify: `src/features/grades/submissions/types.ts`
- Modify: `src/features/grades/submissions/services/gradesSubmissionsService.ts`
- Test: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`

- [ ] Cover single answer PUT, bulk answer PUT, and submission POST with exact payload wrappers, UUID fields, answer variants, response DTOs, bulk limits, and permissions.
- [ ] Add tests for omitted, empty, and null values according to backend validation rather than browser-form assumptions.

### Session 17: Student Answer Entry UX

**Files:**
- Modify: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create: focused submission-page/component tests

- [ ] Test text and choice answers, dirty preservation after failure, per-answer save, bulk save, required progress, confirmation-gated submit, duplicate prevention, and read-only submitted state.
- [ ] Use separately fetched full question definitions only where option content is required; do not assume embedded detail contains options.

### Session 18: Single and Bulk Answer Review

**Files:**
- Modify: `src/features/grades/submissions/types.ts`
- Modify: `src/features/grades/submissions/services/gradesSubmissionsService.ts`
- Test: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`

- [ ] Cover PATCH single review and PUT bulk review, including `answerId`, score bounds, both comment locales, bulk limits, returned counts, and permissions.
- [ ] Keep null comments and zero scores distinct from omitted values.

### Session 19: Review Finalization and Grade Sync

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/submissions/services/gradesSubmissionsService.ts`
- Modify: `src/features/grades/gradebook/services/gradesGradebookService.ts`
- Test: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`
- Test: `src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts`

- [ ] Cover finalize and sync routes, exact response shapes, nullable scores, idempotency fields, legal states, permissions, and domain errors.
- [ ] Verify the gradebook workflow does not call the student submission-resolve permission path when reviewing an existing submission unless the backend explicitly requires it.

### Session 20: Reviewer UX

**Files:**
- Modify: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx`
- Modify: `src/features/grades/gradebook/components/ReviewAssessmentSubmissionDialog.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create or modify: focused review component tests

- [ ] Test score bounds, pending corrections, single/bulk save, preserved edits, finalize availability, sync state, idempotent sync feedback, confirmations, and permission behavior.
- [ ] Ensure keyboard users can move through questions and errors identify the affected answer.

### Session 21: Single and Bulk Grade-Item Entry

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/gradebook/services/gradesGradebookService.ts`
- Modify: `src/features/grades/gradebook/hooks/useGradeItemMutation.ts`
- Modify: `src/features/grades/assessments/components/BulkGradeEntryDialog.tsx`
- Modify: `src/features/grades/gradebook/components/EditGradeDialog.tsx`
- Create or modify: focused service/mutation tests

- [ ] Cover single and bulk item routes, payload wrapper, statuses, nullable score/comment/enrollment fields, limits, permissions, and returned items.
- [ ] Test client-side validation against assessment max score and backend status rules.

### Session 22: Gradebook Roster and Read Model

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/gradebook/services/gradesGradebookService.ts`
- Modify: `src/features/grades/gradebook/utils/gradebookMappers.ts`
- Test: `src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts`

- [ ] Cover gradebook query filters and the complete nested read model with exact nullable virtual/missing rows.
- [ ] Add representative entered, absent, missing, and no-assessment fixtures and remove mapper assumptions absent from backend DTOs.

### Session 23: Gradebook UX

**Files:**
- Modify: `src/features/grades/gradebook/components/GradesGradebookSection.tsx`
- Modify: `src/features/grades/gradebook/hooks/useGradebook.ts`
- Modify: `src/features/grades/gradebook/pages/GradesGradebookPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create or modify: focused gradebook component tests

- [ ] Test loading, empty/error/retry, filters, editable versus virtual cells, keyboard navigation, pending saves, validation, and horizontal overflow.
- [ ] Preserve row/column context on mobile and expose status text independently of color.

### Session 24: Analytics Contracts

**Files:**
- Modify: `src/features/grades/analytics/types.ts`
- Modify: `src/features/grades/analytics/services/gradesAnalyticsService.ts`
- Create: `src/features/grades/analytics/services/__tests__/gradesAnalyticsService.test.ts`

- [ ] Cover summary and distribution routes, query filters, bucket boundaries, counts, nullable aggregates, rule metadata, and empty datasets.
- [ ] Return focused UI models from pure tested mappers rather than casting backend responses.

### Session 25: Analytics UX

**Files:**
- Modify: `src/features/grades/analytics/components/GradesAnalyticsSection.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create or modify: focused analytics component tests

- [ ] Test loading, no assessments, no entered grades, partial data, backend error, retry, and populated charts.
- [ ] Add semantic text/table equivalents for chart values, accessible labels, tooltip keyboard access where supported, and RTL-safe layout.

### Session 26: Student Grade Snapshot Contract

**Files:**
- Modify: `src/features/grades/overview/types.ts`
- Modify: `src/features/grades/overview/services/gradesOverviewService.ts`
- Modify: `src/features/grades/overview/utils/studentGradesSnapshotMapper.ts`
- Test: `src/features/grades/overview/services/__tests__/gradesOverviewService.test.ts`
- Test: `src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`

- [ ] Cover student snapshot route, filters, subject/assessment rows, totals, statuses, rule/source metadata, and nullable scores.
- [ ] Use exact fixtures for students with no grades, partial grades, absence, and completed terms.

### Session 27: Student-Facing Grades UX

**Files:**
- Modify: grades content reached from `src/app/[lang]/(dashboard)/students-guardians/students/[studentId]/grades/page.tsx`
- Modify: `src/features/grades/overview/components/GradesOverviewSection.tsx` where shared
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create or modify: focused student-grades component tests

- [ ] Test empty, partial, completed, and error states; confirm scores, maximums, percentages, statuses, and term context are understandable.
- [ ] Verify mobile hierarchy, Arabic labels, RTL ordering, truncation, and that status/achievement is not color-only.

### Session 28: Permission Audit

**Files:**
- Modify: `src/hooks/usePermissions.ts`
- Modify: affected grades pages/components identified by the matrix
- Create or modify: focused permission-state tests

- [ ] Compare every grades controller permission with the frontend permission key catalog and each action consumer.
- [ ] Test no-permission, view-only, entry, review, approval, and management combinations; hide actions that cannot be discovered and disable actions only when the reason is useful to the user.

### Session 29: Cross-Module UI/UX Verification

**Files:**
- Modify: only grades components/messages with reproduced cross-module defects
- Create: `docs/superpowers/grades-alignment-sessions/session-29.md`
- Test: add focused regression tests beside each corrected component

- [ ] Run grades routes in English and Arabic at 375, 768, 1024, and 1440 pixels in light and dark themes.
- [ ] Verify keyboard focus/order, headings, labels, dialogs, tables, contrast, overflow, logical spacing, reduced motion, loading, empty, error, and permission states.
- [ ] Record screenshots or precise browser evidence for each route and fix only reproducible defects.

### Session 30: Final Contract and Regression Gate

**Files:**
- Modify: `docs/superpowers/grades-contract-matrix.md`
- Create: `docs/superpowers/grades-alignment-sessions/session-30.md`
- Review: all files changed by Sessions 1-29

- [ ] Re-enumerate backend grades controller methods at the pinned commit and reconcile them one-for-one with matrix rows.
- [ ] Run `npm run test:run -- src/features/grades` and record the exact pass/fail totals.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm run ui:audit`, and `npm run build`; fix regressions introduced by this plan without weakening checks.
- [ ] Run the clean-code guard on production-code changes, test-guard on test changes, and docs-guard on the matrix and handoffs.
- [ ] Mark rows `matched` or `fixed` only with evidence; retain reproducible `blocked` rows and residual risks in the final record.
- [ ] Confirm the success criteria in the design and commit the final matrix and closeout record.

## Execution Handoff

Execute one numbered session per fresh Codex context. Session 1 creates the matrix and handoff mechanism; every later session begins from those artifacts and must not depend on conversation history.
