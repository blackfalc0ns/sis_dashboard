# Bulk Credential Preview Contract Design

## Goal

Display the complete `POST /settings/users/credentials/bulk-preview` response in the credentials bulk-generation modal without losing skipped-user details or backend reason codes.

## Contract

The backend returns aggregate counts in `totalMatched`, `eligible`, and `skipped`, plus a `skippedReasons` count map. Eligible samples are credential user summaries. Skipped samples are objects containing a credential user summary in `user` and a machine-readable reason in `reason`.

The frontend DTO must model these two sample shapes separately. The service mapper flattens both shapes into the modal's view model, marks eligibility explicitly, and copies each skipped item's `reason` into `skipReason`. User identity uses `loginEmail`; the mapper must not depend on a backend `email` field that is not returned.

## Modal Presentation

The preview section shows total matched, eligible, and skipped counts. When skipped reasons exist, it shows a translated summary for each reason and its count. The sampled users remain visible in a scrollable list, and every skipped user shows a translated reason.

Known backend reasons include `already_has_password` and `disabled_user`. Unknown reasons must remain visible through a human-readable fallback instead of disappearing or displaying an untranslated empty value.

The Generate action remains disabled when no preview exists, generation is in progress, or the preview reports zero eligible users.

## State Changes

Changing the scope, selected role, or either inclusion checkbox invalidates the existing preview. The modal must clear the stale preview before allowing generation from the changed selection. Closing and reopening the modal starts without a previous preview or error.

## Alternatives Considered

Displaying aggregate counts only would avoid DTO changes but would hide the backend's actionable explanation for skipped users. Treating eligible and skipped samples as the same DTO is also rejected because it contradicts the backend response and caused the current data loss. Mapping the backend response at the service boundary keeps the modal independent of transport-specific nesting and is the selected approach.

## Verification

Focused tests cover:

- Mapping eligible samples from their direct user-summary shape.
- Mapping skipped samples from `{ user, reason }`, including `loginEmail` and `skipReason`.
- Rendering aggregate counts and translated skipped-reason counts.
- Rendering skipped sample users with translated reasons.
- Preserving unknown reason codes through the fallback label.
- Disabling Generate when `eligible` is zero.
- Clearing a preview after any selection that changes the generation payload.
