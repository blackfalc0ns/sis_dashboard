# Calendar Drag Cursor Fix - Complete

## Issue
When dragging calendar events, the drag cursor (grabbing cursor) persists after the drag operation completes. The cursor remains stuck in "grabbing" mode even after dropping the event.

## Root Cause
The `calendar-dragging` CSS class was being added to `document.body` during drag start, but wasn't being reliably removed in all scenarios:
- If the drop happened outside the calendar
- If an error occurred during the drop
- If the component unmounted during drag
- If the drag was cancelled

The CSS class uses `cursor: grabbing !important` which overrides all other cursor styles, so it must be explicitly removed.

## Solution
Added multiple cleanup points to ensure the cursor is always reset:

1. Enhanced `handleDragEnd` to force remove the class and reset cursor
2. Added immediate cleanup in the `onDrop` handler
3. Added `useEffect` cleanup on component unmount
4. Reset cursor on both `document.body` and the event target element

## Changes Made

### src/hooks/calendar/useEventDragDrop.ts

1. **Import useEffect**
   - Added `useEffect` to the imports from React

2. **Added Cleanup useEffect**
   - Runs on component unmount
   - Removes `calendar-dragging` class from body
   - Resets body cursor style

3. **Enhanced handleDragEnd**
   - Now accepts optional event parameter
   - Forces removal of `calendar-dragging` class
   - Explicitly resets `document.body.style.cursor`
   - Resets cursor on event target if available

4. **Enhanced onDrop Handler**
   - Immediately removes `calendar-dragging` class
   - Resets cursor before processing the drop
   - Ensures cursor is reset even if drop validation fails

## How It Works

The fix ensures cursor cleanup happens in multiple scenarios:

1. **Normal drag end**: `handleDragEnd` removes class and resets cursor
2. **Successful drop**: `onDrop` immediately cleans up before processing
3. **Component unmount**: `useEffect` cleanup removes any lingering styles
4. **Error during drop**: Cleanup happens before error is thrown

## Testing

To verify the fix:

1. Navigate to Academics → Calendar
2. Drag an event to a new date
3. Drop the event
4. Verify the cursor returns to normal (pointer/default)
5. Try dragging and dropping outside the calendar
6. Verify cursor still resets properly
7. Try dragging and pressing ESC to cancel
8. Verify cursor resets

## Technical Details

The cursor is controlled by:
- CSS class: `.calendar-dragging { cursor: grabbing !important; }`
- Applied to: `document.body`
- Cleanup locations:
  - `handleDragEnd()` - main cleanup
  - `onDrop()` - immediate cleanup on drop
  - `useEffect` cleanup - unmount safety

## Files Modified
- `src/hooks/calendar/useEventDragDrop.ts`
