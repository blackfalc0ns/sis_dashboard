# Communication Frontend ↔ Backend Compatibility Fix Prompts

> Repository: `blackfalc0ns/sis_dashboard`
>
> Backend source of truth: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
>
> Goal: make the frontend Communication module request bodies, query params, socket events, and UI forms fully compatible with backend DTOs.
>
> Important backend behavior: NestJS validation uses `whitelist: true` and `forbidNonWhitelisted: true`, so sending extra fields that are not in the backend DTO can return `400 Bad Request`.

---

## Global Context For Every Prompt

Use this context before running any prompt:

```text
You are working in the Next.js repo `sis_dashboard`.

The Communication module already exists under:
- src/features/communication

Do not rebuild Auth.
Do not rebuild Academic Year / Term context.
Do not replace the existing REST API client in src/lib/api.ts.
Use the existing apiGet/apiPost/apiPatch/apiPut/apiDelete helpers.
Keep all changes scoped to the Communication module unless navigation or env examples need minimal updates.

Backend is the source of truth. Align frontend payloads and query params with backend DTOs from the Moazez-Backend repo.
The backend rejects unknown request fields.
Do not send UI-only fields directly to API.
Add mapper/sanitizer functions before requests where needed.

After each prompt:
- run npm run lint
- run npm run build
- fix TypeScript errors
- do not modify unrelated modules
```

---

# Prompt 01 — Add Backend-Compatible Request Mappers

```text
Create backend-compatible request mapper utilities for the Communication module.

Create file:
src/features/communication/api/communication.mappers.ts

Purpose:
Ensure frontend forms never send non-backend fields to the API.
Backend validation has whitelist + forbidNonWhitelisted, so extra fields break requests.

Add mapper functions:

1. toBackendConversationCreatePayload(input)
Allowed fields only:
- type
- title
- description
- avatarFileId
- academicYearId
- termId
- stageId
- gradeId
- sectionId
- classroomId
- subjectId
- isReadOnly
- isPinned
- metadata

Do not send:
- titleAr
- titleEn
- participantIds
- scopeType
- scopeId

2. toBackendConversationUpdatePayload(input)
Allowed fields only:
- title
- description
- avatarFileId
- isReadOnly
- isPinned
- metadata

3. toBackendSendMessagePayload(input)
Allowed fields only:
- type
- body
- content
- clientMessageId
- replyToMessageId
- metadata

Default type should be "text" when sending normal text messages.
Do not send:
- kind
- attachmentIds
- parentMessageId

If the UI uses parentMessageId, map it to replyToMessageId.

4. toBackendUpdateMessagePayload(input)
Allowed fields only:
- body
- content

5. toBackendAnnouncementCreatePayload(input)
Allowed fields only:
- title
- body
- status
- priority
- audienceType
- scheduledAt
- expiresAt
- audiences
- metadata

Do not send:
- titleAr
- titleEn
- bodyAr
- bodyEn
- targets
- scopeType
- scopeId

If the UI currently uses targets, convert targets to backend audiences where possible.

6. toBackendAnnouncementUpdatePayload(input)
Allowed fields only:
- title
- body
- priority
- audienceType
- scheduledAt
- expiresAt
- audiences
- metadata

7. toBackendReportCreatePayload(input)
Allowed fields only:
- reason
- description
- comment
- metadata

If the UI has `details`, map it to `description`.
Reason is required.

8. toBackendReportUpdatePayload(input)
Allowed fields only:
- status
- note
- resolutionNote
- metadata

9. toBackendRestrictionCreatePayload(input)
Allowed fields only:
- targetUserId
- type
- reason
- startsAt
- expiresAt
- metadata

If UI uses `message_send_disabled`, map to `send_disabled`.
Do not send attachment_upload_disabled or reaction_disabled because backend does not accept them.

10. toBackendRestrictionUpdatePayload(input)
Allowed fields only:
- reason
- startsAt
- expiresAt
- metadata

11. toBackendBlockCreatePayload(input)
Allowed fields only:
- targetUserId
- reason
- metadata

12. toBackendAttachmentLinkPayload(input)
Allowed fields only:
- fileId
- caption
- sortOrder

Also add a helper:
compactBackendPayload(payload)
- remove undefined values
- preserve null only where backend allows nullable fields
- do not remove false or 0

Acceptance criteria:
- Mappers are typed.
- No mapper returns frontend-only fields.
- Existing service can import these mappers.
- TypeScript builds.
```

---

# Prompt 02 — Fix Communication Types To Match Backend DTOs

```text
Update Communication module TypeScript request and query types to match backend DTOs.

Files to update:
- src/features/communication/types/conversation.types.ts
- src/features/communication/types/message.types.ts
- src/features/communication/types/announcement.types.ts
- src/features/communication/types/notification.types.ts
- src/features/communication/types/safety.types.ts
- src/features/communication/types/communication.types.ts

Backend-compatible types:

Conversations:
ConversationType must include:
- direct
- group
- classroom
- grade
- section
- stage
- school_wide
- support
- system

ConversationStatus:
- active
- archived
- closed

CreateConversationPayload allowed fields:
- type required
- title?: string | null
- description?: string | null
- avatarFileId?: string | null
- academicYearId?: string
- termId?: string
- stageId?: string
- gradeId?: string
- sectionId?: string
- classroomId?: string
- subjectId?: string
- isReadOnly?: boolean
- isPinned?: boolean
- metadata?: Record<string, unknown> | null

UpdateConversationPayload allowed fields:
- title?: string | null
- description?: string | null
- avatarFileId?: string | null
- isReadOnly?: boolean
- isPinned?: boolean
- metadata?: Record<string, unknown> | null

ListConversationsParams:
- type?: ConversationType
- status?: ConversationStatus
- search?: string
- limit?: number
- page?: number

Messages:
MessageType:
- text
- image
- file
- audio
- video
- system

Public send message type should only allow:
- text

MessageStatus:
- sent
- hidden
- deleted

SendMessagePayload allowed fields:
- type?: "text"
- body?: string
- content?: string
- clientMessageId?: string
- replyToMessageId?: string
- metadata?: Record<string, unknown> | null

UpdateMessagePayload:
- body?: string
- content?: string

ListMessagesParams:
- type?: MessageType
- status?: MessageStatus
- before?: string  // ISO date, not message id
- after?: string   // ISO date, not message id
- limit?: number
- page?: number

Reactions:
ReactionType must be exactly:
- like
- love
- laugh
- wow
- sad
- angry
- thumbs_up
- thumbs_down

Remove `thanks` and `seen` from allowed union.

Participants:
ParticipantRole:
- owner
- admin
- moderator
- member
- read_only
- system

ParticipantStatus:
- active
- invited
- left
- removed
- muted
- blocked

AddParticipantPayload:
- userId: string
- role?: ParticipantRole
- status?: ParticipantStatus
- mutedUntil?: string | null
- metadata?: Record<string, unknown> | null

Do not include participantId in AddParticipantPayload.

Announcements:
AnnouncementStatus:
- draft
- scheduled
- published
- archived
- cancelled

Create status should only be:
- draft
- scheduled

AnnouncementPriority:
- low
- normal
- high
- urgent

AnnouncementAudienceType:
- school
- stage
- grade
- section
- classroom
- custom

Audience row fields:
- audienceType?: AnnouncementAudienceType
- stageId?: string
- gradeId?: string
- sectionId?: string
- classroomId?: string
- studentId?: string
- guardianId?: string
- userId?: string
- teacherUserId?: string

CreateAnnouncementPayload:
- title: string
- body: string
- status?: "draft" | "scheduled"
- priority?: AnnouncementPriority
- audienceType?: AnnouncementAudienceType
- scheduledAt?: string | null
- expiresAt?: string | null
- audiences?: AudienceRow[]
- metadata?: Record<string, unknown> | null

UpdateAnnouncementPayload:
- title?: string
- body?: string
- priority?: AnnouncementPriority
- audienceType?: AnnouncementAudienceType
- scheduledAt?: string | null
- expiresAt?: string | null
- audiences?: AudienceRow[]
- metadata?: Record<string, unknown> | null

Remove frontend request usage of targets/scopeType/scopeId for announcements.

Notifications:
NotificationStatus:
- unread
- read
- archived

NotificationPriority:
- low
- normal
- high
- urgent

NotificationSourceModule:
- communication
- announcements
- attendance
- grades
- behavior
- reinforcement
- admissions
- students
- system

NotificationType:
- announcement_published
- message_received
- message_mention
- attendance_absence
- attendance_late
- grade_posted
- behavior_record_created
- reinforcement_reward_granted
- system_alert

ListNotificationsParams:
- status
- priority
- type
- sourceModule
- sourceType
- sourceId
- recipientUserId
- createdFrom
- createdTo
- limit
- page

Delivery params:
- notificationId
- recipientUserId
- channel
- status
- deliveryStatus
- provider
- createdFrom
- createdTo
- limit
- page

Safety:
ReportReason:
- spam
- harassment
- bullying
- abusive_language
- inappropriate_content
- safety
- privacy
- other

ReportStatus:
- open
- pending
- in_review
- resolved
- dismissed

CreateMessageReportPayload:
- reason required
- description?: string | null
- comment?: string | null
- metadata?: Record<string, unknown> | null

UpdateMessageReportPayload:
- status required
- note?: string | null
- resolutionNote?: string | null
- metadata?: Record<string, unknown> | null

ModerationActionType:
- hide
- unhide
- delete
- restrict_sender
- message_hidden
- message_unhidden
- message_deleted
- user_restricted

RestrictionType:
- mute
- read_only
- send_disabled
- group_create_disabled
- direct_message_disabled

RestrictionStatus:
- active
- lifted
- revoked
- expired

CreateRestrictionPayload:
- targetUserId required
- type required
- reason?: string | null
- startsAt?: string
- expiresAt?: string
- metadata?: Record<string, unknown> | null

UpdateRestrictionPayload:
- reason?: string | null
- startsAt?: string
- expiresAt?: string
- metadata?: Record<string, unknown> | null

Blocks:
CreateBlockPayload:
- targetUserId required
- reason?: string | null
- metadata?: Record<string, unknown> | null

Acceptance criteria:
- TypeScript request types match backend DTO field names.
- No UI-only request fields remain in request payload types.
- Existing UI compile errors are fixed by mapping or renaming.
```

---

# Prompt 03 — Update communication.service.ts To Use Mappers And Add Missing Endpoints

```text
Update src/features/communication/api/communication.service.ts.

Goals:
1. Use backend-compatible mappers before all mutating API calls.
2. Add missing backend endpoints.
3. Keep existing apiGet/apiPost/apiPatch/apiPut/apiDelete helpers.

Apply mappers to:
- createConversation
- updateConversation
- sendMessage
- updateMessage
- createAnnouncement
- updateAnnouncement
- createMessageReport
- updateMessageReport
- createRestriction
- updateRestriction
- createBlock
- linkAttachment

Add missing participant endpoints:
- updateParticipant(conversationId, participantId, payload)
  PATCH /communication/conversations/:conversationId/participants/:participantId
- removeParticipant(conversationId, participantId)
  DELETE /communication/conversations/:conversationId/participants/:participantId
- leaveConversation(conversationId)
  POST /communication/conversations/:conversationId/leave
- promoteParticipant(conversationId, participantId, payload)
  POST /communication/conversations/:conversationId/participants/:participantId/promote
  payload: { targetRole?: ParticipantRole }
- demoteParticipant(conversationId, participantId, payload)
  POST /communication/conversations/:conversationId/participants/:participantId/demote
  payload: { targetRole?: ParticipantRole }

Add missing invite endpoints:
- getConversationInvites(conversationId)
  GET /communication/conversations/:conversationId/invites
- createConversationInvite(conversationId, payload)
  POST /communication/conversations/:conversationId/invites
  payload: { invitedUserId: string; expiresAt?: string | null; metadata?: Record<string, unknown> | null }
- acceptConversationInvite(inviteId)
  POST /communication/conversation-invites/:inviteId/accept
- rejectConversationInvite(inviteId, payload?)
  POST /communication/conversation-invites/:inviteId/reject
  payload: { reason?: string }

Add missing join request endpoints:
- getJoinRequests(conversationId)
  GET /communication/conversations/:conversationId/join-requests
- createJoinRequest(conversationId, payload?)
  POST /communication/conversations/:conversationId/join-requests
  payload: { note?: string; metadata?: Record<string, unknown> | null }
- approveJoinRequest(requestId, payload?)
  POST /communication/join-requests/:requestId/approve
  payload: { reason?: string }
- rejectJoinRequest(requestId, payload?)
  POST /communication/join-requests/:requestId/reject
  payload: { reason?: string }

Add missing announcement endpoints:
- cancelAnnouncement(announcementId)
  POST /communication/announcements/:announcementId/cancel
- getAnnouncementAttachments(announcementId)
  GET /communication/announcements/:announcementId/attachments
- linkAnnouncementAttachment(announcementId, payload)
  POST /communication/announcements/:announcementId/attachments
  payload: { fileId: string; caption?: string; sortOrder?: number }
- deleteAnnouncementAttachment(announcementId, attachmentId)
  DELETE /communication/announcements/:announcementId/attachments/:attachmentId

Add missing notification endpoints:
- getNotification(notificationId)
  GET /communication/notifications/:notificationId
- markNotificationRead(notificationId)
  POST /communication/notifications/:notificationId/read
- archiveNotification(notificationId)
  POST /communication/notifications/:notificationId/archive
- getNotificationDelivery(deliveryId)
  GET /communication/notification-deliveries/:deliveryId

Important compatibility details:
- updatePolicy must not send frontend-only fields.
- getBlocks backend currently accepts no query DTO; keep params optional but do not send unsupported params unless backend adds support.
- list messages before/after must be ISO date strings.
- delete endpoints may return `{ ok: true }` or an updated entity; keep flexible response types.

Acceptance criteria:
- All backend endpoints from communication controllers are represented where needed.
- All mutating requests are sanitized before sending.
- No request body sends titleAr/titleEn/bodyAr/bodyEn/targets/scopeType/scopeId/kind/attachmentIds/parentMessageId/details/message_send_disabled/attachment_upload_disabled/reaction_disabled.
- npm run build passes.
```

---

# Prompt 04 — Fix UI Forms To Use Backend Field Names

```text
Update Communication UI forms so they collect and submit backend-compatible fields.

Search in:
- src/features/communication/pages
- src/features/communication/components
- src/features/communication/hooks

Fix Conversation UI:
- Replace titleAr/titleEn fields with single title field unless UI explicitly needs display-only localized fields.
- Replace scopeType/scopeId with backend academic/scope IDs:
  - academicYearId
  - termId
  - stageId
  - gradeId
  - sectionId
  - classroomId
  - subjectId
- Do not submit participantIds in create conversation. Add participants after conversation creation using POST /participants.
- Support isReadOnly and isPinned toggles.
- Keep description and metadata optional.

Fix Message UI:
- Replace kind with type.
- For normal message composer, always send type: "text".
- Replace parentMessageId with replyToMessageId.
- Do not send attachmentIds in send message. Attachments flow is:
  1. POST /files
  2. POST /communication/messages/:messageId/attachments with fileId, caption, sortOrder
- If using pagination with before/after, send ISO timestamps, not message IDs.

Fix Announcement UI:
- Replace targets UI model with backend audience model.
- Form fields:
  - title required
  - body required
  - status: draft | scheduled
  - priority: low | normal | high | urgent
  - audienceType: school | stage | grade | section | classroom | custom
  - scheduledAt ISO date/time when status is scheduled
  - expiresAt optional ISO date/time
  - audiences array for custom or scoped targeting
- Do not submit titleAr/titleEn/bodyAr/bodyEn unless backend adds them.
- Add attachment UI for announcements using announcement attachment endpoints.
- Add cancel action for scheduled announcements if needed.

Fix Report UI:
- reason is required.
- Use allowed reason values:
  spam, harassment, bullying, abusive_language, inappropriate_content, safety, privacy, other
- Rename details field to description.
- Optional comment field can be added.

Fix Moderation UI:
- Action dropdown values:
  hide, unhide, delete, restrict_sender
- Also support backend aliases if necessary:
  message_hidden, message_unhidden, message_deleted, user_restricted
- Optional fields: reason, note, metadata.

Fix Restriction UI:
- Type dropdown values must be:
  mute, read_only, send_disabled, group_create_disabled, direct_message_disabled
- Remove/disable old values:
  message_send_disabled, attachment_upload_disabled, reaction_disabled
- Add startsAt optional field.
- Keep expiresAt optional ISO string.

Fix Reactions UI:
- Allowed reaction values:
  like, love, laugh, wow, sad, angry, thumbs_up, thumbs_down
- Remove thanks/seen if present in UI.

Fix Notifications UI:
- Add detail actions if page supports them:
  - get notification detail
  - mark one notification read
  - archive one notification
  - get delivery detail
- Filters should use backend names:
  status, priority, type, sourceModule, sourceType, sourceId, recipientUserId, createdFrom, createdTo.

Acceptance criteria:
- UI forms no longer submit unsupported fields.
- Dropdown options match backend allowed values.
- Date filters/payloads are ISO strings.
- Create conversation + add participants works as separate operations.
- Attachment upload flow is correct.
- npm run build passes.
```

---

# Prompt 05 — Fix Socket Events And Realtime Compatibility

```text
Fix Communication realtime compatibility with backend Socket.IO gateway.

Files:
- src/features/communication/realtime/communication-events.ts
- src/features/communication/realtime/communication-socket.ts
- src/features/communication/realtime/CommunicationRealtimeProvider.tsx
- any hooks using socket events

Backend namespace:
/api/v1/realtime

Frontend env should use:
NEXT_PUBLIC_REALTIME_URL=https://api.moazez.sa/api/v1/realtime
NEXT_PUBLIC_REALTIME_SOCKET_PATH=

Important:
Backend does not define a custom Socket.IO path, so `/socket.io` appearing in browser network is normal.
Do not force `/api/v1/realtime/socket.io` unless backend changes.

Update event constants:

Server-to-client events:
- messageCreated: communication.chat.message.created
- messageUpdated: communication.chat.message.updated
- messageDeleted: communication.chat.message.deleted
- messageRead: communication.chat.message.read
- reactionUpserted: communication.chat.reaction.upserted
- reactionDeleted: communication.chat.reaction.deleted
- attachmentLinked: communication.chat.attachment.linked
- attachmentDeleted: communication.chat.attachment.deleted
- presenceUserUpdated: communication.presence.user.updated
- typingStarted: communication.typing.started
- typingStopped: communication.typing.stopped
- announcementPublished: communication.announcement.published
- notificationCreated: communication.notification.created
- notificationRead: communication.notification.read

Client-to-server commands:
- conversationJoin: communication.chat.conversation.join
- conversationLeave: communication.chat.conversation.leave
- typingStart: communication.typing.start
- typingStop: communication.typing.stop

Fix provider:
- joinConversation emits conversationJoin.
- leaveConversation emits conversationLeave.
- startTyping emits typingStart, not typingStarted.
- stopTyping emits typingStop, not typingStopped.

Socket auth:
- keep auth: { token }
- backend reads client.handshake.auth.token
- never log token value

Socket options:
- autoConnect: false
- transports: ["websocket", "polling"]
- reconnection: true
- withCredentials: true

Debugging:
- Add optional NEXT_PUBLIC_REALTIME_DEBUG=true logs.
- Log URL, namespace, path, hasToken, connect_error.message.
- Do not log token.

CORS note:
If websocket still fails in production, backend likely needs CORS origins configured. Do not workaround by changing frontend path.

Acceptance criteria:
- Event constants match backend realtime-event-names.ts.
- Provider emits correct command events.
- No code emits communication.conversation.join or communication.conversation.leave.
- No code emits typingStarted/typingStopped as client commands.
- npm run build passes.
```

---

# Prompt 06 — Add Compatibility Tests For Request Mappers And Services

```text
Add tests to prevent frontend/backend request mismatch regressions.

Create test files near the communication module, following the repo test style:
- src/features/communication/api/communication.mappers.test.ts
- src/features/communication/api/communication.service.test.ts if test setup supports mocking api helpers

Mapper tests:

Conversation:
- input with titleAr/titleEn/participantIds/scopeType/scopeId must output none of those fields.
- output includes only backend fields.

Message:
- kind is not output.
- parentMessageId maps to replyToMessageId.
- before/after are treated as ISO strings in params tests if applicable.

Announcement:
- targets is not output.
- audienceType/audiences are output.
- titleAr/bodyAr are not output.

Report:
- details maps to description.
- reason is required in type or runtime validation if implemented.

Restriction:
- message_send_disabled maps to send_disabled if compatibility mapping exists.
- attachment_upload_disabled and reaction_disabled should not be sent.

Policy:
- unsupported fields like allowAnnouncements, allowConversations, moderationEnabled, allowMessageEditing, allowMessageDeleting, allowedAttachmentMimeTypes are not output.

Service tests:
- verify createConversation posts to /communication/conversations with sanitized payload.
- verify sendMessage posts to /communication/conversations/:conversationId/messages with type/body/clientMessageId.
- verify createAnnouncement posts backend payload with audienceType/audiences.
- verify notification detail/read/archive endpoints use correct paths.
- verify invite/join request endpoints use correct paths.

Acceptance criteria:
- Tests fail if unsupported fields are sent.
- npm run test:run passes.
- npm run build passes.
```

---

# Prompt 07 — Add Backend Compatibility Checklist Document

```text
Create documentation file:
docs/communication-backend-compatibility-checklist.md

Include sections:

1. Environment
- NEXT_PUBLIC_API_URL=https://api.moazez.sa/api/v1
- NEXT_PUBLIC_REALTIME_URL=https://api.moazez.sa/api/v1/realtime
- NEXT_PUBLIC_REALTIME_SOCKET_PATH should be empty unless backend adds a custom path

2. REST payload compatibility
Checklist for:
- policies
- conversations
- participants
- invites
- join requests
- messages
- reactions
- message attachments
- announcements
- announcement attachments
- notifications
- notification deliveries
- reports
- moderation
- restrictions
- blocks

3. UI form compatibility
- Form fields match backend DTOs.
- No frontend-only fields sent to backend.
- Dropdown options match backend allowed values.
- Date values are ISO strings.

4. Realtime compatibility
- namespace /api/v1/realtime
- default Socket.IO path /socket.io is expected
- auth token sent in auth.token
- join/leave/typing command names match backend
- server event names match backend

5. Manual QA scenarios
- Create group conversation
- Add participant
- Send text message
- Edit message
- Mark conversation read
- Add allowed reaction
- Upload file and link message attachment
- Create announcement with audienceType/audiences
- Link announcement attachment
- Publish announcement
- Read notification detail
- Mark notification read
- Archive notification
- Create report with reason
- Resolve report
- Create restriction with send_disabled
- Revoke restriction
- Create block
- Delete block

Acceptance criteria:
- Document is clear enough for a developer or AI agent to follow.
```

---

# Prompt 08 — Final Integration Review Against Backend DTOs

```text
Do a final compatibility review of the Communication module against the backend DTOs.

Check these frontend files:
- src/features/communication/api/communication.service.ts
- src/features/communication/api/communication.mappers.ts
- src/features/communication/types/*.ts
- src/features/communication/realtime/*.ts
- src/features/communication/hooks/**/*.ts if present
- src/features/communication/components/**/*.tsx
- src/features/communication/pages/**/*.tsx

Verify:

Requests:
- No unsupported body fields are sent.
- Query params match backend DTO names.
- ISO date fields are strings.
- UUID fields are passed as UUID strings.
- Create/update policy sends only backend-supported policy fields.
- Announcement creation uses audienceType/audiences, not targets.
- Message creation uses type/body/content/clientMessageId/replyToMessageId/metadata.
- Message pagination uses before/after ISO timestamps, not IDs.
- Reports use description/comment, not details.
- Restrictions use backend type values.
- Reactions use backend type values.

Endpoints:
- All currently implemented backend communication endpoints are represented or intentionally omitted.
- Missing endpoints from the previous implementation are added:
  - participant update/remove/leave/promote/demote
  - invites accept/reject/list/create
  - join requests approve/reject/list/create
  - announcement attachments list/link/delete
  - notification detail/read/archive
  - notification delivery detail

Realtime:
- namespace URL is /api/v1/realtime
- no custom path is forced
- join/leave command names include communication.chat.conversation
- typing client commands are communication.typing.start/stop
- server listener events include announcement and notification events

UI:
- Dropdown values match backend allowed values.
- Submit handlers use mappers.
- No form spreads raw UI state into API calls.
- Error UI shows backend validation messages.

Run:
- npm run lint
- npm run build
- npm run test:run if tests exist

Fix issues found.

Acceptance criteria:
- No TypeScript errors.
- No known DTO mismatch remains.
- The module can work with the current backend without 400s caused by field names.
```

---

# Backend Source Of Truth Summary

## Conversation DTO fields

```text
Create:
type, title, description, avatarFileId, academicYearId, termId, stageId, gradeId, sectionId, classroomId, subjectId, isReadOnly, isPinned, metadata

Update:
title, description, avatarFileId, isReadOnly, isPinned, metadata

List params:
type, status, search, limit, page
```

## Message DTO fields

```text
Create:
type, body, content, clientMessageId, replyToMessageId, metadata

Update:
body, content

List params:
type, status, before, after, limit, page

before/after are ISO date strings.
```

## Announcement DTO fields

```text
Create:
title, body, status, priority, audienceType, scheduledAt, expiresAt, audiences, metadata

Update:
title, body, priority, audienceType, scheduledAt, expiresAt, audiences, metadata

List params:
status, priority, audienceType, search, publishedFrom, publishedTo, createdById, limit, page
```

## Notification params

```text
List notifications:
status, priority, type, sourceModule, sourceType, sourceId, recipientUserId, createdFrom, createdTo, limit, page

List deliveries:
notificationId, recipientUserId, channel, status, deliveryStatus, provider, createdFrom, createdTo, limit, page
```

## Safety DTO fields

```text
Report create:
reason, description, comment, metadata

Report update:
status, note, resolutionNote, metadata

Moderation create:
action, reason, note, metadata

Restriction create:
targetUserId, type, reason, startsAt, expiresAt, metadata

Restriction update:
reason, startsAt, expiresAt, metadata

Block create:
targetUserId, reason, metadata
```

## Allowed values

```text
ReactionType:
like, love, laugh, wow, sad, angry, thumbs_up, thumbs_down

RestrictionType:
mute, read_only, send_disabled, group_create_disabled, direct_message_disabled

ModerationAction:
hide, unhide, delete, restrict_sender, message_hidden, message_unhidden, message_deleted, user_restricted

ReportReason:
spam, harassment, bullying, abusive_language, inappropriate_content, safety, privacy, other

ReportStatus:
open, pending, in_review, resolved, dismissed
```

---

# Suggested PR Breakdown

## PR 1

```text
fix: align communication types and mappers with backend DTOs
```

Includes:
- request types
- query param types
- mapper/sanitizer functions
- no UI changes except compile fixes

## PR 2

```text
fix: align communication services with backend endpoints
```

Includes:
- service uses mappers
- missing endpoints added
- no broad UI rewrite

## PR 3

```text
fix: align communication forms with backend payloads
```

Includes:
- conversation form
- message composer
- announcement editor
- safety forms
- restrictions/reactions dropdowns

## PR 4

```text
fix: align communication realtime with backend gateway
```

Includes:
- socket events
- typing commands
- debug logs
- env example

## PR 5

```text
test: add communication backend compatibility tests
```

Includes:
- mapper tests
- service path tests
- QA checklist
