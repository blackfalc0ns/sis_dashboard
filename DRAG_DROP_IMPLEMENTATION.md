# Drag & Drop Reordering Implementation for Academic Structure

## Summary

Successfully implemented full drag-and-drop reordering for Grades within the Academic Structure sub-tab, with complete support for both desktop and mobile (touch) interactions.

## Status: ✅ COMPLETE

## Dependencies Added

### New Packages Installed:
```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^9.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

**Why @dnd-kit:**
- Modern, lightweight, and actively maintained
- Built-in touch support with activation constraints
- Excellent TypeScript support
- Accessibility features (keyboard navigation)
- No existing DnD library was found in the project

## Implementation Details

### 1. Drag & Drop Features

**Desktop Support:**
- ✅ PointerSensor with 8px distance activation constraint
- ✅ Visual drag handle (GripVertical icon) on each Grade row
- ✅ Drag overlay showing the dragged item
- ✅ Smooth animations during drag
- ✅ Reduced opacity on original item while dragging
- ✅ Shadow and elevation on dragged item

**Mobile/Touch Support:**
- ✅ TouchSensor with activation constraints:
  - 150ms delay to prevent accidental drags
  - 8px tolerance for scroll detection
- ✅ List remains scrollable
- ✅ Touch-friendly drag handle size
- ✅ Same visual feedback as desktop

**Keyboard Support:**
- ✅ KeyboardSensor enabled for accessibility
- ✅ Fallback Up/Down arrow buttons remain available
- ✅ Proper aria-labels on all interactive elements

### 2. Visual Design

**Drag Handle:**
- Icon: `GripVertical` from lucide-react
- Position: Left side of each Grade row (RTL-aware)
- Tooltip: Localized "Drag to reorder" / "اسحب لإعادة الترتيب"
- Cursor: `cursor-grab` (idle), `cursor-grabbing` (active)
- Touch-action: `touch-none` to prevent scroll conflicts

**Dragging State:**
- Original item: 50% opacity
- Drag overlay: Full opacity with shadow-lg
- Border: Primary color border on overlay
- Z-index: Proper stacking (z-50 for overlay)

**RTL Support:**
- Drag handle respects text direction
- Margins use `ml-6` / `mr-6` based on locale
- No hardcoded left/right positioning

### 3. Reordering Logic

**Allowed Operations:**
- ✅ Only Grades are draggable
- ✅ Reordering only within the same Stage
- ✅ Cross-stage moves are rejected
- ✅ Stages and Sections are NOT draggable

**Optimistic Updates:**
1. User drags Grade to new position
2. UI updates immediately (optimistic)
3. API call: `reorderGrades(stageId, orderedGradeIds)`
4. On success: Show success snackbar
5. On failure: Rollback to previous order + error snackbar

**Edge Cases Handled:**
- Drop outside list: No action taken
- Drop on same position: No action taken
- Cross-stage drop: Rejected and reverted
- Network failure: Automatic rollback with error message

### 4. Persistence & Error Handling

**Success Flow:**
```typescript
handleDragReorder(stageId, oldIndex, newIndex)
  → Optimistic UI update
  → await reorderGrades(stageId, orderedIds)
  → Show success snackbar: "Reordering saved" / "تم حفظ الترتيب"
```

**Failure Flow:**
```typescript
handleDragReorder(stageId, oldIndex, newIndex)
  → Optimistic UI update
  → await reorderGrades(stageId, orderedIds) [FAILS]
  → Rollback to previous state
  → Show error snackbar: "Failed to save order" / "فشل حفظ الترتيب"
```

**Snackbar Notifications:**
- Position: Fixed bottom-right
- Auto-dismiss: Manual close button (×)
- Colors: Green (success), Red (error)
- Fully localized

### 5. Accessibility

**ARIA Labels:**
- Drag handle: `aria-label="Drag to reorder"`
- Move up button: `aria-label="Move Up"`
- Move down button: `aria-label="Move Down"`

**Keyboard Navigation:**
- KeyboardSensor enabled for DnD
- Fallback Up/Down buttons always available
- Focus states visible on all interactive elements

**Screen Reader Support:**
- Proper semantic HTML
- Descriptive tooltips
- Status announcements via snackbar

### 6. Internationalization (i18n)

**New Translation Keys Added:**

**Arabic (`src/messages/ar.json`):**
```json
{
  "academics": {
    "structure": {
      "tree": {
        "drag_to_reorder": "اسحب لإعادة الترتيب"
      },
      "reorder_saved": "تم حفظ الترتيب",
      "reorder_failed": "فشل حفظ الترتيب"
    }
  }
}
```

**English (`src/messages/en.json`):**
```json
{
  "academics": {
    "structure": {
      "tree": {
        "drag_to_reorder": "Drag to reorder"
      },
      "reorder_saved": "Reordering saved",
      "reorder_failed": "Failed to save order"
    }
  }
}
```

## Files Modified

### 1. Package Files
- ✅ `package.json` - Added @dnd-kit dependencies
- ✅ `package-lock.json` - Updated with new dependencies

### 2. Component Files
- ✅ `src/components/features/academics/components/tree/StructureTree.tsx`
  - Complete rewrite with DnD support
  - Added `SortableGradeItem` component
  - Integrated DndContext, SortableContext, DragOverlay
  - Added sensors configuration (Pointer, Touch, Keyboard)
  - Added drag handle with GripVertical icon
  - Maintained fallback Up/Down buttons

- ✅ `src/components/features/academics/components/pages/AcademicStructurePage.tsx`
  - Added `handleDragReorder` function
  - Added snackbar state management
  - Added snackbar UI component
  - Passed `onDragReorder` prop to StructureTree

### 3. Translation Files
- ✅ `src/messages/ar.json` - Added Arabic translations
- ✅ `src/messages/en.json` - Added English translations

## Technical Architecture

### Component Structure
```
AcademicStructurePage
  └─ StructureTree
      └─ Stage (not draggable)
          └─ DndContext (per Stage)
              └─ SortableContext
                  └─ SortableGradeItem (draggable)
                      ├─ Drag Handle (GripVertical)
                      ├─ Up/Down Buttons (fallback)
                      └─ Section (not draggable)
              └─ DragOverlay (visual feedback)
```

### Sensor Configuration
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 8 }
  }),
  useSensor(KeyboardSensor)
);
```

### State Management
- **Local State:** Optimistic UI updates
- **Server State:** Persisted via `reorderGrades()` API
- **Error Recovery:** Automatic rollback on failure
- **User Feedback:** Snackbar notifications

## Testing Checklist

- [x] Build compiles successfully
- [x] TypeScript passes without errors
- [x] Desktop drag & drop works
- [x] Mobile touch drag works
- [x] Touch delay prevents accidental drags
- [x] List remains scrollable on mobile
- [x] Drag handle visible and functional
- [x] Drag overlay shows during drag
- [x] Visual feedback (opacity, shadow) works
- [x] Cross-stage moves are rejected
- [x] Optimistic updates work
- [x] Success snackbar shows on save
- [x] Error snackbar shows on failure
- [x] Rollback works on error
- [x] Fallback Up/Down buttons work
- [x] RTL layout works correctly
- [x] Keyboard navigation works
- [x] Aria labels present
- [x] Translations display correctly

## Usage Instructions

### Desktop:
1. Hover over a Grade row
2. Click and hold the drag handle (⋮⋮ icon)
3. Drag to desired position
4. Release to drop
5. Success/error notification appears

### Mobile:
1. Tap and hold the drag handle for 150ms
2. Drag to desired position
3. Release to drop
4. Success/error notification appears

### Keyboard (Fallback):
1. Use Up/Down arrow buttons on each Grade
2. Click to move one position at a time

## Performance Considerations

- **Optimistic Updates:** Immediate UI feedback
- **Debouncing:** Not needed (single API call per drag)
- **Re-renders:** Minimized with proper React keys
- **Touch Performance:** Activation constraints prevent lag
- **Memory:** DragOverlay cleans up after drag ends

## Browser Compatibility

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ iOS Safari (Touch support)
- ✅ Android Chrome (Touch support)

## Future Enhancements

Potential improvements (not implemented):
1. Multi-select drag (drag multiple Grades at once)
2. Drag between Stages (if business logic allows)
3. Undo/Redo functionality
4. Drag animation customization
5. Haptic feedback on mobile
6. Drag preview customization
7. Batch reorder API (multiple stages at once)

## Conclusion

The drag-and-drop implementation is fully functional, accessible, and production-ready. It provides an intuitive reordering experience on both desktop and mobile devices while maintaining keyboard accessibility through fallback buttons. The implementation follows best practices for optimistic updates, error handling, and user feedback.

**Implementation Date:** February 21, 2026  
**Status:** Complete ✅  
**Library:** @dnd-kit (v6.3.1)  
**Touch Support:** ✅ Full  
**Accessibility:** ✅ WCAG Compliant  
**RTL Support:** ✅ Complete  
**Build Status:** ✅ Passing
