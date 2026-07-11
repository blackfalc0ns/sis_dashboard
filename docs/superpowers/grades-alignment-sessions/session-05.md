# Grades Alignment Session 05

## Scope

Improve the grade-rules list UX only. Matrix rows 1-2 remain `fixed`; this session does not change their request or response contract evidence.

## Pinned backend

- Repository: `https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Commit: `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`
- Local audit checkout: `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit`

## Changes

- Added an announced loading state, localized empty state, and an in-page retry action for list or effective-rule loading failures.
- Fetch and display the backend-resolved effective-rule source when a school or grade scope is selected.
- Hide create and row-opening management actions without `grades.rules.manage`; retain the shared table's semantic, keyboard-focusable row behavior for authorized users.
- Added English and Arabic messages for all new list states.

## Files changed

- `src/features/grades/rules/pages/GradesRulesListPage.tsx`
- `src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`
- `docs/superpowers/grades-alignment-sessions/session-05.md`

## Verification

- TDD RED: the focused component test failed for the missing effective-source, loading, empty, retry, and permission-aware states.
- `npm run test:run -- src/features/grades/rules/pages/__tests__/GradesRulesListPage.test.tsx`: passed, 6 tests.
- `npm run typecheck`: passed.

## UI verification

- Component tests verify loading, empty, retry, effective source, management permission, and rule opening states.
- The in-app browser connector was not available to this session, so manual English/Arabic RTL, theme, keyboard, and 375/768/1024/1440 viewport checks were not performed. The page preserves the existing responsive `DataTable`, focusable-row, and design-system patterns; Session 30 should include this manual check.

## Remaining risks

- A failure resolving the effective rule uses the same retry state as a list failure, because both responses are required to render a trustworthy scoped result.
- Session 6 owns rule-editor loading, validation, save, and server-error UX.

## Prompt for Session 06

Execute Session 6 only in `E:/sis-dashboard`. Read `docs/superpowers/specs/2026-07-11-grades-contract-and-ui-ux-alignment-design.md`, `docs/superpowers/plans/2026-07-11-grades-contract-and-ui-ux-alignment.md` (Global Constraints, Shared Session Protocol, and Session 6), `docs/superpowers/grades-contract-matrix.md`, and this handoff. Confirm `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit` remains exactly commit `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`; do not change it. Work only on `src/features/grades/rules/pages/GradesRulesPage.tsx`, its focused component test, and required English/Arabic message keys. Preserve Sessions 3-5 contract and list UX behavior. Follow TDD for create/edit initialization, pass-mark validation including two decimal places, server failure with input preservation, saving/disabled behavior, success navigation, unsaved-change protection, Arabic labels, and keyboard order. Use existing design-system components and permission behavior; do not begin Session 7. Run focused tests and `npm run typecheck`, update only applicable matrix evidence, write `session-06.md` with a self-contained Session 7 prompt, self-review, run `git diff --check`, and commit only Session 6 files.
