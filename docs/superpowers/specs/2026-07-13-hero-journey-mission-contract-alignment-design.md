# Hero Journey Mission Contract Alignment Design

## Goal

Align the dashboard Hero Journey mission create and edit flows with the supplied `CreateHeroMissionDto` and `HeroMissionObjectiveDto` contract. The dashboard must prevent invalid requests where it has enough information, preserve backend-owned defaults, surface useful validation feedback in English and Arabic, and continue using the existing Hero Journey mission experience.

## Contract source

The supplied endpoint contract is authoritative for this change:

- `POST /reinforcement/hero/missions`
- Permission: `reinforcement.hero.manage`
- Request DTO: `CreateHeroMissionDto`
- Objective DTO: `HeroMissionObjectiveDto`

The dashboard edit flow will apply the same DTO-level constraints to fields that are supplied, while preserving PATCH partial-update semantics and the backend's mission-status restrictions. Existing POST and PATCH routes remain unchanged.

## Design

### Request models

Replace broad string-based payload fields with contract-shaped TypeScript types and separate public create and update request boundaries.

- Objective `type` is limited to `manual`, `lesson`, `quiz`, `assessment`, `task`, or `custom`.
- Nullable request fields explicitly accept `null` where the DTO does.
- Mission and objective text fields retain their documented maximum lengths.
- Create requests accept either `academicYearId` or the `yearId` alias, with at least one required by runtime validation. The normalizer emits one canonical `academicYearId` property and omits `yearId`, preventing conflicting aliases from reaching the backend.
- Objectives are mandatory and non-empty on create. A draft update may omit objectives, but when it replaces objectives it must send a non-empty array.
- Update requests are partial. They validate only supplied properties and retain explicit `null` values where the DTO uses null to clear an existing value.

The existing service functions and routes remain in place. Create continues to POST to `/reinforcement/hero/missions`; edit continues to PATCH the existing mission route.

### Validation and normalization

Introduce two focused public request boundaries that can be tested independently from the modal:

```ts
normalizeCreateHeroMissionRequest(...)
normalizeUpdateHeroMissionRequest(...)
```

They share internal field validators, but they do not share required-field behavior. Create requires academic context, stage, and objectives. Update validates only properties included in the partial request and can compare against the original mission when a cross-field rule depends on the resulting state.

It will enforce:

- At least one of `academicYearId` or `yearId` for create requests
- Required `termId` and `stageId` on create
- At least one non-empty mission title in the effective resulting mission state
- Mission title limits of 255 characters
- Mission brief limits of 2,000 characters
- Linked lesson reference limits of 255 characters
- Integer `requiredLevel` greater than or equal to 1
- Integer `rewardXp` greater than or equal to 0
- Integer mission coordinates when provided
- Integer mission `sortOrder` when provided
- At least one objective on create, and a non-empty array when objectives are supplied on update
- Objective title limits of 255 characters
- Objective subtitle limits of 500 characters
- Objective linked lesson reference limits of 255 characters
- Positive, unique objective `sortOrder` values when supplied
- UUID format for supplied `academicYearId`, `yearId`, `termId`, `stageId`, `subjectId`, mission `linkedAssessmentId`, `badgeRewardId`, and objective `linkedAssessmentId` values
- Runtime membership of objective `type` in the six-value DTO union
- Boolean or `null` objective `isRequired` values when supplied; missing or `null` values normalize to the default `true`
- `null` or plain-object mission and objective `metadata` values when supplied; arrays and primitive values are rejected
- Finite integer numeric values, rejecting values such as `NaN`, `Infinity`, and partially parsed numeric strings

Nullable UUID fields convert blank form values to `null` or omission before UUID validation. Create may omit blank optional text or send `null`. Update distinguishes untouched and explicitly cleared fields: untouched properties are omitted, while a dirty optional text field cleared by the user is sent as `null`. This preserves the backend's PATCH semantics.

Missing objective types normalize to `manual`, and missing `isRequired` values normalize to `true`. Objective ordering mirrors the backend algorithm exactly:

1. Reject supplied orders that are not positive integers.
2. Reject duplicate supplied orders.
3. Sort objectives with explicit orders first in ascending order.
4. Append objectives without orders in their original relative order.
5. Rewrite the final objective orders sequentially as `1, 2, 3...`.

Optional mission defaults are not injected by the dashboard when omitted. This allows the backend to create missions with `requiredLevel: 1`, `rewardXp: 0`, `sortOrder: 0`, and `status: DRAFT` according to its contract.

Reference existence, term-to-year membership, and active-badge validation remain backend responsibilities because the dashboard does not have authoritative state for those rules.

### Form behavior

The existing create/edit modal remains the user interface. No layout redesign is required.

- New objectives default to type `manual` and required status.
- Inputs expose their documented maximum lengths.
- Validation feedback is available in English and Arabic.
- Duplicate or invalid objective orders produce a clear form error before submission.
- The create action remains hidden unless the user has `reinforcement.hero.manage`.
- Create injects the selected academic year and term before validation and submission.
- Edit tracks dirty fields, or derives them by comparing current values with the original mission, so untouched properties are omitted and explicit clears are sent as `null`.
- Draft missions may submit editable mission and objective fields.
- Published missions disable and omit all backend-protected fields: `academicYearId`, `yearId`, `termId`, `stageId`, `subjectId`, `linkedAssessmentId`, `linkedLessonRef`, `requiredLevel`, `rewardXp`, `badgeRewardId`, and `objectives`. Property presence is avoided even when the displayed value is unchanged.
- Archived missions are non-editable and expose no edit action.
- Update validation evaluates the effective title state after applying dirty fields so clearing one localized title cannot leave the mission without either title.
- When the backend rejects a reference or business rule, the UI surfaces the returned API message when it is safe and available, falling back to the existing localized save failure.

### Data flow

1. The modal collects mission and objective values and records which edit fields changed.
2. The create or update normalizer builds the appropriate contract-shaped request using shared field helpers.
3. The page adds academic context for create requests. For edits, it includes only dirty, status-editable properties and preserves explicit clears as `null`.
4. The service sends the normalized payload to the existing POST or PATCH endpoint.
5. Success closes the modal and refreshes missions; failure keeps the form open and displays actionable feedback.

### Tests

Implementation will follow red-green-refactor.

- Contract tests will cover objective type unions and nullable request fields where practical.
- Create-normalizer tests will cover valid bilingual and single-language titles, academic-year aliases and canonical output, UUID formats, omitted defaults, integer bounds, text limits, empty objectives, metadata shapes, objective runtime types and booleans, objective defaults, duplicate orders, missing orders, stable ordering, and sequential normalization.
- Update-normalizer tests will cover partial requests, untouched-field omission, explicit clears, effective-title validation, UUID formats, and rejection of invalid supplied fields without requiring create-only fields.
- Service tests will verify the existing create and edit routes receive the normalized contract payload.
- Form-level tests will cover published protected-field omission, archived edit unavailability, and user-visible validation behavior where component coverage adds value beyond the normalizer tests.
- Relevant Vitest tests, TypeScript typecheck, and ESLint checks for changed files must pass before completion.

## Non-goals

- Changing backend DTOs, routes, permissions, or reference-validation rules
- Redesigning the Hero Journey mission modal
- Adding a new validation dependency
- Changing mission publishing, archiving, deletion, badge management, or list behavior
- Refactoring unrelated Hero Journey work already present in the working tree
