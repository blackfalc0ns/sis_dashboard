# Grades Alignment Session 04

## Scope

Align matrix rows 3 (`POST /grades/rules`) and 4 (`PATCH /grades/rules/:ruleId`) only.

## Pinned backend

- Repository: `https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Commit: `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`
- Local audit checkout: `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit`

## Contract findings and changes

- Both writes require `grades.rules.manage`.
- POST is an upsert. It requires `termId`, `scopeType`, and one academic-year alias (`academicYearId` or `yearId`); it accepts optional `scopeId`, `gradeId`, `gradingScale`, and `rounding`. Only school and grade scopes are writable. Grade scope accepts either ID alias, while school scope derives its scope key from the caller's school.
- PATCH validates the UUID route parameter and accepts any subset of `passMark`, `gradingScale`, and `rounding`; it does not accept scope or academic-context fields.
- The backend permits a numeric pass mark from 0 to 100 inclusive with no more than two decimal places. Both DTOs normalize accepted enum input and present the full response with lower-case `percentage`, `none`, `decimal_0`, `decimal_1`, or `decimal_2` values.
- The frontend now models either academic-year alias and the school/grade write scope rules, allows partial updates, validates pass-mark bounds/precision before sending, centralizes lower-case API enum conversion, and maps the full presenter response. The editor no longer supplies `undefined` or ignored school-scope identifiers.

## Files changed

- `src/features/grades/rules/types.ts`
- `src/features/grades/rules/services/gradesRulesService.ts`
- `src/features/grades/rules/services/__tests__/gradesRulesService.test.ts`
- `src/features/grades/rules/pages/GradesRulesPage.tsx`
- `docs/superpowers/grades-contract-matrix.md` (rows 3–4 only)
- `docs/superpowers/grades-alignment-sessions/session-04.md`

## Verification

- TDD RED: the focused service test failed because POST/PATCH sent upper-case UI enums and invalid pass marks were sent to the API.
- `npm run test:run -- src/features/grades/rules/services/__tests__/gradesRulesService.test.ts`: passed, 11 tests.
- `npm run typecheck`: passed.

## UI states manually verified

None. The editor change is payload construction only; Session 6 owns rule-editor UX verification.

## Matrix update

- Row 3: `fixed`
- Row 4: `fixed`

## Remaining risks

- Backend error rendering for UUID, permission, closed-term, not-found, conflict, and validation domain responses continues through the existing grades API error mapper. Session 6 owns editor-level error-state and localized validation verification.
- Create semantics upsert the rule selected by the backend's unique school/year/term/scope key. The UI currently opens a separate editor route and does not surface whether a save created or updated the existing rule; this is a Session 6 UX consideration.

## Prompt for Session 05

Execute Session 5 only in `E:/sis-dashboard`. Read `docs/superpowers/specs/2026-07-11-grades-contract-and-ui-ux-alignment-design.md`, `docs/superpowers/plans/2026-07-11-grades-contract-and-ui-ux-alignment.md` (Global Constraints, Shared Session Protocol, and Session 5), `docs/superpowers/grades-contract-matrix.md`, and this handoff. Confirm `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit` remains exactly commit `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`; do not change it. Work only on the rule-list UX for `src/features/grades/rules/pages/GradesRulesListPage.tsx`, its focused test, and required English/Arabic message keys. Audit the existing service behavior from Sessions 3–4 but do not alter contract rows 1–4 unless a newly reproducible regression requires it. Follow TDD: add failing user-facing tests for loading, empty, retryable error, effective-source indication, permission-aware actions, and opening a rule; then make the smallest design-system-consistent implementation. Verify English/Arabic, RTL, keyboard focus, light/dark themes, and widths 375, 768, 1024, and 1440 using the in-app browser. Run focused tests and `npm run typecheck`, update only the Session 5 matrix evidence if applicable, write `session-05.md` with a self-contained Session 6 prompt, run `git diff --check`, self-review scoped changes, and commit only Session 5 files. Do not begin Session 6.
