# Grades Alignment Session 02

## Scope

Align the shared Grades contract foundation, with endpoint ownership limited to matrix rows 37 (`GET /grades/bootstrap`) and 38 (`GET /grades/overview`).

## Pinned backend

- Repository: `https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Commit: `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`
- Local audit checkout: `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit`

## Contract findings and changes

- Bootstrap response collections and defaults are required, not optional.
- Localized selector names, term dates, subject codes, sort orders, classroom grade IDs, and default IDs are explicitly nullable.
- Bootstrap enum arrays use the stable backend assessment types, delivery modes, lower-case approval statuses, and supported scope types.
- Bootstrap accepts optional `academicYearId`/`yearId` and `termId`; the frontend service now omits absent selector keys.
- Overview totals and performance counts are required. Assessment rows include subject, type, delivery mode, approval status, weight, max score, and item counts.
- Overview percentage fields, subject/title fields, rule, and empty state retain backend nullability; scope, rounding, source, status, and empty-reason values use stable unions.
- All 21 custom Grades domain codes present at the pinned revision were compared with the frontend map. They were already localized; an exhaustive English/Arabic regression assertion was added so raw server text is never used for those codes.

## Files changed

- `src/features/grades/shared/types.ts`
- `src/features/grades/gradebook/types/api.types.ts`
- `src/features/grades/gradebook/services/gradesGradebookService.ts`
- `src/features/grades/gradebook/types/__tests__/dashboardApiContract.test.ts`
- `src/features/grades/gradebook/services/__tests__/gradesGradebookService.test.ts`
- `src/features/grades/gradebook/utils/__tests__/gradesApiErrors.test.ts`
- `docs/superpowers/grades-contract-matrix.md` (rows 37-38 only)
- `docs/superpowers/grades-alignment-sessions/session-02.md`

## Verification

- TDD RED: the bootstrap service regression failed because absent selectors were serialized as keys with `undefined` values.
- Focused dashboard, mapper, overview, and error tests: passed (recorded during final verification).
- `npm run typecheck`: passed (recorded during final verification).

## UI states manually verified

None. This foundation session changes service/type contracts only and introduces no rendered-state change.

## Matrix update

- Row 37: `fixed`
- Row 38: `fixed`

## Remaining risks

- Shared broad DTOs outside these dashboard boundaries remain assigned to their endpoint sessions and were not tightened preemptively.
- The overview UI intentionally projects only the summary/trend fields it consumes; the complete backend row is preserved at the API boundary for later analytics work.

## Prompt for Session 03

Execute Session 3 only from `docs/superpowers/plans/2026-07-11-grades-contract-and-ui-ux-alignment.md` in `E:/sis-dashboard`. Read the design at `docs/superpowers/specs/2026-07-11-grades-contract-and-ui-ux-alignment-design.md`, the plan's Global Constraints and Shared Session Protocol plus Session 3, `docs/superpowers/grades-contract-matrix.md`, and this Session 2 handoff. Use backend checkout `C:/Users/Ahmed Mostafa/AppData/Local/Temp/moazez-backend-contract-audit` pinned at commit `37a6fd93da4713b6a89eb5e928e2c059e66b1c5f`; do not change the pin. Audit and align matrix rows 1 (`GET /grades/rules`) and 2 (`GET /grades/rules/effective`) only, including query aliases/keys, required scope context, list/response nesting, source and resolution metadata, enum casing, nullability, permissions, errors, frontend service/types/mappers, and affected nonvisual states. Follow TDD: add a focused failing test, observe the expected failure, implement the smallest contract-correct change, and rerun focused tests. Run `npm run typecheck`, update only rows 1-2, create `docs/superpowers/grades-alignment-sessions/session-03.md` with a self-contained Session 4 prompt, self-review production/test/docs changes, preserve unrelated worktree changes, commit only Session 3 files, and do not start Session 4.
