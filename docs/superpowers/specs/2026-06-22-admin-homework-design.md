# Admin Homework Assignment Management Design

## Scope

Build the admin/core homework assignment management slice from `docs/homework_api_documentation.md`.

The feature lives at `src/features/academics/homework` and uses these routes:

- `/[lang]/academics/homework`
- `/[lang]/academics/homework/new`
- `/[lang]/academics/homework/[homeworkId]`

The first implementation includes:

- Listing homework assignments with admin filters.
- Creating a draft homework assignment.
- Editing draft assignment metadata.
- Reusing the existing assignment/question builder experience for homework questions.
- Managing assignment questions, options, and assignment attachments.
- Listing and resolving assignment targets.
- Publishing, closing, and cancelling assignments.

The first implementation excludes:

- Teacher app routes under `/teacher/homeworks`.
- Student app routes under `/student/homeworks`.
- Parent app routes under `/parent/children/:studentId/homeworks`.
- Submission review screens.
- Grade sync screens.

## Architecture

Create a self-contained academic sub-feature:

```text
src/features/academics/homework/
  components/
  hooks/
  pages/
  services/
    __tests__/
    homeworkApi.types.ts
    homeworkApiAdapter.ts
    homeworkErrors.ts
    homeworkMappers.ts
    homeworkService.ts
  types/
  utils/
```

The homework feature owns its backend contract. It must not restore the disabled curriculum assignment service functions. The existing curriculum assignment builder is a UI source to reuse, while homework gets its own service, DTO, mapper, and route boundaries.

The service layer follows existing academic feature patterns:

- `homeworkApi.types.ts` defines backend DTOs, enums, request payloads, and paginated envelopes.
- `homeworkApiAdapter.ts` calls the backend with `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`.
- `homeworkMappers.ts` maps backend DTOs to UI models and UI drafts back to backend payloads.
- `homeworkService.ts` exports public feature functions and supports an adapter setter/resetter for tests.
- `homeworkErrors.ts` maps domain error codes to stable UI error keys.

## Routes And Pages

`/[lang]/academics/homework` renders an admin list page guarded by `homework.assignments.view`.

The list page supports these filters where the backend supports them:

- `academicYearId`
- `termId`
- `classroomId`
- `teacherUserId`
- `teacherSubjectAllocationId`
- `status`
- `mode`
- `dueFrom`
- `dueTo`
- `search`
- `page`
- `limit`

The shared academics context bar provides year and term through route query state. The page passes those values into the homework list filter set.

`/[lang]/academics/homework/new` renders a create page guarded by `homework.assignments.manage`.

The create page collects the required backend fields:

- academic year
- term
- teacher subject allocation
- title
- target mode
- due date/time

It also supports useful optional fields at creation time:

- description
- mode
- selected student IDs when target mode requires them
- publish date/time
- estimated minutes
- total marks
- graded flag

After successful creation, it redirects to `/{lang}/academics/homework/{homeworkId}` with the active query context preserved.

`/[lang]/academics/homework/[homeworkId]` renders the builder/edit page guarded by `homework.assignments.view`. Mutating actions require `homework.assignments.manage`; otherwise the page is read-only.

## Builder Reuse

Reuse the existing assignment builder interaction model instead of creating a second question editor from scratch.

The homework builder should use homework-specific hooks:

- `useHomeworkAssignmentData`
- `useHomeworkAssignmentMutations`
- `useHomeworkQuestionDraft`
- `useHomeworkAttachments`
- `useHomeworkTargets`

The hooks adapt homework data into the UI shape expected by the existing builder components. This keeps backend field names and enum casing inside the homework service/mappers, not scattered through UI components.

Required builder capabilities:

- Load assignment details.
- Load questions.
- Load assignment attachments.
- Save assignment metadata.
- Add, update, reorder, and delete questions.
- Add, update, reorder, and delete question options.
- Add, update, reorder, and delete assignment attachments.
- Publish, close, and cancel the assignment.
- Show read-only state for closed academic terms and users without manage permission.

The builder should preserve existing dirty-state and unsaved-change guard behavior where practical.

## Data Flow

List flow:

1. Read year/term from the academics context route state.
2. Combine route filters and local page filters.
3. Call `listHomeworkAssignments`.
4. Render paginated rows with status, mode, teacher/allocation, classroom, due date, question count, attachment count, and counters when present.

Create flow:

1. User fills metadata form.
2. Client validates required fields and obvious numeric/date constraints.
3. Call `createHomeworkAssignment`.
4. Redirect to the edit route for the returned assignment id.

Edit flow:

1. Load assignment detail, questions, attachments, and targets.
2. Keep local assignment and selected-question drafts.
3. Save assignment metadata with `PATCH /homework/assignments/:homeworkId`.
4. Save question changes through the nested homework question endpoints.
5. Save attachment changes through the nested homework attachment endpoints.
6. Resolve targets on demand with `POST /homework/assignments/:homeworkId/targets/resolve`.
7. Publish, close, or cancel through the dedicated action endpoints.

## API Coverage

Implement admin/core endpoints only:

- `GET /homework/assignments`
- `POST /homework/assignments`
- `GET /homework/assignments/:homeworkId`
- `PATCH /homework/assignments/:homeworkId`
- `POST /homework/assignments/:homeworkId/publish`
- `POST /homework/assignments/:homeworkId/close`
- `POST /homework/assignments/:homeworkId/cancel`
- `GET /homework/assignments/:homeworkId/targets`
- `POST /homework/assignments/:homeworkId/targets/resolve`
- `GET /homework/assignments/:homeworkId/questions`
- `POST /homework/assignments/:homeworkId/questions`
- `GET /homework/assignments/:homeworkId/questions/:questionId`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId/reorder`
- `DELETE /homework/assignments/:homeworkId/questions/:questionId`
- `POST /homework/assignments/:homeworkId/questions/:questionId/options`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId/options/:optionId`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId/options/:optionId/reorder`
- `DELETE /homework/assignments/:homeworkId/questions/:questionId/options/:optionId`
- `GET /homework/assignments/:homeworkId/attachments`
- `POST /homework/assignments/:homeworkId/attachments`
- `PATCH /homework/assignments/:homeworkId/attachments/:attachmentId`
- `PATCH /homework/assignments/:homeworkId/attachments/:attachmentId/reorder`
- `DELETE /homework/assignments/:homeworkId/attachments/:attachmentId`

Submission review content endpoints and grade sync endpoints are intentionally deferred.

## Error Handling

The service layer maps the backend error envelope to stable UI error keys. Known homework domain codes include:

- `homework.assignment.not_found`
- `homework.assignment.not_mutable`
- `homework.assignment.not_publishable`
- `homework.assignment.already_published`
- `homework.assignment.already_closed`
- `homework.assignment.cancelled`
- `homework.assignment.schedule_mismatch`
- `homework.assignment.allocation_mismatch`
- `homework.assignment.due_date_invalid`
- `homework.assignment.target_required`
- `homework.assignment.no_eligible_targets`
- `homework.assignment.target_conflict`
- `homework.assignment.validation_failed`

Validation errors should preserve the backend message when a field-level mapping is not available. Unknown errors fall back to a generic load/save/action failure message.

## Permissions

The list route requires `homework.assignments.view`.

The create route requires `homework.assignments.manage`.

The edit route requires `homework.assignments.view`, but all mutation controls are disabled unless the user has `homework.assignments.manage`.

Targets use:

- view: `homework.targets.view`
- resolve: `homework.targets.manage`

Closed academic terms force read-only behavior even when the user has manage permission.

## Testing

Add focused tests for:

- API adapter endpoint paths, methods, params, and payloads.
- Mapper conversions for enum casing, dates, title/description fields, marks, counters, targets, questions, options, and attachments.
- Error mapping for known homework assignment error codes.
- Create flow redirect behavior.
- Edit flow read-only behavior when the term is closed or manage permission is missing.
- Publish guard behavior when the draft has validation problems.

Do not add broad snapshot tests. Prefer deterministic service, mapper, and narrow component/hook tests.

## Implementation Notes

Keep changes scoped to the homework feature, route registration, navigation/sidebar entry if required, translations, and tests.

Avoid refactoring grades or curriculum builder internals unless a minimal prop/interface adjustment is required to reuse them cleanly.

The existing curriculum assignment service functions remain unsupported for curriculum. Homework should use the backend contract documented in `docs/homework_api_documentation.md`.
