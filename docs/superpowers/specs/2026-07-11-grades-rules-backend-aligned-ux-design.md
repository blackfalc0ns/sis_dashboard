# Grades Rules Backend-Aligned UX Design

## Goal

Make grade-rule management match the backend contract while keeping the workflow clear: users browse the rules that actually exist, edit only writable scopes, and inspect inherited effective rules only when needed.

## List experience

`/grades/rules` is the default page. It lists created rules from `GET /grades/rules` for the active academic year and term. The page provides optional server-supported filters for `scopeType`, `scopeId`, and `gradeId`.

Each row shows the writable scope, pass mark, rounding, and last update. Clicking a row opens its edit route. The page makes one list request per settled filter state and never resolves an effective rule for each row.

## Effective-rule inspector

An on-demand inspector is separate from the list. Users select a hierarchy target (School, Stage, Grade, Section, or Classroom); only after the target is complete does the page call `GET /grades/rules/effective`.

The result shows the applied pass mark, rounding, source (`DEFAULT`, `SCHOOL`, `STAGE`, or `GRADE`), and the resolved hierarchy context returned by the backend. The inspector explains when the displayed rule is inherited.

## Write behavior

The backend permits rule creation and updates only at `SCHOOL` and `GRADE`. The create action and editor enforce this restriction. Stage, Section, and Classroom are valid for inspecting effective behavior but never expose a save action.

## Request policy

- List: one request to `GET /grades/rules` after active context or a settled list filter changes.
- Inspector: one request to `GET /grades/rules/effective` after a complete target changes.
- Hierarchy options: read from the already-loaded grades bootstrap data; no per-selector request.

## Verification

- List filters send only supported backend query parameters.
- The inspector does not request data for incomplete hierarchy targets.
- The inspector sends the selected target and parent IDs consistently.
- Stage, Section, and Classroom never enable rule saving.
