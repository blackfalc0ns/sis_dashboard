# Learning Content Panel Implementation

## Overview
Moved Learning Content (materials/video/assignments) from the bottom of the lesson editor into a dedicated panel to improve UX on small screens and eliminate long scrolling.

## Changes Made

### 1. New Component: LearningContentPanel
**File**: `src/components/features/academics/components/curriculum/LearningContentPanel.tsx`

**Features**:
- Drawer-based panel with responsive behavior
- Desktop: Right-side drawer (480px width, RTL-aware)
- Mobile: Bottom sheet drawer (90vh height, rounded top corners)
- Tabs for Materials, Video, and Assignments
- Preserves all existing functionality
- Proper RTL support using theme direction

**Props**:
- `lessonId`: string - The lesson ID
- `isReadOnly`: boolean - Read-only mode for closed terms
- `gradeId?`: string - For scope-aware holiday checking
- `open`: boolean - Panel open state
- `onClose`: () => void - Close handler
- `defaultTab?`: "materials" | "video" | "assignments" - Initial tab

### 2. Updated CurriculumEditor
**File**: `src/components/features/academics/components/curriculum/CurriculumEditor.tsx`

**Changes**:
- Removed inline Learning Content section from bottom
- Added "Learning Content" button in lesson editor header
- Button only shows for existing lessons (not new lessons)
- Added state management for panel open/close
- Imported `LearningContentPanel` instead of individual components
- Added `BookOpen` icon from lucide-react

**Button Location**:
- Positioned in header next to status badge
- Only visible when editing an existing lesson
- Opens the LearningContentPanel on click

### 3. Translation Keys Added

**English** (`src/messages/en.json`):
```json
"editor": {
  "learning_content": "Learning Content"
},
"learningContent": {
  "close": "Close"
}
```

**Arabic** (`src/messages/ar.json`):
```json
"editor": {
  "learning_content": "محتوى التعلم"
},
"learningContent": {
  "close": "إغلاق"
}
```

## Responsive Behavior

### Desktop (md and up)
- Drawer anchors to right (or left for RTL)
- Width: 480px
- Full height
- Overlays content with backdrop

### Mobile (below md)
- Drawer anchors to bottom
- Height: 90vh
- Rounded top corners (16px radius)
- Full width
- Swipe down to close

## User Flow

1. User edits an existing lesson
2. Clicks "Learning Content" button in header
3. Panel opens with tabs (Materials/Video/Assignments)
4. User can add/edit materials, videos, or assignments
5. Changes are saved immediately (existing behavior preserved)
6. User closes panel via X button or backdrop click
7. Returns to lesson editor without losing unsaved changes

## Benefits

✅ No more long scrolling on small screens
✅ Learning content accessible via single button click
✅ All existing features preserved (uploads, restrictions, assignments)
✅ Better mobile experience with bottom sheet
✅ RTL support maintained
✅ Read-only mode for closed terms still enforced
✅ Clean separation of concerns

## Technical Details

- Uses MUI Drawer component (no new dependencies)
- Responsive breakpoint: `theme.breakpoints.down("md")`
- RTL detection: `locale === "ar"` and `theme.direction`
- State management: Local `useState` for panel open/close
- No impact on existing lesson form dirty state

## Files Modified

1. `src/components/features/academics/components/curriculum/LearningContentPanel.tsx` (NEW)
2. `src/components/features/academics/components/curriculum/CurriculumEditor.tsx`
3. `src/messages/en.json`
4. `src/messages/ar.json`

## Testing Checklist

- [ ] Desktop: Panel opens on right (left for RTL)
- [ ] Mobile: Panel opens from bottom with rounded corners
- [ ] All three tabs work (Materials, Video, Assignments)
- [ ] File uploads work in Materials tab
- [ ] Video URL can be added/edited
- [ ] Assignments can be created/edited
- [ ] Read-only mode prevents edits when term is closed
- [ ] Panel closes via X button
- [ ] Panel closes via backdrop click
- [ ] Lesson form retains unsaved changes when panel opens/closes
- [ ] RTL layout works correctly
- [ ] Translations display correctly in both languages
