# Calendar Drag & Drop - Complete Implementation Guide

## ✅ Completed Components

### 1. Hook: `src/hooks/calendar/useEventDragDrop.ts`
- Manages drag state and hover state
- Provides `handleDragStart`, `handleDragEnd` handlers
- Provides `getDropHandlers(date)` for drop zones
- Validates term range
- Calculates new dates preserving duration

### 2. Dialog: `src/components/features/academics/components/calendar/MoveEventDialog.tsx`
- Mobile fallback for moving events
- Uses DatePicker for date selection
- Validates term range
- Preserves event duration

### 3. Translations Added
**English (`en.json`)**:
- `eventMoved`: "Event moved"
- `moveFailed`: "Failed to move event"
- `moveToDate`: "Move to date..."
- `dropOutsideTerm`: "You can only move events within the term range."
- `moveEvent`: "Move Event"
- `selectNewDate`: "Select new date"

**Arabic (`ar.json`)**: All translations added

### 4. Styles Added (`globals.css`)
- `.calendar-dragging`: Global cursor during drag
- `.calendar-event-dragging`: Dragged event opacity
- `.calendar-drop-target`: Drop zone highlight
- `.calendar-event-draggable`: Grab cursor

## 🔧 Required Updates

### Update MonthCalendar.tsx

Add these props to the component:
```typescript
interface MonthCalendarProps {
  // ... existing props
  term: Term; // Add this
  onEventMove: (eventId: string, newStartDate: string, newEndDate: string) => Promise<void>; // Add this
}
```

In the component:
1. Import and use the hook:
```typescript
import { useEventDragDrop } from "@/hooks/calendar/useEventDragDrop";

const {
  dragState,
  hoverDate,
  isDragging,
  handleDragStart,
  handleDragEnd,
  getDropHandlers,
  formatDateToISO,
} = useEventDragDrop({
  termStartDate: term.startDate,
  termEndDate: term.endDate,
  isReadOnly,
  onEventMove,
});
```

2. Make event chips draggable:
```typescript
<button
  key={event.id}
  draggable={!isReadOnly}
  onDragStart={(e) => handleDragStart(event, e)}
  onDragEnd={handleDragEnd}
  onClick={(e) => {
    e.stopPropagation();
    onEventClick(event);
  }}
  className={`
    w-full text-left px-2 py-1 rounded text-xs truncate border
    ${getEventColor(event.type)}
    ${!isReadOnly ? 'calendar-event-draggable' : ''}
    ${dragState.eventId === event.id ? 'calendar-event-dragging' : ''}
    hover:opacity-80 transition-opacity
  `}
  title={title}
>
  {title}
</button>
```

3. Make day cells drop targets:
```typescript
const dropHandlers = getDropHandlers(day.date);
const dateStr = formatDateToISO(day.date);
const isDropTarget = hoverDate === dateStr;

<div
  key={index}
  onClick={(e) => handleDayClick(day.date, day.isCurrentMonth, e)}
  {...(day.isCurrentMonth && !isReadOnly ? dropHandlers : {})}
  className={`
    min-h-[110px] md:min-h-[130px] p-2 border-b border-r border-gray-200
    ${day.isCurrentMonth ? "bg-white" : "bg-gray-50"}
    ${day.isCurrentMonth && !isReadOnly ? "cursor-pointer hover:bg-blue-50/30" : ""}
    ${day.isToday ? "bg-blue-50 ring-2 ring-inset ring-primary" : ""}
    ${isDropTarget ? "calendar-drop-target" : ""}
    transition-colors
  `}
>
```

4. Add "Move to date" to DayEventsPopover menu (for mobile):
- Add a menu item in the event actions
- Opens MoveEventDialog

### Update AcademicCalendarPage.tsx

1. Add state for move dialog and snackbar:
```typescript
const [moveDialogOpen, setMoveDialogOpen] = useState(false);
const [movingEvent, setMovingEvent] = useState<AcademicEvent | null>(null);
const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
  open: false,
  message: '',
  severity: 'success'
});
```

2. Implement handleEventMove:
```typescript
const handleEventMove = async (eventId: string, newStartDate: string, newEndDate: string) => {
  const event = events.find(e => e.id === eventId);
  if (!event) return;

  // Optimistic update
  const updatedEvents = events.map(e =>
    e.id === eventId
      ? { ...e, startDate: newStartDate, endDate: newEndDate }
      : e
  );
  setEvents(updatedEvents);
  applyFiltersToEvents(updatedEvents);

  try {
    await updateEvent(eventId, {
      startDate: newStartDate,
      endDate: newEndDate,
    });
    
    setSnackbar({
      open: true,
      message: t("eventMoved"),
      severity: 'success'
    });
  } catch (error) {
    // Rollback on failure
    await loadEvents();
    
    if (error instanceof Error && error.message === "DROP_OUTSIDE_TERM") {
      setSnackbar({
        open: true,
        message: t("dropOutsideTerm"),
        severity: 'error'
      });
    } else {
      setSnackbar({
        open: true,
        message: t("moveFailed"),
        severity: 'error'
      });
    }
  }
};
```

3. Pass props to MonthCalendar:
```typescript
<MonthCalendar
  currentDate={currentDate}
  events={filteredEvents}
  onDateClick={handleAddEvent}
  onEventClick={handleEditEvent}
  isReadOnly={isReadOnly}
  term={term} // Add this
  onEventMove={handleEventMove} // Add this
/>
```

4. Add MoveEventDialog:
```typescript
<MoveEventDialog
  isOpen={moveDialogOpen}
  onClose={() => {
    setMoveDialogOpen(false);
    setMovingEvent(null);
  }}
  event={movingEvent}
  term={term}
  onMove={async (newStartDate, newEndDate) => {
    if (movingEvent) {
      await handleEventMove(movingEvent.id, newStartDate, newEndDate);
    }
  }}
/>
```

5. Add Snackbar (MUI):
```typescript
<Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
>
  <Alert severity={snackbar.severity}>
    {snackbar.message}
  </Alert>
</Snackbar>
```

## 📱 Mobile Support

Add "Move to date..." option in DayEventsPopover:
```typescript
<button
  onClick={() => {
    setMovingEvent(event);
    setMoveDialogOpen(true);
    onClose();
  }}
  className="..."
>
  <Calendar className="w-4 h-4" />
  <span>{t("moveToDate")}</span>
</button>
```

## ✅ Testing Checklist

1. **Desktop Drag-Drop**
   - [ ] Drag single-day event to another day
   - [ ] Drag multi-day event (duration preserved)
   - [ ] Visual feedback during drag (opacity, drop target highlight)
   - [ ] Drop outside term range shows error
   - [ ] Read-only mode disables dragging

2. **Mobile Fallback**
   - [ ] "Move to date" menu option appears
   - [ ] Dialog opens with date picker
   - [ ] Date picker respects term range
   - [ ] Move preserves duration
   - [ ] Error shown for invalid dates

3. **Edge Cases**
   - [ ] Dropping on same date does nothing
   - [ ] Multi-day event spanning month boundary works
   - [ ] RTL layout works correctly
   - [ ] Snackbar messages appear in correct language

## 🎨 Visual Behavior

- **Dragging**: Event becomes semi-transparent (50% opacity)
- **Drop Target**: Day cell gets dashed border + light blue background
- **Cursor**: Changes to "grab" on hover, "grabbing" during drag
- **Success**: Green snackbar "Event moved"
- **Error**: Red snackbar with error message

## 🔒 Security & Validation

- Read-only mode completely disables drag-drop
- Term range validated on both client and server
- Optimistic updates with rollback on failure
- Duration always preserved (no data loss)

## 📝 Summary

This implementation provides a complete drag-and-drop solution for the calendar with:
- Native HTML5 drag-drop (no dependencies)
- Mobile fallback dialog
- Full i18n support (EN/AR)
- RTL compatibility
- Proper validation and error handling
- Optimistic UI updates
- Accessibility considerations
