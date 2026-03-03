# Lesson Plans Mobile Actions - Fixes Applied

## Issues Fixed

### 1. Mobile Components Not Rendering Outside Content Area
**Problem**: Mobile drawers and bottom bar were only rendered inside the content div, which meant they weren't accessible when no section/subject was selected.

**Fix**: Moved mobile components (FiltersDrawer, LessonLibraryDrawer, AddLessonDialog, MobileBottomBar) outside the content area to be direct children of the main container. They now render whenever `isMobile` is true, regardless of content state.

**File**: `src/components/features/academics/components/pages/LessonPlansPage.tsx`

### 2. Incorrect useState Usage in FiltersDrawer
**Problem**: Used `useState(() => {...})` instead of `useEffect(() => {...})` to update local state when props change.

**Fix**: 
- Changed to proper `useEffect` hook
- Added `useEffect` import
- Optimized to only update when drawer opens (prevents unnecessary re-renders)

**File**: `src/components/features/academics/components/lesson-plans/FiltersDrawer.tsx`

### 3. PreselectedWeekIndex Being Overwritten
**Problem**: When selecting a lesson from the library drawer after clicking "Add Lesson" from a week, the preselectedWeekIndex was being reset to `undefined`, breaking the flow.

**Fix**: 
- Changed `handleSelectLessonFromLibrary` to preserve the existing `preselectedWeekIndex` from previous state
- Added cleanup logic to clear `preselectedWeekIndex` when closing the library drawer without selecting a lesson

**File**: `src/components/features/academics/components/pages/LessonPlansPage.tsx`

## Changes Made

### FiltersDrawer.tsx
```typescript
// Before
import { useState } from "react";
// ...
useState(() => {
  setLocalStageId(selectedStageId);
  // ...
});

// After
import { useState, useEffect } from "react";
// ...
useEffect(() => {
  if (isOpen) {
    setLocalStageId(selectedStageId);
    setLocalGradeId(selectedGradeId);
    setLocalSectionId(selectedSectionId);
    setLocalSubjectId(selectedSubjectId);
  }
}, [isOpen, selectedStageId, selectedGradeId, selectedSectionId, selectedSubjectId]);
```

### LessonPlansPage.tsx

#### Change 1: Preserve preselectedWeekIndex
```typescript
// Before
const handleSelectLessonFromLibrary = useCallback((lesson: Lesson) => {
  setAddLessonDialog({ isOpen: true, lesson, preselectedWeekIndex: undefined });
  setLibraryDrawerOpen(false);
}, []);

// After
const handleSelectLessonFromLibrary = useCallback((lesson: Lesson) => {
  setAddLessonDialog((prev) => ({ 
    isOpen: true, 
    lesson, 
    preselectedWeekIndex: prev.preselectedWeekIndex 
  }));
  setLibraryDrawerOpen(false);
}, []);
```

#### Change 2: Clear preselectedWeekIndex on drawer close
```typescript
// Before
<LessonLibraryDrawer
  isOpen={libraryDrawerOpen}
  onClose={() => setLibraryDrawerOpen(false)}
  // ...
/>

// After
<LessonLibraryDrawer
  isOpen={libraryDrawerOpen}
  onClose={() => {
    setLibraryDrawerOpen(false);
    setAddLessonDialog((prev) => ({ ...prev, preselectedWeekIndex: undefined }));
  }}
  // ...
/>
```

#### Change 3: Move mobile components outside content area
```typescript
// Before
<div className="flex-1 overflow-auto">
  {/* content */}
  <div className={isMobile ? "p-4 pb-24" : "p-6"}>
    {/* ... */}
    {isMobile && (
      <>
        <FiltersDrawer ... />
        <LessonLibraryDrawer ... />
        <AddLessonDialog ... />
        <MobileBottomBar ... />
      </>
    )}
  </div>
</div>

// After
<div className="flex-1 overflow-auto">
  {/* content */}
  <div className={isMobile ? "p-4 pb-24" : "p-6"}>
    {/* ... */}
  </div>
</div>

{/* Mobile Drawers and Bottom Bar - Always render when mobile */}
{isMobile && (
  <>
    <FiltersDrawer ... />
    <LessonLibraryDrawer ... />
    <AddLessonDialog ... />
    <MobileBottomBar ... />
  </>
)}
```

## Mobile Flow Now Works Correctly

### Flow 1: Add Lesson from Library
1. User taps "Library" button in bottom bar
2. Library drawer opens
3. User taps a lesson
4. Week selection dialog opens
5. User selects week and confirms
6. Lesson is added to the selected week

### Flow 2: Add Lesson from Week
1. User expands a week accordion
2. User taps "Add Lesson" button
3. Library drawer opens (with preselectedWeekIndex stored)
4. User taps a lesson
5. Week selection dialog opens with the week pre-selected
6. User confirms
7. Lesson is added to the pre-selected week

### Flow 3: Apply Filters
1. User taps "Filters" button in bottom bar
2. Filters drawer opens
3. User selects stage/grade/section/subject
4. User taps "Apply Filters"
5. Filters are applied and drawer closes
6. Content updates with filtered data

## Testing Results

✅ Build passes successfully
✅ No TypeScript errors
✅ Mobile bottom bar always visible on mobile
✅ Filters drawer opens and applies filters correctly
✅ Library drawer opens and shows lessons
✅ Add lesson from library flow works
✅ Add lesson from week flow works with pre-selected week
✅ PreselectedWeekIndex is preserved correctly
✅ Drawer close cleans up state properly

## Files Modified
1. `src/components/features/academics/components/pages/LessonPlansPage.tsx`
2. `src/components/features/academics/components/lesson-plans/FiltersDrawer.tsx`

## Build Status
✅ Production build successful with no errors or warnings
