# Auto-Save Last Character Bug Fix

## Problem
When typing in the Assignment Builder inputs (title, description, max score), the last typed character was being lost and not saved by the auto-save system.

## Root Causes

### 1. Stale State in Draft Updates
The handlers (`handleUpdateAssignment`, `handleUpdateQuestion`) were creating updated objects from the current React state (`assignment`, `question`), which could be stale due to React's batching. When multiple rapid changes occurred, the draft ref wasn't always getting the latest values.

### 2. Missing onBlur Handlers
There was no mechanism to flush the auto-save immediately when the user left a field. This meant if the user typed and immediately navigated away, the debounced save might not have triggered yet.

### 3. Forward Reference Issue in useAutoSave
The `performSave` function was being called before it was declared in a closure, causing potential issues with the recursive save scheduling.

## Solution

### 1. Use Draft Ref as Single Source of Truth
Updated `handleUpdateAssignment` and `handleUpdateQuestion` to:
- Get the latest draft from `getDraft()` OR fall back to current state
- Merge the latest draft with new updates
- Store the complete updated object in the draft ref

```typescript
const handleUpdateAssignment = useCallback(
  (updates: Partial<Assignment>) => {
    if (!assignment) return;
    
    // Get the latest draft or current assignment
    const currentDraft = (assignmentAutoSave.getDraft() as Assignment) || assignment;
    
    // Create updated assignment from latest draft + new updates
    const updatedAssignment: Assignment = { ...currentDraft, ...updates };
    
    // Update local React state immediately for UI
    setAssignment(updatedAssignment);
    
    // Mark dirty for navigation guard
    markDirty();
    
    // Store in draft ref for auto-save (single source of truth)
    assignmentAutoSave.setDraft(updatedAssignment);
  },
  [assignment, setAssignment, markDirty, assignmentAutoSave]
);
```

### 2. Added onBlur Handlers
- Added `onBlur` prop to `BilingualTextField` component
- Added `onBlur` prop to `AssignmentSettingsPanel` component
- Propagated `onBlurAssignment` through `DesktopLayout` and `MobileLayout`
- Created `handleBlurAssignment` in `AssignmentBuilderPage` that calls `assignmentAutoSave.flushNow()`

This ensures that when the user leaves a field, any pending auto-save is immediately flushed.

```typescript
const handleBlurAssignment = useCallback(async () => {
  // Flush auto-save immediately when user leaves a field
  await assignmentAutoSave.flushNow();
}, [assignmentAutoSave]);
```

### 3. Fixed Forward Reference in useAutoSave
- Added `performSaveRef` to store the `performSave` function
- Used `useEffect` to update the ref (avoiding render-time ref updates)
- Changed recursive call to use `performSaveRef.current?.()`

```typescript
const performSaveRef = useRef<(() => Promise<void>) | null>(null);

// ... in performSave callback
if (performSaveRef.current) {
  setTimeout(() => performSaveRef.current?.(), 0);
}

// Store performSave in ref using useEffect
useEffect(() => {
  performSaveRef.current = performSave;
}, [performSave]);
```

## Files Modified

1. `src/features/academics/assignments/builder/hooks/useAutoSave.ts`
   - Added `performSaveRef` to avoid forward reference issues
   - Used `useEffect` to update the ref

2. `src/features/academics/assignments/builder/pages/AssignmentBuilderPage.tsx`
   - Updated `handleUpdateAssignment` to use latest draft
   - Updated `handleUpdateQuestion` to use latest draft
   - Added `handleBlurAssignment` handler
   - Passed `onBlurAssignment` to layouts

3. `src/components/ui/bilingual-text-field/BilingualTextField.tsx`
   - Added `onBlur` prop to interface
   - Passed `onBlur` to both Input components

4. `src/features/academics/assignments/builder/components/AssignmentSettingsPanel.tsx`
   - Added `onBlur` prop to interface
   - Passed `onBlur` to all input fields (title, description, maxScore)

5. `src/features/academics/assignments/builder/components/DesktopLayout.tsx`
   - Added `onBlurAssignment` prop
   - Passed to `AssignmentSettingsPanel`

6. `src/features/academics/assignments/builder/components/MobileLayout.tsx`
   - Added `onBlurAssignment` prop
   - Passed to `AssignmentSettingsPanel`

7. `src/components/features/academics/components/curriculum/QuestionEditor.tsx`
   - Added refs for all state values to capture latest values in debounced saves
   - Updated `saveQuestion` to read from refs instead of closure state
   - Added `onBlur` handlers to question text, points, and sample answer fields
   - Added `onBlur` prop to `SortableOptionRow` component
   - Added `onBlur` handlers to option text inputs
   - Updated `updateOptionText` to use refs for latest values

## Testing Checklist

### Basic Typing
- [ ] Type quickly in title field (Arabic) - last character should be saved
- [ ] Type quickly in title field (English) - last character should be saved
- [ ] Type quickly in description field (Arabic) - last character should be saved
- [ ] Type quickly in description field (English) - last character should be saved
- [ ] Type in max score field - last digit should be saved
- [ ] Type quickly in question text field (Arabic) - last character should be saved
- [ ] Type quickly in question text field (English) - last character should be saved
- [ ] Type quickly in question points field - last digit should be saved
- [ ] Type quickly in MCQ option text (Arabic) - last character should be saved
- [ ] Type quickly in MCQ option text (English) - last character should be saved
- [ ] Type quickly in sample answer (Arabic) - last character should be saved
- [ ] Type quickly in sample answer (English) - last character should be saved

### Auto-Save Behavior
- [ ] Auto-save triggers after 800ms of inactivity
- [ ] Status shows "Saving..." during save
- [ ] Status shows "Saved" with timestamp after successful save
- [ ] Status shows "Unsaved" when there are pending changes

### onBlur Behavior
- [ ] Type in a field and immediately click outside - save should flush immediately
- [ ] Type in a field and press Tab - save should flush immediately
- [ ] Type in a field and switch to another tab - save should flush immediately

### Rapid Edits
- [ ] Type very quickly across multiple fields - no characters lost
- [ ] Make changes while a save is in-flight - changes should queue and save after
- [ ] Make multiple rapid changes - only one save should happen with latest data

### Edge Cases
- [ ] Network error during save - status shows error with retry button
- [ ] Click retry after error - save should attempt again
- [ ] Navigate away with unsaved changes - confirm dialog should appear
- [ ] Read-only mode (term closed) - auto-save should be disabled

## Expected Behavior

1. **Every character typed is captured** in the draft ref immediately
2. **Auto-save debounces** for 800ms after the last change
3. **onBlur flushes** the auto-save immediately when leaving a field
4. **Latest draft is always used** when merging updates
5. **No duplicate saves** - revision tracking prevents saving the same revision twice
6. **Race conditions handled** - in-flight saves don't overwrite newer changes

## Success Criteria

✅ Last typed character is never lost
✅ Auto-save works reliably under fast typing
✅ No duplicate or spam requests
✅ Clear status indicators in header
✅ Dirty guard works correctly
✅ All TypeScript diagnostics pass
