# Grades Alignment Session 03

## Scope

Align matrix rows 1 (`GET /grades/rules`) and 2 (`GET /grades/rules/effective`) only.

## Pinned backend

- Repository: `https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Commit: `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`
- Local audit checkout: `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit`

## Contract findings and changes

- Both reads require `grades.rules.view`.
- The list accepts optional `academicYearId`/`yearId`, `termId`, `scopeType`, `scopeId`, and `gradeId`, and returns a required `{ items }` wrapper. Each item supplies both year/scope aliases, lower-case API enums, timestamps, and nullable `gradeId`.
- Effective resolution requires `termId` and `scopeType`; an academic-year ID must be supplied through `academicYearId` or `yearId` by the use case. Non-school scopes require either `scopeId` or their matching specific ID; optional ancestry IDs are validated when supplied.
- Effective responses are not list-rule responses: they contain nullable `id`/`ruleId`, upper-case `source`, lower-case rule enums, and required `resolvedFrom` request/resolution metadata without academic-year or timestamp fields.
- The rules service now uses endpoint-specific API DTOs, exposes every optional list-query key instead of positional required year and term arguments, and removes unset effective query keys rather than serializing them as `undefined`.
- The page-facing effective model preserves nullable default-response `id` and `ruleId`; the effective request accepts either `academicYearId` or `yearId` while requiring one at the TypeScript boundary. Its scope is a discriminated union: school requests may omit `scopeId`, while stage, grade, section, and classroom requests require `scopeId` or their matching context ID.

## Files changed

- `src/features/grades/rules/types.ts`
- `src/features/grades/rules/services/gradesRulesService.ts`
- `src/features/grades/rules/services/__tests__/gradesRulesService.test.ts`
- `docs/superpowers/grades-contract-matrix.md` (rows 1-2 only)
- `docs/superpowers/grades-alignment-sessions/session-03.md`

## Verification

- TDD RED: the reviewed focused tests failed because the list boundary treated its query as positional required arguments and the effective mapper changed a default `id: null` to `""`.
- `npm run test:run -- src/features/grades/rules/services/__tests__/gradesRulesService.test.ts`: passed, 4 tests.
- `npm run typecheck`: passed.

## UI states manually verified

None. This session changes API-boundary types and service mapping only; no rendered rules-page behavior changed.

## Matrix update

- Row 1: `fixed`
- Row 2: `fixed`

## Remaining risks

- `fetchScopeGradeRule` in the overview service remains a separate consumer of the effective endpoint. It sends the required context and its narrow UI projection is unchanged; its broader shared API type will be reconciled in the owning overview/gradebook session if needed.
- Create and update response/payload alignment remains assigned to Session 4.

## Prompt for Session 04

Execute Session 4 only in `E:/sis-dashboard`. Read `docs/superpowers/specs/2026-07-11-grades-contract-and-ui-ux-alignment-design.md`, `docs/superpowers/plans/2026-07-11-grades-contract-and-ui-ux-alignment.md` (Global Constraints, Shared Session Protocol, and Session 4), `docs/superpowers/grades-contract-matrix.md`, and this handoff. Confirm `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit` is exactly commit `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`; do not change it. Audit and align only matrix rows 3 (`POST /grades/rules`) and 4 (`PATCH /grades/rules/:ruleId`) against the backend controller, `dto/upsert-grade-rule.dto.ts`, `dto/update-grade-rule.dto.ts`, application helpers/use cases, domain validation, and grade-rule presenter. Inspect `src/features/grades/rules/types.ts`, `src/features/grades/rules/services/gradesRulesService.ts`, rule editor callers, and `src/features/grades/rules/services/__tests__/gradesRulesService.test.ts`. Follow TDD: add a focused failing test asserting the exact route, payload keys, lower-case backend enum casing accepted at the API boundary, optional school/grade scope IDs, pass-mark limits, and returned DTO; observe the expected failure; implement the smallest correction; rerun the focused test and `npm run typecheck`. Preserve the Session 3 effective-read DTO boundary unless a write response genuinely shares it. Update only matrix rows 3-4, create `docs/superpowers/grades-alignment-sessions/session-04.md` with the completion record and a self-contained Session 5 prompt, review scoped production/test/docs changes, run `git diff --check`, and commit only Session 4 files. Do not start Session 5.
