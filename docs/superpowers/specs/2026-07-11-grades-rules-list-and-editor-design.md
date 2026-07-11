# Grades Rules List and Editor Design

## Goal

Make the rules list the entry point for grade rules. Users can review the rules created for the selected academic year and term, create a new rule, or open an existing rule for editing through a direct URL.

## Routes

- `/grades/rules`: list page.
- `/grades/rules/new`: create-rule editor.
- `/grades/rules/:ruleId`: edit-rule editor.

The existing `grades/rules` editor behavior moves to the create/edit routes. Legacy academic grades routes continue redirecting to the list route.

## List page

The page loads rules once for the active academic year and term with `GET /grades/rules`. It presents a clickable table with scope, pass mark, rounding mode, and last-updated timestamp. A create button goes to `/grades/rules/new`.

Clicking a row goes to `/grades/rules/:ruleId`. The list has an empty state and does not request effective-rule resolution for every row.

## Editor page

The editor receives its mode from the route:

- `new` starts a new rule.
- `:ruleId` loads the matching rule from the scoped rules list and edits it.

The scope hierarchy remains available for resolving and viewing effective rules. The backend allows writes only at `SCHOOL` and `GRADE`; the save action is disabled at `STAGE`, `SECTION`, and `CLASSROOM`.

Saving creates or updates through the existing grade-rules service, then returns to the list page.

## Error handling and navigation

- Missing or inaccessible rule IDs show the existing API error treatment and return users to the list.
- The selected academic year and term remain URL-backed and are passed through list and editor navigation.
- Browser back returns from the editor to the list.

## Verification

- List renders fetched rules and does not call effective-rule endpoints per row.
- Create navigation uses `/grades/rules/new`.
- Row navigation uses `/grades/rules/:ruleId`.
- Edit mode loads the selected rule and saves with backend-supported scopes only.
