# Figma Make Prompt — Communication Conversations UI

Use this prompt in Figma Make to generate a high-fidelity UI for the Communication Conversations page.

```text
Design a high-fidelity Communication / Conversations page for a school SIS dashboard. Make it inspired by WhatsApp Web, but keep it professional and consistent with a modern admin dashboard.

Style:
- SaaS dashboard look
- white cards, slate-50 background, slate-200 borders
- sky-blue primary color
- rounded-lg / rounded-2xl corners
- subtle shadows
- compact, clean spacing
- lucide-style line icons
- bilingual-ready with RTL support
- professional school/admin tone, not a consumer chat clone

Layout:
Desktop: two-column layout.
Left sidebar width around 360px for conversation list.
Right side for active conversation thread.
Mobile: conversation list first, selected chat opens full screen with back button.

Top page header:
Title: Conversations
Subtitle: Manage real-time school communication across classes, groups, and direct messages.
Actions: Refresh, New Conversation.

Left sidebar:
- search input: “Search conversations…”
- filter chips: All, Unread, Pinned, Archived, Closed
- conversation cards showing:
  - avatar/initials
  - title
  - type: group, classroom, direct, support, system
  - status chip: active, closed, archived
  - pinned icon
  - last message preview
  - sender name
  - timestamp
  - unread badge
  - kebab menu: edit, close, reopen, archive
Selected conversation: sky-50 background and sky-200 border.
Unread title: bold.
Unread badge: sky-600 with white text.

Right thread header:
- avatar/initials
- conversation title
- type + participant count
- online/offline indicator if direct chat
- status chip
- pinned/read-only indicators
- actions: refresh, search, more menu

Tabs:
Messages | Participants | Invites | Join Requests

Messages tab:
Create WhatsApp-like chat area:
- scrollable message area with slate-50 background
- date separator pill: Today
- incoming messages left, outgoing messages right
- outgoing bubble: sky-600, white text
- incoming bubble: white, slate border
- rounded-2xl bubbles, sharper corner near sender
- max bubble width 70%
- sender name for incoming group/classroom messages
- message body, timestamp, edited label
- pending/failed chip if needed
- read receipt area
- reactions row
- attachments card with file icon, filename, size, open/download
- hover action menu: edit, delete, react, attach

Composer:
Sticky bottom composer:
- attach button
- emoji/reaction button
- text input: “Write a message…”
- send button sky-600
- disabled state for closed conversation or disabled policy
- typing indicator above composer: “Ms. Sara is typing…”
- read summary: “Read by 18 · Unread 5”

Participants tab:
- header with count and Add Participant button
- participant rows/cards:
  - avatar
  - name
  - role chip: owner/admin/moderator/member/read only
  - status chip: active/invited/muted/blocked
  - joined date
  - online/offline
  - actions: edit, promote, demote, remove
- Leave conversation button
- admin actions only for owner/admin/moderator

Invites tab:
- Create Invite button
- invite cards:
  - invited user
  - status: pending/accepted/rejected/expired
  - expires at
  - created at
  - actions: accept/reject when applicable
- empty state: “No invites yet.”

Join Requests tab:
- Create Join Request button
- request cards:
  - requester user
  - note
  - status: pending/approved/rejected
  - created at
  - actions: approve/reject for admins/moderators
- empty state: “No join requests yet.”

Modals:
Design these:
1. New Conversation
2. Add Participant
3. Create Invite
4. Create Join Request
5. Review Join Request

Important:
No raw ID fields.
Every entity uses searchable dashboard Select dropdowns.

New Conversation modal fields:
- title
- type select: group, classroom, direct
- description
- academic year select
- term select
- stage select
- grade select
- section select
- classroom select
- subject select
- avatar/file select or upload
- read-only toggle
- pinned toggle

Add Participant:
- user searchable select
- role select
- status select
- muted until datetime

Create Invite:
- invited user searchable select
- expires at datetime

Colors:
- background: slate-50
- cards: white
- borders: slate-200
- primary: sky-600
- primary light: sky-50
- text strong: slate-950
- muted: slate-500
- success: emerald
- warning: amber
- error: rose

States:
Design loading, empty, error, selected conversation, unread, offline/reconnecting banner, disabled composer, failed message.

Deliver:
Desktop page, mobile page, Messages tab, Participants tab, Invites tab, Join Requests tab, New Conversation modal, Add Participant modal.
```

---

## Data the design should reflect

### Conversation

```text
id
title
type: direct | group | classroom | grade | section | stage | school_wide | support | system
status: active | archived | closed
isPinned
isReadOnly
unreadCount
lastMessage
participantCount
```

### Message

```text
id
sender
body
status: sent | hidden | deleted
deliveryStatus: pending | sent | delivered | failed
createdAt
updatedAt
reactions
attachments
read receipts
```

### Participant

```text
user
role: owner | admin | moderator | member | read_only | system
status: active | invited | left | removed | muted | blocked
joinedAt
mutedUntil
presence: online | offline
```

### Invite

```text
invitedUser
status: pending | accepted | rejected | expired
expiresAt
createdAt
```

### Join Request

```text
requesterUser
note
status: pending | approved | rejected
createdAt
```

---

## Implementation reminders for the frontend

- Keep the design aligned with existing dashboard components.
- Use project `Select` style for searchable dropdowns.
- Do not expose raw IDs in the UI.
- Keep actions permission-aware.
- Keep realtime chat stable when switching tabs.
- Preserve RTL-friendly spacing and alignment.
