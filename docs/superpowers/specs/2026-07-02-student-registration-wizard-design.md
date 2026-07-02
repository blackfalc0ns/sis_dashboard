# Student Registration Wizard Design

## Objective

Replace the current four-column registration form with a five-step wizard that matches the backend registration contract, supports multiple guardians, requires an account for the student and every guardian, and replaces raw identifiers with searchable selectors.

## Confirmed scope

- Steps: Student, Guardians, Accounts, Enrollment, Review.
- Support multiple guardians and exactly one primary guardian.
- Support new guardian profiles and linking existing guardian profiles.
- Require every student and guardian to either create a user account or link an existing user account.
- Preserve the existing non-atomic flow when an existing guardian profile is selected.
- Support Arabic RTL and English LTR layouts.
- Keep the visual language consistent with the existing light dashboard UI.

## Verified backend contract

The atomic path is `POST /students-guardians/registrations`. It accepts `student`, a non-empty `guardians` array, `enrollment`, and optional `studentAccount`.

Each new guardian entry contains:

- `profile`
- optional `relationship.is_primary`
- an `account` object in this frontend because account creation or linking is required by the product design

An account uses mode `create` or `link`. Create mode requires `username`; link mode requires a UUID `userId`. The UI does not expose backend mode `none` because accounts are mandatory in this workflow.

Enrollment requires UUID `classroomId` and ISO `enrollmentDate`. The use case additionally requires an academic year through `academicYearId` or `academicYear`; the UI will submit `academicYearId`. Optional `termId`, `gradeId`, and `sectionId` are submitted when selected and must agree with their parent records. Only status `active` is accepted.

The atomic response contains `registrationId`, `student`, `guardians`, `enrollment`, `parentAccounts`, `studentAccount`, `warnings`, `createdAt`, and `completedAt`.

## Contract gaps in the current frontend

- The form does not collect `academicYearId`, although the backend use case requires an academic year.
- The form accepts raw `classroomId` and existing guardian IDs rather than selecting fetched entities.
- The state and mapper model one guardian instead of the backend `guardians[]` capability.
- Student and guardian account payloads are absent.
- The response mapper looks for singular `guardian` and incompatible account properties instead of `guardians`, `parentAccounts`, and `studentAccount`.
- Client validation does not mirror backend UUID, email, phone, maximum-length, date, and account-mode constraints.
- The current layout presents four simultaneous columns rather than a sequential wizard and is too dense for the expanded contract.

## Architecture

The route page remains a thin entry point. A registration feature component owns wizard state and composes focused step components. Types distinguish new and existing guardian rows and create and link account modes, preventing fields from invalid modes from entering payload mappers.

Suggested boundaries:

- Wizard shell: navigation, step state, submission lifecycle, and result display.
- Student step: student identity and contact fields.
- Guardians step: repeatable guardian cards, guardian lookup, and primary selection.
- Accounts step: mandatory account configuration for the student and every guardian.
- Enrollment step: dependent academic-structure selectors.
- Review step: summaries, edit navigation, atomicity warning, and submission.
- Validation: step-scoped rules and field-addressable errors.
- Mappers: atomic backend DTO, staged-flow DTOs, and response normalization.
- Services: registration submission plus guardian, user, and academic-structure search adapters.

## Data flow

### New guardians only

The wizard maps all new guardians, their required account choices, the required student account, student data, and enrollment into one atomic registration request.

### One or more existing guardians

The staged path remains non-atomic:

1. Create the student.
2. Create any new guardian profiles and link all selected existing guardians.
3. Create or link the required accounts.
4. Create the enrollment.

The review screen labels this path as multi-stage before submission. Execution records each completed stage. If a later stage fails, the UI reports the created student and completed links and provides a direct link to the student profile; it must not automatically repeat student creation.

## Interaction design

The wizard uses a light card surface with a step indicator showing current, complete, and invalid states. Forms use one primary column and expand related fields to two columns on wide screens. Previous and Next controls remain in a consistent footer; Submit appears only on Review.

### Student

Collect English and Arabic names, date of birth, gender, nationality, address, city, district, student phone, and student email. Required and optional labels reflect backend and product rules rather than relying on placeholders.

### Guardians

Each guardian is a removable card with a New or Existing mode. New mode exposes the supported profile fields. Existing mode provides a debounced searchable dropdown using fetched guardians and displays identifying name, relation, phone, and email instead of a UUID. The user can add guardians, cannot remove the last guardian, and must designate exactly one primary guardian.

### Accounts

Display one account card for the student and one for every guardian. Each requires Create account or Link existing account:

- Create exposes username, contact email, password-generation controls, and optional role selection where supported.
- Link provides a searchable user selector and stores its UUID.

For an existing guardian already associated with a user, the linked account is selected and shown by default, subject to the data exposed by the guardian response.

### Enrollment

Use dependent selectors in this order: academic year, term, grade, section, classroom. A child selector is disabled until its parent is selected and resets when its parent changes. Each selector has loading, empty, and retry states. Enrollment date defaults to today and status remains active.

### Review and result

Review groups values by step, provides Edit actions, identifies atomic versus staged submission, and hides raw UUIDs when a display label exists. The success view shows the registration, student, guardians, enrollment, account statuses, warnings, and any backend-returned temporary credentials. Temporary credentials are presented as sensitive one-time information.

## Validation and errors

- Validate a step before forward navigation and validate fields on blur.
- Show field-level errors and a concise step summary; move focus to the first invalid field.
- Enforce a non-empty guardian collection and exactly one primary guardian.
- Enforce create or link account configuration for the student and every guardian.
- Mirror backend email, phone, UUID, maximum-length, ISO-date, and active-enrollment constraints.
- Map backend field metadata to the corresponding input when present; otherwise show a form-level error.
- Disable duplicate submission while preserving entered data.
- For staged failures, show per-stage state and recovery context rather than a generic registration failure.

## Accessibility and responsive behavior

- Associate every input with a visible label and error description.
- Make step navigation, repeatable cards, and searchable dropdowns keyboard operable.
- Use visible focus treatment and do not rely on color alone for state.
- Announce validation and asynchronous results through appropriate live regions.
- Support RTL and LTR ordering without changing the logical step sequence.
- Verify layouts at 375, 768, 1024, and 1440 pixels with no horizontal scrolling.

## Testing

- Mapper tests for the complete atomic request and backend response shape.
- Validation tests for each step, exactly one primary guardian, and mandatory account choices.
- Service tests for atomic registration and staged existing-guardian registration.
- Component tests for guardian and user search, selection, removal, and empty/error states.
- Component tests for dependent academic selectors and child resets.
- Submission tests for success, backend validation, duplicate-submit prevention, and every partial-failure stage.
- Keyboard, focus, RTL, and representative mobile-layout checks.
- Run the relevant unit tests and project type-check after implementation.

## Out of scope

- Changing the backend atomic endpoint to accept existing guardian profile IDs.
- Backend rollback or resume APIs for staged registration.
- Changing permissions required by the backend registration endpoint.
- Redesigning unrelated student or guardian profile pages.
