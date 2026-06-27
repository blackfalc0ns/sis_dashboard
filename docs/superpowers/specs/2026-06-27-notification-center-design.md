# Design Spec: Live Notification Center Integration & Optimizations

## Goal
Implement a live, real-time Notification Center inside the main navbar (`TopNav.tsx`), backed by the backend NestJS WebSocket events and existing `useNotifications` hook, with localized dropdown lists, type-based icons, optimistic mutations, and debounced socket refreshes.

---

## 1. Type Synchronization (Backend Alignment)
We align frontend notification types with backend NestJS Prisma model `CommunicationNotificationType`.

### Notification Types:
- `announcement_published`
- `message_received`
- `message_mention`
- `attendance_absence`
- `attendance_late`
- `attendance_early_leave` (added to align with backend Prisma enum)
- `grade_posted`
- `behavior_record_created`
- `reinforcement_reward_granted`
- `system_alert`

---

## 2. Component Design: `TopNavNotificationDropdown.tsx`
We implement a new, modular component inside `src/components/layout/TopNavNotificationDropdown.tsx`.

### UI Features:
- **Responsive Dropdown Drawer**: Standard popover aligning under the TopNav bell icon.
- **Sound Control**: Speaker toggle icon (`Volume2` / `VolumeX`) in the header right next to the "Mark all read" button. Clicking it toggles the mute state via `setNotificationMuted`.
- **Live Icons by Type**:
  - `message_received` / `message_mention` $\rightarrow$ `MessageSquare`
  - `announcement_published` $\rightarrow$ `Megaphone`
  - `attendance_absence` / `attendance_late` / `attendance_early_leave` $\rightarrow$ `Calendar`
  - `grade_posted` $\rightarrow$ `Award`
  - `behavior_record_created` $\rightarrow$ `ShieldAlert`
  - `reinforcement_reward_granted` $\rightarrow$ `Gift`
  - `system_alert` $\rightarrow$ `AlertTriangle`
- **Priority Badging**: Show a visual pill badge for high/urgent priority alerts.

---

## 3. Interactions & Optimistic UI

### Click Behavior:
- **Card Click**: Clicking anywhere on the card marks it as read immediately and redirects to the deep link destination.
- **Hover Actions**: Render small action buttons (like archive trash icon) on the side.

### Optimistic UI:
- Revert local list and decrement unread count immediately upon action click.
- Roll back to the original values and show a Toast warning only if the background API request fails.

---

## 4. Realtime Socket Throttling & Debounce
- In `useNotifications.ts`, wrap the socket event handler in a `100ms` debounce timer so that concurrent events trigger only a single consolidated API fetch request.
