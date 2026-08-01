# Timetable Frontend Safety Design

**Backend authority:** `Moazez-Backend` commit `d86b8a13a752da66528a90e72563e8e464819f8e`

## Goal

Make the `sis-dashboard` timetable workflow safe and contract-accurate without
changing the backend. The frontend must avoid requests that the current API
cannot safely scope or represent, prevent silent data loss, and display backend
validation results accurately.

## Scope

This is a frontend-only change. It covers the timetable hook, API contracts and
normalizers, timetable configuration dialogs, feedback, and focused tests.

It does not alter backend publication enforcement or make the non-transactional
delete-plus-bulk-save API atomic. The UI instead prevents avoidable unsafe
requests and retains backend refresh/reconciliation after mutations.

## Workflow Safety

### Scope-aware unpublish

The backend unpublish DTO accepts a term with optional grade and classroom IDs;
it has no `sectionId`. A section config is stored under its parent grade, so an
unpublish request from a section scope could unpublish the grade.

The frontend will disable Unpublish when the resolved timetable scope is
`SECTION`. Its explanation states that the current API cannot unpublish only a
section. School, grade, and classroom scopes retain their existing unpublish
workflow.

### Draft mapping and save

Before save or publish, draft entries are converted to backend entries. If any
entry lacks a resolvable classroom, instructional period, or teacher, the
operation stops before it sends a mutation. The error identifies the invalid
slots. The operation must never submit only the valid subset and report a
successful partial save.

Client-side conflict checks run against entries remaining after explicitly
deleted entries are removed. Moving an entry therefore cannot be falsely
blocked by its previous slot.

### Publish preflight

The publish confirmation reuses the validation response that opened the
confirmation. The publish hook receives that normalized validation summary and
does not issue a duplicate validation request. Publication readiness remains
fetched from the backend immediately before publishing, and the post-mutation
refresh remains a resilience fallback.

## Contract Fidelity and Feedback

The frontend models validation, conflict, publication, and mutation responses
to their actual backend DTOs. Validation presentation preserves backend conflict
categories, including teacher, classroom, room, duplicate, allocation, and
weekly-hours issues; it must not mislabel a classroom conflict as a teacher
conflict.

The API adapter returns typed publish and unpublish responses. UI feedback uses
those results where available and retains existing refetches to reconcile
server state.

The backend bulk endpoint accepts at most 1,000 entries. A larger request is
rejected in the UI with an actionable error before it is sent.

Errors are distinguished as:

- invalid or unmappable draft data;
- client-detected conflict;
- backend validation or publication-readiness failure; and
- unsupported section-level unpublish.

## Configuration Safety

Changing active days is blocked if timetable entries exist on a day being
removed. Users must move or delete those entries first, preventing them from
being hidden from the timetable grid and later rejected by publication checks.

Changing a period to non-instructional is blocked while timetable entries use
that period. This prevents a formerly valid entry from being omitted by the
instructional-period save mapper.

These checks are focused on the timetable entries governed by the relevant
configuration. No unrelated configuration refactor is included.

## Architecture

Existing boundaries remain in place:

1. API types mirror backend DTOs.
2. The API adapter owns HTTP paths, parameters, and response normalization.
3. The validation summary normalizer is a pure mapping from backend results to
   UI buckets.
4. `useTimetableData` owns scope-aware action guards, draft conversion,
   client-conflict checking, mutations, and reconciliation.
5. Timetable configuration dialogs own pre-mutation safety checks and explain
   blocked changes.
6. View components render action availability and feedback; they do not invent
   business rules.

## Testing and Verification

Regression tests cover:

- disabled Unpublish for section scope;
- no save or publish request when any draft entry cannot map to API data;
- no false conflict after a previous entry is marked for deletion;
- correct conflict-category normalization;
- blocked removal of active days and conversion of used periods to
  non-instructional;
- blocked bulk saves over 1,000 entries; and
- one validation request per publish confirmation.

Verification runs the timetable test suite, TypeScript checking, lint for
touched files, and the production build.

## Non-goals

- Changing `Moazez-Backend` contracts or adding endpoints.
- Claiming client-side atomicity for backend mutations.
- Enabling section unpublish through a grade-wide destructive action.
- Refactoring unrelated lesson-plan, navigation, teacher, or profile-correction
  features.
