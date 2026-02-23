# Calendar Drag & Drop Implementation

## Overview
Implementing native HTML5 drag-and-drop for moving calendar events between days, with mobile fallback.

## Implementation Plan

### 1. Create Drag-and-Drop Hook
**File**: `src/hooks/calendar/useEventDragDrop.ts`
- Manages drag state (draggedEvent, duration, hover date)
- Provides drag handlers (onDragStart, onDragEnd)
- Provides drop handlers (onDragEnter, onDragOver, onDragLeave, onDrop)
- Validates drop targets (term range, read-only)
- Calculates new dates preserving duration

### 2. Update MonthCalendar Component
**File**: `src/components/features/academics/components/calendar/MonthCalendar.tsx`
- Make event chips draggable (desktop only)
- Make day cells drop targets
- Add visual feedback (dragging state, drop target highlight)
- Handle drop events
- Add "Move to date" menu item for mobile fallback

### 3. Update AcademicCalendarPage
**File**: `src/components/features/academics/components/pages/AcademicCalendarPage.tsx`
- Integrate drag-drop hook
- Handle event move with optimistic updates
- Show success/error snackbar
- Pass term info to calendar

### 4. Add Move Dialog (Mobile Fallback)
**File**: `src/components/features/academics/components/calendar/MoveEventDialog.tsx`
- Simple dialog with DatePicker
- Validates target date
- Applies same move logic as drag-drop

### 5. Update Translations
Add keys to `en.json` and `ar.json`:
- `calendar.eventMoved`: "Event moved" / "تم نقل الحدث"
- `calendar.moveFailed`: "Failed to move event" / "فشل نقل الحدث"
- `calendar.moveToDate`: "Move to date..." / "نقل إلى تاريخ..."
- `calendar.dropOutsideTerm`: "You can only move events within the term range." / "يمكن نقل الحدث داخل نطاق الترم فقط."
- `calendar.moveEvent`: "Move Event" / "نقل الحدث"
- `calendar.selectNewDate`: "Select new date" / "اختر التاريخ الجديد"

### 6. Add Styling
**File**: `src/app/globals.css`
- Drop target highlight styles
- Dragging state styles

## Key Features
- ✅ Native HTML5 drag-drop (no dependencies)
- ✅ Preserves event duration
- ✅ Term range validation
- ✅ Read-only mode respected
- ✅ Mobile fallback with dialog
- ✅ Optimistic UI updates
- ✅ RTL support
- ✅ i18n EN/AR

## Testing Scenarios
1. Drag single-day event to another day
2. Drag multi-day event (duration preserved)
3. Try dragging outside term range (blocked)
4. Try dragging in read-only mode (disabled)
5. Mobile: Use "Move to date" menu option
6. Verify RTL layout works correctly
