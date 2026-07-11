# Grades Contract and UI/UX Alignment Design

## Purpose

Align every grades frontend workflow with the backend contract and improve the affected user experience without requiring one large Codex context. Work is divided into small, independently verifiable sessions so each session can begin with a fresh context and finish with a working checkpoint.

## Scope

The alignment covers:

- Shared grades contracts, enums, errors, permissions, and common entities
- Grade rules
- Assessments and workflow actions
- Questions, options, answer keys, and metadata
- Submissions, answer entry, review, finalization, and grade synchronization
- Grade items and gradebook read models
- Analytics and reporting
- Student-facing grade snapshots
- Cross-module English/Arabic, RTL, accessibility, theme, and responsive behavior

The work includes auditing, implementing contract fixes, adding focused tests, and making UI/UX improvements directly related to the audited behavior. It excludes unrelated refactoring, broad visual redesign, and backend changes unless a backend defect makes the published contract internally inconsistent and the user separately authorizes backend work.

## Recommended Approach

Use vertical slices. Each session owns one endpoint, closely related endpoint pair, mapper, or user interaction from contract inspection through verification. This is preferred over auditing all contracts before UI work or changing the application layer by layer because it keeps context small and leaves the repository usable after every session.

Workstreams run in this order:

1. Shared grades contract foundation
2. Rules
3. Assessments
4. Questions and options
5. Submissions and answer entry
6. Submission review and grade synchronization
7. Gradebook and grade items
8. Analytics and reporting
9. Student-facing grades
10. Cross-module UI/UX and regression verification

## Contract Source of Truth

Session 1 records and pins the exact backend Git commit used by all later sessions. A session must compare the frontend with source code at that commit, including:

- Route and HTTP method
- Required permission
- Path, query, and request-body fields
- Response shape, required fields, nullability, and nested objects
- Enum values and normalization
- Validation limits
- Documented domain and error codes

If the backend advances during execution, the contract matrix must not silently switch revisions. A dedicated follow-up session may update the pinned commit, identify contract changes since the previous revision, and assign any new work.

## Session Structure

Every implementation session follows this sequence:

1. Read the central contract matrix and the previous session handoff.
2. Inspect one backend endpoint or closely related endpoint pair at the pinned commit.
3. Compare the complete contract with frontend types, services, adapters, mappers, permissions, tests, and affected UI.
4. Add or update a focused test that exposes any mismatch.
5. Make the smallest contract-correct implementation change.
6. Review the affected UI states and make only directly related UX improvements.
7. Verify the focused tests, types, and applicable visual states.
8. Update the contract matrix and write the next-session handoff.

A session must not absorb unrelated mismatches. It records them in the matrix under their assigned session.

## Session Catalog

1. Build the grades endpoint inventory and pin the backend commit.
2. Align shared grades enums, nullable fields, error contracts, and common entities.
3. Align grade-rules list and effective-rule resolution.
4. Align grade-rule create and update operations.
5. Review and improve the grade-rules list UX.
6. Review and improve the grade-rule editor UX.
7. Align assessment list and detail contracts.
8. Align assessment create, update, and delete contracts.
9. Align assessment publish, approve, and lock workflows.
10. Improve assessment list, filters, actions, and workflow feedback.
11. Align assessment-question list and detail models.
12. Align question create and update payloads.
13. Align options, answer keys, metadata, ordering, and question deletion.
14. Improve question-builder validation, navigation, and responsive behavior.
15. Align submission list, filtering, and detail responses.
16. Align answer save, bulk save, and submission finalization.
17. Improve student answer-entry states and submission safeguards.
18. Align single and bulk answer-review contracts.
19. Align review finalization and grade-item synchronization.
20. Improve reviewer scoring, pending-correction feedback, and confirmation flows.
21. Align single and bulk grade-item entry.
22. Align gradebook roster and read-model mapping.
23. Improve gradebook editing, validation, keyboard behavior, and responsive tables.
24. Align analytics summary and distribution contracts.
25. Improve analytics empty states, chart semantics, and accessible presentation.
26. Align student grade snapshot and student-facing mappings.
27. Improve student-facing grades clarity and mobile/RTL presentation.
28. Audit permissions and ensure unauthorized actions are hidden or disabled consistently.
29. Run cross-module English/Arabic, RTL, accessibility, light/dark theme, and responsive checks.
30. Run the final contract matrix, regression suite, type-check, and unresolved-risk review.

The implementation plan may split a catalog entry if repository inspection shows that it cannot fit one focused test cycle. It must not combine entries merely to reduce the number of sessions.

## Central Contract Matrix

Session 1 creates a single matrix used across all sessions. Each endpoint row records:

- Workstream and assigned session
- Backend controller and DTO source paths
- Frontend service, type, mapper, test, and page paths
- Route, method, and permission status
- Request and response alignment status
- UI states that consume the response
- Verification commands and result
- Remaining risk or follow-up

Statuses are `not_checked`, `matched`, `fixed`, or `blocked`. A row is only `matched` or `fixed` after focused verification succeeds.

## UI/UX Principles

Preserve the existing application design system, tokens, components, typography, and bilingual conventions. Do not apply an unrelated palette, landing-page pattern, or visual rebrand.

Every affected workflow must account for:

- Loading, empty, error, success, and stale/retry states
- Clear permission behavior for unavailable actions
- Disabled and in-progress states that prevent duplicate actions
- Confirmation for irreversible or consequential actions
- Field-level validation with actionable localized messages
- Visible keyboard focus and logical tab order
- Semantic labels, headings, tables, and status indicators
- Information conveyed by text or icon as well as color
- Stable hover and focus behavior without layout shift
- English and Arabic copy with correct RTL layout and logical spacing
- Responsive behavior at 375, 768, 1024, and 1440 pixels
- Sufficient contrast in light and dark themes
- Reduced-motion preferences for any new motion

UI changes must improve the audited workflow rather than expand the session into a general page redesign.

## Error Handling

Continue using the existing API client and grades error-mapping infrastructure. Prefer localized domain-error mappings over raw backend messages. Each session checks that validation errors, permission failures, missing resources, invalid workflow transitions, and retryable failures produce an understandable user state.

Unexpected mismatches outside the session scope are recorded in the central matrix. If a mismatch prevents safe progress, the session stops with a reproducible blocker and names the backend contract evidence needed to resolve it.

## Testing and Verification

Contract and service sessions require focused tests plus TypeScript verification. Tests should assert the exact route, HTTP method, parameters or payload, and the response behavior relied upon by the frontend.

Mapper sessions require representative backend fixtures with nullable and nested fields matching the pinned DTO. They must reject assumptions about fields the backend does not return.

UI sessions verify, where applicable:

- Loading, empty, error, success, disabled, and permission states
- Keyboard operation and visible focus
- English and Arabic rendering
- RTL alignment and truncation
- Mobile, tablet, desktop, and wide-desktop layouts
- Light and dark themes
- Duplicate-action prevention and confirmation behavior

The final session reconciles every backend grades endpoint with the matrix, runs the full relevant test suite, TypeScript checking, linting, and a production build when practical, and records unresolved risks without claiming complete alignment for unverified rows.

## Session Completion Record

Each session ends with a compact record containing:

- Session number and scope
- Pinned backend commit
- Endpoints and permissions verified
- Files changed
- Tests and checks run with results
- UI states manually verified
- Contract-matrix rows updated
- Remaining risks
- A self-contained prompt for the next session

The next-session prompt must identify exact source paths and objectives so the next Codex context does not depend on conversation history.

## Success Criteria

The project is complete when:

- Every grades endpoint at the pinned backend commit appears in the contract matrix.
- Every matrix row is `matched` or `fixed`, or is explicitly documented as blocked with reproducible evidence.
- Frontend response types and mappers do not require fields absent from backend DTOs.
- Request payloads, filters, enums, permissions, and workflow actions match the backend.
- Focused and full grades tests pass.
- TypeScript, lint, and the production build pass, subject to documented pre-existing failures.
- Core grades workflows provide usable localized states in English and Arabic.
- The reviewed interfaces are keyboard accessible, RTL-safe, theme-safe, and responsive at the required widths.
- The final record identifies any residual risk without overstating verification.
