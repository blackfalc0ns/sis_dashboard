# Assignment Builder Auto-Save Implementation

## Overview
Implemented a robust auto-save system for the Assignment Builder that handles assignment metadata and question edits with proper debouncing, race condition prevention, and clear status indicators.

## Features Implemented

### 1. Core Auto-Save Hook (`useAutoSave.ts`)
A reusable hook that provides:
- **Debounced saves**: Waits 800ms after user stops typing before saving
- **Race condition prevention**: Tracks in-flight requests and queues pending changes
- **Revision tracking**: Ensures out-of-order responses don't overwrite newer state
- **Status management**: Provides clear status (idle, dirty, saving, saved, error)
- **Retry mechanism**: Allows manual retry after errors
- **Flush capability**: Can force immediate save (e.g., on blur)

### 2. Auto-Save Status Indicator
Updated `BuilderHeader` to show real-time save status:
- **Saving**: Blue chip with spinner icon + "Saving..." / "جارٍ الحفظ..."
- **Saved**: Green chip with checkmark + time since last save (e.g., "Saved", "2m", "1h")
- **Dirty**: Blue chip showing "Unsaved" / "تغييرات غير محفوظة"
- **Error**: Red chip with alert icon + "Save failed (Retry)" - clickable to retry

### 3. Integration Points

#### Assignment Metadata Auto-Save
- Triggers on changes to: `titleAr`, `titleEn`, `descriptionAr`, `descriptionEn`, `dueDate`, `maxScore`
- Debounce: 800ms
- Integrates with existing `saveAssignment()` mutation

#### Question Auto-Save
- Triggers on changes to question fields
- Debounce: 800ms
- Integrates with existing `updateQuestion()` mutation

### 4. Dirty State Management
- Marks dirty immediately on any edit
- Clears dirty only when save completes successfully
- Integrates with global `UnsavedChangesProvider`
- Navigation guard still works correctly

## How It Works

### Debouncing Flow
```
User types → setDraft() → Mark dirty → Schedule save (800ms)
User types again → Cancel previous timer → Schedule new save (800ms)
Timer expires → performSave() → Mark saving → Call onSave()
Save succeeds → Mark saved → Clear dirty → Update lastSavedAt
```

### Race Condition Handling
```
Save 1 starts (revision 1)
User edits (revision 2) → Mark pending
Save 1 completes → Check pending → Start Save 2
Save 2 starts (revision 2)
Save 2 completes → No pending → Done
```

### Error Handling
```
Save fails → Mark error → Keep dirty → Show retry button
User clicks retry → performSave() → Try again
```

## Files Changed

### Created
1. `src/features/academics/assignments/builder/hooks/useAutoSave.ts` - Core auto-save hook

### Modified
1. `src/features/academics/assignments/builder/components/BuilderHeader.tsx`
   - Added auto-save status props
   - Added status indicator UI
   - Added retry button for errors

2. `src/features/academics/assignments/builder/pages/AssignmentBuilderPage.tsx`
   - Integrated `useAutoSave` hook for assignment and questions
   - Updated `handleUpdateAssignment` to trigger auto-save
   - Updated `handleUpdateQuestion` to trigger auto-save
   - Passed auto-save status to header

3. `src/messages/en.json` & `src/messages/ar.json`
   - Added: `common.saving`, `common.saved`, `common.save_error`, `common.retry`

## Testing Guide

### Test 1: Type Quickly in Title
**Steps:**
1. Open assignment builder
2. Type rapidly in title field (Arabic or English)
3. Stop typing

**Expected:**
- Status shows "Unsaved" immediately
- After 800ms, status changes to "Saving..."
- After save completes, status shows "Saved" with checkmark
- Only ONE save request sent (check Network tab)

### Test 2: Rapid Changes to Correct Answer
**Steps:**
1. Select a question with MCQ type
2. Click different correct answer options rapidly (5-6 times)
3. Stop clicking

**Expected:**
- Status shows "Unsaved" during clicks
- After 800ms, status changes to "Saving..."
- Last selected answer is saved
- Only ONE save request sent with final state

### Test 3: Simulate Network Error
**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Edit assignment title
4. Wait for save attempt

**Expected:**
- Status shows "Saving..."
- After timeout, status shows "Save failed (Retry)" in red
- Click retry button
- Set network back to "Online"
- Save succeeds and status shows "Saved"

### Test 4: Navigate Away with Unsaved Changes
**Steps:**
1. Edit assignment title
2. Immediately click "Back to Lesson" (before auto-save completes)

**Expected:**
- Unsaved changes dialog appears
- Options: "Stay" or "Leave"
- If "Stay": remains on page, auto-save continues
- If "Leave": navigates away, changes lost

### Test 5: Read-Only Mode (Closed Term)
**Steps:**
1. Navigate to assignment with `?termStatus=closed`
2. Try to edit any field

**Expected:**
- All fields disabled
- No auto-save triggers
- No status indicator shows

### Test 6: Multiple Rapid Edits Across Fields
**Steps:**
1. Edit title (type 5 characters)
2. Immediately edit description (type 5 characters)
3. Immediately change max score
4. Stop editing

**Expected:**
- Status shows "Unsaved" throughout
- After 800ms from last edit, ONE save request sent
- Save includes all changes
- Status shows "Saved"

### Test 7: Save Status Timing
**Steps:**
1. Edit title and wait for auto-save
2. Note the "Saved" indicator
3. Wait 1 minute
4. Check status

**Expected:**
- Initially shows "Saved" with checkmark
- After 1 minute, shows "1m" (time since save)
- After 1 hour, shows "1h"

### Test 8: Manual Save Button
**Steps:**
1. Edit title
2. Immediately click "Save" button (before auto-save)

**Expected:**
- Manual save triggers immediately
- Auto-save timer is cancelled
- Status shows "Saving..." then "Saved"
- Dirty state clears

## Configuration

### Debounce Timing
```typescript
// In AssignmentBuilderPage.tsx
const assignmentAutoSave = useAutoSave({
  debounceMs: 800, // Change this value to adjust timing
  // ...
});
```

### Disable Auto-Save
Auto-save is automatically disabled when:
- `isReadOnly = true` (term is closed)
- `assignment` is null (not loaded yet)
- `enabled: false` passed to hook

## Performance Considerations

### Optimizations
1. **Debouncing**: Prevents spam requests during rapid typing
2. **Revision tracking**: Prevents stale data from overwriting fresh edits
3. **Pending flag**: Queues changes during in-flight requests instead of cancelling
4. **Local state updates**: UI updates immediately, save happens in background

### Network Impact
- Typical scenario: 1 save per 800ms of inactivity
- Heavy editing: ~1-2 saves per minute
- No editing: 0 saves (no polling)

## Known Limitations

1. **Validation**: Currently saves even with validation errors. Consider adding validation gating in future.
2. **Offline support**: No local storage fallback for offline edits.
3. **Conflict resolution**: Last-write-wins strategy (no merge conflict UI).
4. **Attachments**: Not auto-saved (requires explicit upload action).

## Future Enhancements

1. **Validation Gating**: Only auto-save when data is valid
2. **Selective Field Updates**: Send only changed fields to reduce payload
3. **Offline Queue**: Store failed saves in IndexedDB and retry when online
4. **Conflict Detection**: Detect if another user edited the same assignment
5. **Optimistic UI**: Show changes immediately with rollback on error
6. **Save History**: Track save history for undo/redo functionality

## Troubleshooting

### Auto-save not triggering
- Check: Is `isReadOnly = false`?
- Check: Is `assignment` loaded?
- Check: Are you editing a field that triggers `handleUpdateAssignment`?
- Check: Console for errors

### Multiple saves happening
- Check: Debounce timing (should be 800ms)
- Check: Are multiple fields being edited simultaneously?
- Check: Network tab for duplicate requests

### Status stuck on "Saving..."
- Check: Network tab for failed requests
- Check: Console for errors
- Check: Is backend responding?

### Dirty state not clearing
- Check: Is save completing successfully?
- Check: Is `clearDirty()` being called after save?
- Check: Console for errors in save handler

## Summary

The auto-save implementation provides a robust, user-friendly experience with:
- ✅ Debounced saves (800ms)
- ✅ Race condition prevention
- ✅ Clear status indicators
- ✅ Error handling with retry
- ✅ Integration with dirty tracking
- ✅ No backend changes required
- ✅ Fully localized (AR/EN)
- ✅ Read-only mode support

The system is production-ready and handles edge cases gracefully while maintaining data integrity.
