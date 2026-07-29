# Email Backend Contract and Workflow Alignment Design

## Goal

Align every Settings email frontend contract and workflow with the Moazez
backend email module at commit
`2f87a155cf27f2186cfd7746026562ef18cb4f71`.

The implementation must fix the audited response-shape mismatches, prevent
delivery creation from using an audience different from the last successful
preview, expose only the currently supported SMTP provider, and handle every
known backend email error through safe localized guidance.

## Scope

This design covers:

- Email connection configuration, testing, activation, and disabling.
- Email template DTO completeness and preview/update/reset errors.
- Credential-delivery recipient preview and queued batch creation.
- Delivery batch listing, detail, recipient listing, and cancellation.
- General campaign recipient preview, content preview, creation, list, and
  detail.
- Shared Settings workflow error classification and presentation used by these
  email surfaces.
- Focused unit and component tests for the corrected contracts and workflows.

Existing uncommitted credential-delivery work for selected-user initialization
and structured Settings workflow errors must be preserved and integrated.

## Non-Goals

- Backend changes.
- New email providers or provider runtimes.
- Sending test messages; the current backend test performs configuration
  validation.
- Redesigning email page layouts.
- Changing granular email permissions.
- Refactoring unrelated Settings, Communication, or Nedaa features.

## Architecture

### API DTO boundary

Types used at the HTTP boundary must mirror the backend exactly. This includes
backend names, nullability, metadata, and full response shapes such as:

- `configured`, nullable connection fields, `lastTestedAt`, and `verifiedAt`.
- `subjectSnapshot`, lifecycle timestamps, and `deliveryMode` on batches.
- `toEmail` and `reason` on recipient-preview samples.
- The full delivery batch returned by cancellation.
- Template `id`, `customized`, `createdAt`, and preview metadata.

Components must not consume API DTOs directly when the UI needs different
names or derived values.

### UI models and mappers

Service-layer mappers translate API DTOs into stable UI models:

- The connection mapper represents an unconfigured connection without
  pretending nullable fields are present.
- The existing delivery batch mapper is shared by deliveries and campaigns.
- The recipient-preview mapper converts `toEmail` to the UI recipient address,
  converts `reason` to the UI skip reason, and derives eligibility from the
  sample collection.
- The cancellation service maps the backend's full batch response rather than
  declaring a nonexistent `cancelledCount` response contract.

Mapping logic is tested independently with representative backend payloads.

## Email Connection Workflow

The provider selector exposes SMTP only. SendGrid, Mailgun, SES, and Custom are
not shown because the backend currently rejects them even though they remain
members of its broader provider enum.

Fetching the connection maps the backend object whether `configured` is true or
false. Loading or request failure remains separate from the backend's
unconfigured state.

Updating, activating, and disabling replace the current connection with the
mapped full response.

A successful connection test also replaces the current connection with the
mapped full response. This immediately reflects `VERIFIED`, `lastTestedAt`,
`verifiedAt`, and cleared failure state.

When testing fails, the frontend re-fetches the connection after capturing the
operation error. The backend records `FAILED`, `lastTestedAt`, and
`failureReason` before returning the error, so the refreshed status card must
show that authoritative state while the structured operation error remains
visible.

## Preview Integrity

### Canonical payloads

Credential delivery and campaign audience workflows each define one canonical
recipient-preview payload builder. Preview calls, preview fingerprints, and
create calls derive recipient selection from this same representation.

Canonicalization must:

- Remove absent optional fields rather than serialize inconsistent empty
  values.
- Preserve array order when order is meaningful.
- Sort and deduplicate set-like values such as selected user IDs, role keys,
  user types, and custom email addresses before fingerprinting.
- Normalize custom emails consistently with the existing campaign input rules.

The fingerprint is a deterministic serialization of the canonical preview
payload. It is stored only after a successful preview.

### Credential deliveries

The canonical preview payload includes scope, selected IDs, role keys, user
types, contact-email requirements, disabled-user behavior, login-email
fallback, preview limit, and password-inclusion behavior.

For `REGENERATE_TEMPORARY_PASSWORD`,
`includeUsersWithPassword` is always true in preview and create selection.
For other modes it is false unless a present-day workflow explicitly requires
otherwise.

Credential mode is included in the local fingerprint even though the backend
preview DTO does not accept it, because changing mode changes the safety meaning
of the preview and changes password-inclusion behavior for regeneration.

Create is enabled only when:

- A preview succeeded.
- At least one recipient is eligible.
- The current canonical payload fingerprint matches the last successful
  preview fingerprint.
- The user holds the manage permission.
- No batch has already been created from the current wizard state.

### Campaigns

The canonical campaign recipient payload includes scope, selected IDs, role
keys, user types, custom emails, contact-email requirements, disabled-user
behavior, login-email fallback, and preview limit.

Campaign content preview remains independent from recipient preview because it
does not authorize an audience. Campaign creation still validates subject,
body, and forbidden credential variables at the client boundary.

Create is enabled only when the current canonical recipient payload matches the
last successful recipient-preview fingerprint and the user holds the manage
permission.

### Stale preview behavior

Changing a preview-sensitive field immediately clears the prior recipient
preview and its fingerprint, then disables create until a new preview succeeds.

A failed preview never records a valid fingerprint. A failed create retains a
still-matching preview so the operator can retry without repeating a successful
preview.

## Delivery and Campaign Reads

Campaign list and detail responses pass through the same delivery batch mapper
as general delivery reads. `subjectSnapshot` becomes the UI `subject`, and
derived fields such as `cancellable` and `cancelledCount` use the same rules on
both surfaces.

Delivery recipient mapping continues to translate `toEmail`, `displayName`,
`skippedReason`, and timestamps into the current table model.

Cancellation consumes and maps the full `DeliveryBatchSummaryDto`. The detail
page uses that response or refreshes authoritative data; it does not depend on a
nonexistent backend `cancelledCount` field.

## Backend Error Handling

### Normalized error model

All email pages use the shared Settings workflow error model. It is extended
only with categories and structured details needed by current backend errors.
The normalized model carries these details when supplied by the backend:

- `traceId`.
- Field validation errors.
- A safe failure `reason`.
- Recipient `count` and `limit`.
- Delivery batch `status`.
- Template or campaign variable lists.

Raw backend messages are never shown to end users. Known codes receive
localized English and Arabic messages. Unknown codes receive a safe localized
generic message and `traceId` when available.

### Known email codes

The classifier must explicitly cover:

- `settings.email.connection_missing`
- `settings.email.connection_not_verified`
- `settings.email.connection_test_failed`
- `settings.email.secret_encryption_failed`
- `settings.email.template_invalid`
- `settings.email.delivery_connection_inactive`
- `settings.email.delivery_template_missing`
- `settings.email.delivery_no_recipients`
- `settings.email.delivery_batch_not_found`
- `settings.email.delivery_batch_not_cancelable`
- `settings.email.delivery_too_many_recipients`
- `settings.email.delivery_send_failed`
- `settings.email.campaign_invalid`
- `settings.email.campaign_credential_variables_forbidden`

Shared handling must also cover:

- `validation.failed`, including field-level errors.
- HTTP 401 and 403 permission/session failures.
- HTTP 404, 409, and 422 errors not already identified by code.
- HTTP 429 throttling.
- Network failures, request-setup failures, and HTTP 5xx responses.
- Unknown error codes and non-API exceptions.

### Recovery guidance

Where recovery is deterministic, the structured alert provides an action:

- Open Email Connection for missing, inactive, or unverified connection errors.
- Open Email Templates for missing or inactive delivery templates.
- Re-preview after recipient eligibility or audience changes.
- Correct highlighted fields for validation errors.
- Refresh when a batch no longer exists or its status changed.
- Retry transient network, throttling, send, or server failures.

Success feedback remains in toasts. Operation failures use the structured alert
so details, recovery actions, and trace IDs remain visible.

## State and Concurrency

Each async operation keeps its existing independent loading state. Repeated
submissions remain disabled while the same operation is pending.

Only the latest successful preview for the current canonical payload can
authorize creation. A late response for an older payload must not replace the
fingerprint for newer values. Before committing preview state, the response's
captured fingerprint is compared with the current canonical payload.

Authoritative reads after mutations replace local state rather than merging
partial assumptions.

## Testing

Implementation follows test-driven development with focused tests for:

- Exact connection DTO mapping, including `configured: false` and nullable
  fields.
- Successful connection tests replacing status and timestamps.
- Failed connection tests refreshing backend-recorded failure state.
- SMTP being the only selectable provider.
- Template DTO metadata and preview response completeness.
- Credential preview mapping from `toEmail` and `reason`.
- Regeneration preview setting `includeUsersWithPassword: true`.
- Credential and campaign canonical payload normalization.
- Matching preview fingerprints enabling create.
- Audience-sensitive changes disabling create until re-preview.
- Late preview responses not authorizing a newer payload.
- Campaign list and detail mapping from `subjectSnapshot`.
- Cancellation mapping the full backend batch response.
- Every known backend email error code mapping to the intended localized
  category, details, and recovery action.
- Unknown, validation, permission, throttling, network, and server error
  fallbacks.
- Preservation of selected-user credential initialization and existing shared
  workflow-error behavior.

Verification runs:

1. Focused Vitest suites for changed services, utilities, pages, and
   components.
2. TypeScript typecheck.
3. ESLint on changed files.

## Success Criteria

- Frontend API DTOs match the audited backend contracts.
- UI models receive backend responses only through tested mappers.
- Connection testing immediately reflects backend success or recorded failure.
- Only SMTP is offered.
- Credential regeneration previews the same password-bearing population that
  creation resolves.
- Neither credential delivery nor campaign creation can proceed with a stale
  recipient preview.
- Campaign subjects render in list and detail views.
- Recipient email and skip reason render correctly in credential previews.
- Cancellation uses the actual backend response shape.
- Every known email error code has safe localized handling and a useful
  recovery path where one exists.
- Unknown errors never expose raw backend messages and retain `traceId` for
  support.
- Existing unrelated and overlapping worktree changes are preserved.
