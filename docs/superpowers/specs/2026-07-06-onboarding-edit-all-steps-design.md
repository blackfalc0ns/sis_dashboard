# Onboarding Edit Controls for All Setup Steps Design

## Goal

Every onboarding setup step should start with a saved-data summary when the minimum data for that step already exists, and expose an explicit edit action that reveals the existing setup controls. Incomplete steps should open directly in edit mode so the user can continue setup without an extra click.

## Scope

This change applies to the onboarding setup guide steps:

- Academic year + terms
- Academic structure
- Subjects + grade allocations
- Rooms

The Organization / School setup step already follows the target summary/edit pattern and should remain the reference behavior.

## Product behavior

Each completed or partially populated step renders:

- The existing step summary text.
- A saved-data panel describing what has already been configured.
- An `Edit` button.

Clicking `Edit` switches the step into edit mode and shows the same creation/setup controls that already exist today. Clicking `Cancel` leaves edit mode and returns to the saved-data panel without changing local data.

If the step is missing its minimum required data, it opens in edit mode by default:

- Academic year + terms: edit mode when there are no academic years or no terms.
- Academic structure: edit mode when the minimum stage → grade → section chain is incomplete.
- Subjects + grade allocations: edit mode when there are no subjects or no allocations.
- Rooms: edit mode when there are no rooms.

## Important constraint

For these steps, `Edit` means “edit this setup step” by opening the existing management/create controls. It does not introduce full CRUD editing of existing academic years, terms, stages, grades, sections, subjects, allocations, or rooms. Existing dialogs/services are reused as-is unless they already support editing.

This keeps the onboarding flow aligned with the current API surface and avoids expanding the task into a broader academic/settings CRUD feature.

## Step-specific design

### Academic year + terms

Summary mode shows:

- Academic year count.
- Total term count.
- The selected or first academic year name when available.

Edit mode shows the existing `Create academic year` or `Create term` actions and the existing `YearDialog` / `TermDialog`.

### Academic structure

Summary mode shows:

- Stage count.
- Grade count.
- Section count.
- A complete/incomplete status label.

Edit mode shows the existing next-action form for creating the next missing stage, grade, or section.

### Subjects + allocations

Summary mode shows:

- Subject count.
- Allocation count.

Edit mode shows the existing subject creation action when no subjects exist, or the existing grade/subject/weekly-hours allocation form when subjects exist.

### Rooms

Summary mode shows:

- Room count.

Edit mode shows the existing room creation action and `RoomDialog`.

`RoomsSetupStep` must receive the current rooms data instead of only `schoolId`, so it can decide whether to start in summary or edit mode.

## Localization

Add shared onboarding labels for the affected steps:

- `savedData`
- `edit`
- `cancel`

Add step-specific summary labels where needed:

- Academic context selected year label.
- Structure stage/grade/section count labels and incomplete label.
- Subjects subject/allocation count labels.
- Rooms room count label.

English and Arabic locale files must remain key-parity aligned.

## Testing

Focused tests should cover:

- Completed/populated steps render saved-data summary first.
- `Edit` reveals the existing setup controls.
- `Cancel` returns to summary mode.
- Incomplete steps open directly in edit mode.
- Existing create/save behavior still calls the same services and refreshes the correct setup step.
- Localization test continues enforcing English/Arabic onboarding key parity.

## Non-goals

- Full edit/update/delete flows for existing academic records.
- New backend APIs.
- Changing setup completion rules.
- Redesigning the setup guide layout.
