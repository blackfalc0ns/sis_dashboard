# Notification Delivery Filters Design

## Goal

Add server-backed filters to the notification deliveries page. Filters that require entity IDs must use searchable selectors instead of exposing raw ID inputs.

## Filter Surface

The page will support the delivery endpoint's canonical filters:

- `notificationId`: searchable notification selector
- `recipientUserId`: existing searchable user selector
- `channel`: select with `in_app`, `email`, `sms`, and `push`
- `status`: select with `pending`, `sent`, `delivered`, `failed`, and `skipped`
- `provider`: text input
- `createdFrom` and `createdTo`: date-time inputs

The UI will send only `status`, not the duplicate `deliveryStatus` alias. Changing or clearing any filter resets delivery pagination to page 1.

## Notification Selector

The notification selector loads the first notification page when opened and requests the next page when its option list is scrolled near the end. Each successful request is appended and deduplicated by notification ID. It stops when the loaded count reaches the API total or a response contains no further records.

Search runs locally against notifications already loaded into the selector. The selected notification remains available while more pages are loaded or while the local search text changes.

Option labels must not display notification IDs. Labels use the first useful human-readable value available from title, message, or content, followed by concise context such as notification type and creation date. Search text includes those same fields. The ID remains the option value sent to the delivery endpoint.

Loading the next page must not clear existing options. An initial failure shows the selector's error state; a later-page failure preserves loaded options and permits retry when the user scrolls again.

## Data Flow

The deliveries hook owns filter state and builds the request from non-empty filter values plus `page` and `limit`. It refetches when pagination or filters change. The page renders a dedicated filter component above the existing server-paginated data table.

The notification selector owns its incremental notification-page state. The recipient selector continues to use the existing user search service.

## Verification

Focused tests will cover:

- Delivery requests include active filters and omit empty values.
- Filter changes reset the delivery page to 1.
- Clearing filters restores the empty state.
- Notification pages append and deduplicate as scrolling reaches the end.
- Notification option labels are human-readable and do not contain IDs.
- Local search filters loaded notification options.
- Arabic and English filter labels render correctly.
