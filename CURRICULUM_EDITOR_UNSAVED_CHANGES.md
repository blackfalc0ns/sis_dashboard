# Curriculum Editor - Unsaved Changes Indicator

## Overview
Added visual indicator to show when there are unsaved changes in the CurriculumEditor form.

## Changes Made

### 1. Updated CurriculumEditor Component
File: `src/components/features/academics/components/curriculum/CurriculumEditor.tsx`

#### Added Unsaved Changes Indicator
- Added text indicator next to the page title when `isDirty` is true
- Text appears in amber color (`text-amber-600`) for visibility
- Shows "Unsaved changes" / "تغييرات غير محفوظة"

#### Visual Implementation
```tsx
<div className="flex items-center gap-3">
  <h2 className="text-lg font-semibold">
    {/* Title text */}
  </h2>
  {isDirty && (
    <span className="text-sm text-amber-600 font-medium">
      {t("unsaved_changes")}
    </span>
  )}
</div>
```

#### Code Cleanup
- Removed unused imports: `Menu`, `MenuItem`, `IconButton`, `MoreVertical`, `useMediaQuery`, `useTheme`
- Removed unused state: `menuAnchor`, `isMobile`
- Cleaned up `finally` blocks that referenced removed state

### 2. Translation Keys Added

#### English (`src/messages/en.json`)
```json
{
  "academics.curriculum.editor": {
    "unsaved_changes": "Unsaved changes"
  }
}
```

#### Arabic (`src/messages/ar.json`)
```json
{
  "academics.curriculum.editor": {
    "unsaved_changes": "تغييرات غير محفوظة"
  }
}
```

## How It Works

### Dirty State Tracking
The component already had `isDirty` state that tracks changes:
1. `formData` - Current form values
2. `originalData` - Original values when form loaded
3. `isDirty` - Computed by comparing JSON.stringify of both objects
4. Updates on every form field change

### Visual Feedback
- When user makes any change: "Unsaved changes" text appears in amber
- When user saves: Text disappears (isDirty becomes false)
- When user switches to different unit/lesson: Text disappears (form resets)

### Save Button State
The Save button is already disabled when:
- `isReadOnly` is true (term is closed)
- `isSaving` is true (save in progress)
- `!isDirty` is true (no changes to save)

## User Experience

### Before Changes
- User had to remember if they made changes
- No visual indication of unsaved work
- Could accidentally lose changes by navigating away

### After Changes
- Clear visual indicator when changes exist
- Amber color draws attention without being alarming
- Positioned next to title for easy visibility
- Works in both English and Arabic

## Files Changed
1. `src/components/features/academics/components/curriculum/CurriculumEditor.tsx`
2. `src/messages/en.json`
3. `src/messages/ar.json`

## Testing Checklist
- [x] No TypeScript errors
- [x] Translation keys added to both languages
- [x] Unused imports removed
- [ ] Text appears when making changes
- [ ] Text disappears after saving
- [ ] Text disappears when switching units/lessons
- [ ] Text displays correctly in RTL (Arabic)
- [ ] Text color is visible and appropriate
- [ ] Save button disabled state works correctly

## Future Enhancements (Optional)
1. Add browser warning when trying to leave page with unsaved changes
2. Add auto-save functionality (similar to AssignmentBuilderPage)
3. Add "Discard changes" button
4. Show what fields were changed
5. Add timestamp of last save
