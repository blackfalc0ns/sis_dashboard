# Codex Prompt — Figma Conversations Redesign From Scratch

Use this prompt with Codex after connecting Figma through MCP.

```text
Implement a NEW Communication Conversations UI in `sis_dashboard` using this Figma design:

https://www.figma.com/make/NO0BiVSD9tT4DMnvam2lKL/Untitled?code-node-id=0-9&p=f&t=FEalDDH7KOk0hBxo-0&fullscreen=1

Important:
- Start from scratch for the Conversations UI.
- Ignore the current ConversationsPage visual implementation.
- Do not use the old conversation UI components as the visual/design base.
- Build a new page and component hierarchy based on the Figma frame.
- Use the existing backend endpoints, API service methods, hooks logic, realtime hooks, and types only for data/behavior.
- The visual/layout source of truth is the Figma design, not the current conversations UI.

Before coding:
- Read AGENTS.md and package scripts.
- Inspect routing and Communication module structure.
- Inspect existing API services, hooks, types, auth, realtime, and selectors.
- Use the Figma MCP to inspect the selected frame hierarchy, spacing, typography, colors, states, and assets.
- Use existing design-system components where possible: Button, Input, TextArea, Select, Modal, Tabs/Card if appropriate, loading/error/toast components.
- Do not hardcode colors, fonts, or spacing if project tokens/classes already exist.

Scope:
- Create new components under:
  src/features/communication/components/conversations/redesign/
- Create a new page-level component, for example:
  src/features/communication/pages/ConversationsRedesignPage.tsx
- Wire the existing conversations route/page to the new implementation only after it works.
- Keep old components available until the new UI is verified.
- Do not delete old components unless they become clearly unused and build/tests pass.
- Avoid unrelated cleanup.

Do not:
- Do not rebuild Auth.
- Do not modify Academic Year / Term context.
- Do not replace src/lib/api.ts.
- Do not change backend API contracts.
- Do not rename request fields.
- Do not invent new backend endpoints.
- Do not introduce raw manual ID inputs.
- Do not introduce MUI components inside src/features/communication.
- Do not reconnect/remount the realtime socket unnecessarily when switching conversations or tabs.

Use existing backend/API behavior only:
- conversations list/get/create/update/archive/close/reopen
- messages list/send/edit/delete/read
- conversation read and read summary
- message reactions
- message attachments
- participants list/add/update/remove/leave/promote/demote
- invites list/create/accept/reject
- join requests list/create/approve/reject
- realtime typing, presence, messages, reactions, attachments
- communication policy checks

Relevant files to inspect for data/behavior only:
- src/features/communication/api/communication.service.ts
- src/features/communication/types
- src/features/communication/hooks
- src/features/communication/realtime
- src/features/communication/components/selectors

Implementation requirements:
- Match the Figma layout, typography, spacing, colors, states, and responsive behavior.
- Implement a real dynamic UI, not static mock cards.
- Use real conversations from the existing endpoints.
- Use real messages from the existing endpoints.
- Use real participants/invites/join requests from the existing endpoints.
- Use real mutation actions for create/edit/archive/close/reopen/send/read/reactions/attachments/participants/invites/join requests.
- Use real loading, empty, error, disabled, pending, failed, unread, and selected states.

Data mapping:
Conversation list items must map:
- id
- title/titleAr/titleEn
- type
- status
- isPinned
- isReadOnly
- unreadCount
- lastMessage
- lastMessageAt / updatedAt
- participantsCount if available

Thread header must map:
- conversation title
- type
- status
- participant count
- pinned/read-only indicators
- presence if available

Messages must map:
- id
- sender
- body/content
- status
- deliveryStatus
- createdAt
- updatedAt
- edited state
- reactions
- attachments
- read receipts/read summary

Participants must map:
- user/name
- role
- status
- joinedAt
- mutedUntil
- presence

Invites must map:
- invited user
- status
- expiresAt
- createdAt

Join requests must map:
- requester user
- note
- status
- createdAt

Figma layout expectations:
- Desktop: two-column WhatsApp-style layout.
- Left: conversations sidebar with search and chip filters.
- Right: active conversation thread.
- Mobile/tablet: list-first layout; selected conversation opens full thread with back button.
- Tabs: Messages, Participants, Invites, Join Requests.
- Messages: date separators, own/received bubbles, incoming avatars, reactions, attachments, read indicators, typing indicator, composer.
- Composer: sticky bottom, attach action, message input, send action, disabled states.
- Participants/Invites/Join Requests: restyle according to Figma while preserving real actions and permissions.
- Modals: New Conversation, Add Participant, Create Invite, Create Join Request, Review Join Request.

Entity selection rules:
- No raw manual ID fields.
- Use searchable dashboard Select components for users, academic structure, files, conversations, announcements, etc.
- If a selector already exists, reuse it.
- If a selector is missing, create it using existing endpoints/services only.
- If no endpoint exists for a Figma element, implement the UI state but leave the action disabled with a clear TODO comment. Do not invent backend APIs.

Realtime rules:
- Keep existing realtime provider/socket logic.
- New UI must subscribe to existing realtime events.
- New messages should appear without manual refresh where current logic supports it.
- Typing indicator and presence should use existing realtime hooks.
- Switching tabs must not reconnect socket.

Responsive/RTL:
- Follow Figma desktop/mobile frames if present.
- If mobile frame is missing, implement sensible mobile behavior: conversation list first, selected thread full screen, back button returns to list.
- Preserve RTL support.
- Own/received message positioning must use isOwn message logic, not locale only.

Quality:
- Keep TypeScript strict.
- Avoid duplicated API logic where hooks/services already exist.
- Prefer composition over copying old components.
- Use accessible buttons/inputs/labels.
- Preserve localization labels or add English/Arabic labels where needed.

After implementation:
- Run package scripts: lint, typecheck if available, build, tests if available.
- Fix all errors.
- Compare rendered UI against the Figma frame using Figma MCP and browser/dev preview.
- List remaining differences from Figma.
- Explain any differences caused by backend/data constraints.

Acceptance criteria:
- A new Figma-based conversations UI is implemented.
- It does not visually depend on the old conversations page/components.
- It uses existing endpoints/services/hooks only.
- Existing communication functionality still works.
- No raw ID inputs are visible.
- No MUI components are introduced in src/features/communication.
- Realtime chat still works.
- Switching conversations/tabs does not reconnect the socket unnecessarily.
- Desktop/mobile layout follows Figma.
- Build passes.
```
