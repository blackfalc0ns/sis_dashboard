# Notification Delivery Filters Design

## Goal

Add server-backed filters to the notification deliveries page. Filters that require entity IDs must use searchable selectors instead of exposing raw ID inputs.

## Filter Surface

The page will support the delivery endpoint's canonical filters:

- `notificationId`: searchable notification selector
- `recipientUserId`: existing searchable user selector
- `channel`: select with `in_app`, `email`, `sms`, and `push`
- `status`: select with `pending`, `sent`, `delivered`, `failed`, and `skipped`
- `provider`: exact-match text input unless the backend later supports partial search
- `createdFrom` and `createdTo`: date-time inputs

The UI will send only `status`, not the duplicate `deliveryStatus` alias. Changing or clearing any filter resets delivery pagination to page 1.

The date-time inputs are converted to ISO 8601 strings before they are sent, for example `2026-06-01T00:00:00.000Z`. The backend treats `createdTo` as an inclusive upper bound.

## Notification Selector

The notification selector loads the first notification page when opened and requests the next page when its option list is scrolled near the end. Each successful request is appended and deduplicated by notification ID. It stops when the loaded count reaches the API total or a response contains no further records.

Search runs locally against notifications already loaded into the selector. This is not global backend text search because the current notifications endpoint does not support a `search` or `q` query against notification text. A notification that has not yet been loaded will not appear in local search results. Global notification search requires a backend text-search filter against title or body. The selected notification remains available while more pages are loaded or while the local search text changes.

Option labels must not display notification IDs. Labels use title first, then message or body as a fallback, followed by concise context such as notification type and creation date. Search text includes those same fields. The ID remains the option value sent to the delivery endpoint.

Loading the next page must not clear existing options. An initial failure shows the selector's error state; a later-page failure preserves loaded options and permits retry when the user scrolls again.

## Data Flow

The deliveries hook owns filter state and builds the request from non-empty filter values plus `page` and `limit`. It refetches when pagination or filters change. The page renders a dedicated filter component above the existing server-paginated data table.

The notification selector owns its incremental notification-page state. The recipient selector continues to use the existing user search service.

The page requires `communication.notifications.manage` to load deliveries and `communication.notifications.view` to populate the notification selector. The implementation must not assume that manage implies view. If the user can manage deliveries but cannot view notifications, the delivery table remains usable while the notification selector shows a permission error.

## Verification

Focused tests will cover:

- Delivery requests include active filters and omit empty values.
- Filter changes reset the delivery page to 1.
- Clearing filters removes all filter query parameters and reloads the unfiltered delivery list from page 1.
- Notification pages append and deduplicate as scrolling reaches the end.
- Notification option labels are human-readable and do not contain IDs.
- Local search filters loaded notification options.
- Date-time filters are sent as ISO 8601 strings and preserve the inclusive `createdTo` contract.
- A notification-selector permission failure does not prevent the delivery table from loading.
- Arabic and English filter labels render correctly.
