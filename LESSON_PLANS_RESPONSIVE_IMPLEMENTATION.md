# Lesson Plans Responsive Implementation Plan

## Overview
Transform the Lesson Plans page to be fully responsive across mobile, tablet, and desktop devices.

## Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 768px (sm to md)
- **Desktop**: >= 768px (md+)

## Component Structure

### New Components to Create

1. **LessonPlansHeader.tsx**
   - Desktop/Tablet: Shows filters inline + summary
   - Mobile: Compact summary + Filter/Library buttons

2. **WeeksBoardDesktop.tsx**
   - CSS Grid layout
   - Desktop: 4 columns
   - Tablet: 2 columns
   - Drag & drop enabled

3. **WeeksBoardMobile.tsx**
   - MUI Accordion for each week
   - Default collapsed
   - Tap-to-add flow
   - No drag & drop

4. **LessonLibraryPanel.tsx**
   - Desktop: Fixed sidebar (320px)
   - Scrollable content

5. **LessonLibraryDrawer.tsx**
   - Mobile/Tablet: MUI Drawer
   - RTL-aware
   - Search + filters + lessons

6. **FiltersDrawer.tsx**
   - Mobile only
   - Contains all filter controls
   - Apply/Cancel buttons

7. **AddLessonDialog.tsx**
   - Mobile: Select week dropdown
   - Confirm to add lesson

8. **MobileBottomBar.tsx**
   - Sticky bottom bar
   - Filters + Library buttons

## Implementation Steps

### Step 1: Refactor LessonPlansBoard
- Extract desktop layout to WeeksBoardDesktop
- Create mobile layout WeeksBoardMobile
- Add responsive logic with useMediaQuery

### Step 2: Create Mobile Components
- FiltersDrawer with all filter controls
- LessonLibraryDrawer with search/filter/lessons
- AddLessonDialog for tap-to-add
- MobileBottomBar for quick access

### Step 3: Update LessonPlansPage
- Add drawer state management
- Add responsive layout switching
- Keep existing functionality intact

### Step 4: Add Responsive Styles
- CSS Grid for desktop weeks
- Accordion styles for mobile
- Drawer transitions

### Step 5: Add Tap-to-Add Flow
- Mobile: Tap lesson → Select week → Add
- Desktop: Keep drag & drop

## Key Features

### Desktop (>= 768px)
- Multi-column grid (4 columns)
- Fixed sidebar library (320px)
- Drag & drop between library and weeks
- Inline filters
- Progress summary at top

### Tablet (640px - 768px)
- 2-column grid
- Collapsible/drawer library
- Drag & drop (optional)
- Tap-to-add fallback
- Inline or drawer filters

### Mobile (< 640px)
- Single column accordions
- Weeks collapsed by default
- Drawer for filters
- Drawer for library
- Tap-to-add only
- Sticky bottom bar with Filter/Library buttons
- Compact summary

## Translation Keys Needed

```json
{
  "academics.lessonPlans": {
    "mobile": {
      "openFilters": "Filters",
      "openLibrary": "Lesson Library",
      "selectWeek": "Select Week",
      "addToWeek": "Add to Week",
      "weekAccordion": "Week {index}",
      "addLesson": "Add Lesson",
      "applyFilters": "Apply Filters",
      "clearFilters": "Clear"
    }
  }
}
```

## Files to Modify

1. `src/components/features/academics/components/lesson-plans/LessonPlansBoard.tsx` - Add responsive logic
2. `src/components/features/academics/components/pages/LessonPlansPage.tsx` - Add drawer state
3. `src/messages/en.json` - Add mobile translations
4. `src/messages/ar.json` - Add mobile translations (Arabic)

## Files to Create

1. `src/components/features/academics/components/lesson-plans/WeeksBoardDesktop.tsx`
2. `src/components/features/academics/components/lesson-plans/WeeksBoardMobile.tsx`
3. `src/components/features/academics/components/lesson-plans/LessonLibraryDrawer.tsx`
4. `src/components/features/academics/components/lesson-plans/FiltersDrawer.tsx`
5. `src/components/features/academics/components/lesson-plans/AddLessonDialog.tsx`
6. `src/components/features/academics/components/lesson-plans/MobileBottomBar.tsx`

## Testing Checklist

### Mobile
- [ ] Open filters drawer
- [ ] Select stage/grade/section/subject
- [ ] Apply filters
- [ ] Open library drawer
- [ ] Tap lesson
- [ ] Select week from dropdown
- [ ] Confirm add
- [ ] Verify lesson appears in week accordion
- [ ] Expand week accordion
- [ ] Change lesson status
- [ ] Remove lesson
- [ ] Verify lesson re-appears in library

### Tablet
- [ ] 2-column grid displays
- [ ] Library toggle works
- [ ] Tap-to-add works
- [ ] Drag & drop works (if enabled)

### Desktop
- [ ] 4-column grid displays
- [ ] Fixed sidebar library
- [ ] Drag from library to week
- [ ] Drag between weeks
- [ ] All existing functionality works

### RTL
- [ ] Drawers open from correct side
- [ ] Text alignment correct
- [ ] Icons positioned correctly

## Performance Considerations

1. **Lazy Loading**: Accordion details only render when expanded
2. **Memoization**: Memoize week cards and lesson cards
3. **Virtual Scrolling**: Consider for large lesson lists (future enhancement)
4. **Debounce**: Search input in library drawer

## Notes

- No new dependencies required
- Use existing MUI components (Drawer, Accordion)
- Maintain RTL support throughout
- Keep i18n for all new strings
- Preserve all existing functionality
- Ensure accessibility (keyboard navigation, ARIA labels)

## Implementation Priority

1. **High**: Mobile accordion view, drawers, tap-to-add
2. **High**: Desktop grid layout preservation
3. **Medium**: Tablet 2-column layout
4. **Medium**: Bottom bar for mobile
5. **Low**: Advanced animations/transitions

## Estimated Complexity

- **Total Components**: 6 new + 2 modified
- **Lines of Code**: ~1500-2000 new lines
- **Testing Time**: 2-3 hours
- **Implementation Time**: 4-6 hours

This is a comprehensive refactor that maintains backward compatibility while adding full responsive support.
