# Curriculum Resizable Panels - Complete Implementation

## Overview
Implemented a premium layout experience for the Curriculum page with collapsible, resizable panels and focus mode. The layout provides a significantly wider center editor while maintaining all existing functionality.

## Features Implemented

### 1. Three-Panel Layout (Desktop)
- **Left Panel**: Lessons list (default 280px, range 220-420px)
- **Center Panel**: Lesson editor + learning content (flexible, minimum 520px)
- **Right Panel**: Curriculum plan (default 320px, range 260-520px)

### 2. Collapsible Panels
- Toggle buttons for left and right panels
- Collapsed panels show a minimal 44px rail with expand button
- State persisted in localStorage with key `curriculum:panelState`
- Smooth transitions (300ms)

### 3. Resizable Panels
- Drag handles between panels for manual resizing
- Pointer events support (mouse + touch)
- RTL-aware resizing logic
- Constraints enforced:
  - Left: 220px - 420px
  - Right: 260px - 520px
  - Center: minimum 520px
- Visual feedback on hover/active
- Cursor changes to `col-resize` during drag

### 4. Focus Mode
- Toggle button in center panel header
- Collapses both side panels
- Center panel uses full width
- Icon changes: Maximize2 → Minimize2
- State persisted in localStorage

### 5. Mobile Behavior
- Panels become drawers on screens < lg (1024px)
- "Lessons" and "Details" buttons open respective drawers
- Center panel uses full width
- Drawers slide from appropriate side (RTL-aware)
- Auto-close drawer when selecting a lesson

### 6. RTL Support
- All resize logic works correctly in RTL
- Chevron icons flip appropriately
- Drawer anchors swap sides
- Handle positioning adapts to direction

### 7. Accessibility
- Resize handles have proper ARIA labels
- Keyboard focus support
- Role="separator" for handles
- IconButtons with titles/tooltips

## Files Created

### 1. `src/hooks/useResizablePanels.ts`
Custom hook managing panel state and resize logic:
- State management (widths, collapsed, focus mode)
- localStorage persistence
- Pointer event handlers
- Constraint enforcement
- RTL-aware calculations

### 2. `src/components/ui/panel/PanelResizeHandle.tsx`
Reusable resize handle component:
- Visual indicator with hover effects
- Wider hit area for easier grabbing
- Pointer event handling
- Keyboard support structure
- RTL-aware styling

### 3. `src/components/features/academics/components/pages/CurriculumPage.tsx`
Updated main page component with:
- Resizable panel integration
- Mobile drawer implementation
- Focus mode toggle
- Panel collapse/expand controls
- Preserved all existing logic

## Files Modified

### 1. `src/messages/en.json`
Added translation keys:
```json
"focus": "Focus",
"exitFocus": "Exit focus",
"lessons": "Lessons",
"details": "Details",
"collapse": "Collapse",
"expand": "Expand",
"resizePanel": "Resize panel"
```

### 2. `src/messages/ar.json`
Added Arabic translations:
```json
"focus": "تركيز",
"exitFocus": "إنهاء التركيز",
"lessons": "الدروس",
"details": "التفاصيل",
"collapse": "طي",
"expand": "توسيع",
"resizePanel": "تغيير حجم اللوحة"
```

## Technical Implementation Details

### Panel Width Calculation
```typescript
const leftWidth = panels.state.focusMode || panels.state.leftCollapsed ? 0 : panels.state.leftWidth;
const rightWidth = panels.state.focusMode || panels.state.rightCollapsed ? 0 : panels.state.rightWidth;
```

### RTL Resize Logic
```typescript
if (isRTL) {
  // In RTL, left panel is visually on the right
  newLeftWidth = rect.right - e.clientX;
} else {
  newLeftWidth = e.clientX - rect.left;
}
```

### Constraint Enforcement
```typescript
// Ensure center has minimum width
const availableForCenter = containerWidth - newLeftWidth - state.rightWidth;
if (availableForCenter < constraints.centerMin) {
  newLeftWidth = containerWidth - constraints.centerMin - state.rightWidth;
}
```

### localStorage Structure
```json
{
  "leftWidth": 280,
  "rightWidth": 320,
  "leftCollapsed": false,
  "rightCollapsed": false,
  "focusMode": false
}
```

## User Experience Improvements

### Before
- Fixed 320px left panel
- Fixed 384px right panel
- Center panel cramped (~50% of screen on 1920px)
- No way to adjust layout
- Mobile had tabs instead of drawers

### After
- Adjustable panels (drag to resize)
- Collapsible panels (more space when needed)
- Focus mode (full-width editing)
- Center panel can be 70-80% of screen
- Mobile drawers for better UX
- State persists across sessions

## Testing Guide

### Desktop Testing

1. **Resize Panels**
   - Hover over the thin line between panels
   - Drag left/right to resize
   - Verify constraints are enforced
   - Check smooth resizing

2. **Collapse/Expand**
   - Click chevron icons in panel headers
   - Verify panel collapses to 44px rail
   - Click expand button on rail
   - Verify panel restores to previous width

3. **Focus Mode**
   - Click maximize icon in center header
   - Verify both panels collapse
   - Verify center uses full width
   - Click minimize icon to exit
   - Verify panels restore

4. **State Persistence**
   - Resize panels
   - Collapse a panel
   - Refresh page
   - Verify state is restored

5. **RTL Testing**
   - Switch to Arabic
   - Verify panels are in correct positions
   - Test resizing (should feel natural)
   - Verify chevrons point correctly

### Mobile Testing

1. **Drawer Behavior**
   - Resize browser to < 1024px
   - Verify "Lessons" and "Details" buttons appear
   - Click "Lessons" - drawer slides in
   - Select a lesson - drawer closes
   - Click "Details" - drawer slides in

2. **RTL Mobile**
   - Switch to Arabic on mobile
   - Verify drawers slide from correct side
   - Verify close buttons work

### Edge Cases

1. **Very Small Screens**
   - Test on 1366px width
   - Verify center doesn't get too small
   - Try to resize beyond limits

2. **Very Large Screens**
   - Test on 2560px width
   - Verify panels don't get too wide
   - Check maximum constraints

3. **Rapid Interactions**
   - Quickly toggle collapse/expand
   - Rapidly enter/exit focus mode
   - Verify no visual glitches

## Performance Considerations

- Resize uses `requestAnimationFrame` implicitly via React state
- Transitions are CSS-based (GPU accelerated)
- localStorage writes are debounced via useEffect
- No unnecessary re-renders (proper memoization)

## Browser Compatibility

- Pointer events: All modern browsers
- CSS transitions: All modern browsers
- localStorage: All modern browsers
- Flexbox: All modern browsers

## Future Enhancements (Optional)

1. **Keyboard Resize**
   - Arrow keys to resize panels
   - Shift+Arrow for larger increments

2. **Preset Layouts**
   - "Compact" (narrow panels)
   - "Comfortable" (default)
   - "Spacious" (wide panels)

3. **Double-Click Handle**
   - Double-click handle to reset to default width

4. **Panel Swap**
   - Drag panel headers to reorder

## Backup

Original file backed up to:
`src/components/features/academics/components/pages/CurriculumPage.backup.tsx`

## Summary

The curriculum page now provides a premium, flexible layout experience with:
- ✅ Collapsible panels
- ✅ Resizable panels with drag handles
- ✅ Focus mode for distraction-free editing
- ✅ Mobile drawers
- ✅ RTL support
- ✅ State persistence
- ✅ Smooth animations
- ✅ Accessibility features
- ✅ No new dependencies

The center editor is now significantly wider and the overall UX is much smoother while preserving all existing functionality.
