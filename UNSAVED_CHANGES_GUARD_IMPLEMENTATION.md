# Global Unsaved Changes Guard - Implementation Complete

## Overview
Implemented a comprehensive global unsaved changes guard system for the Next.js App Router dashboard. The system prevents users from accidentally losing unsaved work by intercepting navigation attempts and showing a confirmation dialog.

## Architecture

### 1. Global Dirty State Store (Context)
**File:** `src/providers/UnsavedChangesProvider.tsx`

Provides global state management for tracking unsaved changes across the dashboard:
- `setDirty(key, dirty)`: Mark a feature as dirty/clean
- `clearDirty(key)`: Clear dirty state for a feature
- `isDirty`: Boolean indicating if any feature has unsaved changes
- `dirtyKeys`: Array of all dirty feature keys
- `resetAll()`: Clear all dirty states

**Usage:**
```tsx
const { setDirty, clearDirty, isDirty } = useUnsavedChanges();
```

### 2. Navigation Guard Provider
**File:** `src/providers/NavigationGuardProvider.tsx`

Manages the confirmation dialog and navigation interception:
- Reads `isDirty` from UnsavedChangesProvider
- Shows confirmation dialog when navigation is attempted with unsaved changes
- Handles `beforeunload` event for browser refresh/close
- Provides `guardedNavigate()` function for protected navigation

**Features:**
- Confirmation dialog with "Stay" and "Leave" buttons
- Localized messages (EN/AR)
- Browser refresh/close protection via `beforeunload`
- Pending action queue for navigation after confirmation

### 3. Guarded Navigation Components

#### GuardedLink Component
**File:** `src/components/navigation/GuardedLink.tsx`

Replacement for `next/link` that checks for unsaved changes:
```tsx
<GuardedLink href="/dashboard/academics">
  Academics
</GuardedLink>
```

**Props:**
- `href`: Navigation destination
- `className`: CSS classes
- `replace`: Use router.replace instead of push
- `onClick`: Custom click handler
- `disabled`: Disable navigation
- `title`: Link title attribute

#### useGuardedRouter Hook
**File:** `src/hooks/useGuardedRouter.ts`

Provides guarded router methods for programmatic navigation:
```tsx
const router = useGuardedRouter();
router.push("/dashboard/calendar");
router.replace("/dashboard/structure");
router.back();
```

### 4. Feature Integration Hook
**File:** `src/hooks/useDirtyKey.ts`

Simplified hook for features to mark themselves as dirty:
```tsx
const { markDirty, clearDirty } = useDirtyKey("teacher-allocation");

// When user makes changes
markDirty();

// After save success
clearDirty();
```

**Features:**
- Auto-clears dirty state on component unmount
- Prevents stale dirty states

## Integration Points

### 1. Dashboard Layout
**File:** `src/app/[lang]/(dashboard)/layout.tsx`

Wrapped with both providers:
```tsx
<UnsavedChangesProvider>
  <NavigationGuardProvider>
    <SideBarTopNav>{children}</SideBarTopNav>
  </NavigationGuardProvider>
</UnsavedChangesProvider>
```

### 2. Sidebar Navigation
**File:** `src/components/layout/Sidebar.tsx`

Updated to use `GuardedLink` instead of `next/link`:
- All menu items use GuardedLink
- All child/grandchild navigation items use GuardedLink
- Bottom navigation items use GuardedLink

### 3. Example Implementation: Teacher Allocation
**File:** `src/components/features/academics/components/pages/TeacherAllocationPage.tsx`

Integrated dirty state tracking:
```tsx
const { markDirty, clearDirty } = useDirtyKey("teacher-allocation");

// Mark dirty when allocations change
const handleAllocationsChange = useCallback((allocations) => {
  setCurrentAllocations(allocations);
  const hasChanges = JSON.stringify(allocations) !== JSON.stringify(teacherAllocations);
  if (hasChanges) {
    markDirty();
  } else {
    clearDirty();
  }
}, [teacherAllocations, markDirty, clearDirty]);

// Clear dirty after save/refresh
const refreshData = async () => {
  // ... fetch data
  clearDirty();
};
```

## Translation Keys

### English (`src/messages/en.json`)
```json
{
  "common": {
    "unsavedChangesTitle": "Unsaved changes",
    "unsavedChangesBody": "You have unsaved changes. Leave without saving?",
    "stay": "Stay",
    "leave": "Leave"
  }
}
```

### Arabic (`src/messages/ar.json`)
```json
{
  "common": {
    "unsavedChangesTitle": "تغييرات غير محفوظة",
    "unsavedChangesBody": "لديك تغييرات غير محفوظة. هل تريد الخروج بدون حفظ؟",
    "stay": "البقاء",
    "leave": "خروج"
  }
}
```

## How It Works

### Navigation Flow

1. **User makes changes** → Feature calls `markDirty()`
2. **User clicks navigation link** → GuardedLink intercepts
3. **Check dirty state** → If dirty, show confirmation dialog
4. **User clicks "Stay"** → Cancel navigation, stay on page
5. **User clicks "Leave"** → Proceed with navigation
6. **User saves changes** → Feature calls `clearDirty()`

### Browser Refresh/Close

When `isDirty` is true:
- `beforeunload` event listener is added
- Browser shows native confirmation dialog
- User can cancel or proceed with page unload

## Testing Scenarios

### Test Case 1: Basic Navigation Guard
1. Open Teacher Allocation page
2. Make a change (assign a teacher)
3. Click any sidebar link
4. **Expected:** Confirmation dialog appears
5. Click "Stay"
6. **Expected:** Remain on Teacher Allocation page
7. Click sidebar link again
8. Click "Leave"
9. **Expected:** Navigate to selected page

### Test Case 2: Save Clears Dirty State
1. Open Teacher Allocation page
2. Make a change
3. Save changes (or refresh data)
4. Click any sidebar link
5. **Expected:** Navigate immediately without dialog

### Test Case 3: Browser Refresh
1. Open Teacher Allocation page
2. Make a change
3. Press F5 or Ctrl+R
4. **Expected:** Browser shows "Leave site?" confirmation
5. Cancel
6. **Expected:** Remain on page with changes

### Test Case 4: Browser Close
1. Open Teacher Allocation page
2. Make a change
3. Close browser tab/window
4. **Expected:** Browser shows "Leave site?" confirmation

### Test Case 5: Multiple Features
1. Open Teacher Allocation, make changes (dirty)
2. Navigate to Calendar (via "Leave")
3. Make changes in Calendar (dirty)
4. Try to navigate
5. **Expected:** Dialog appears (Calendar is dirty)

### Test Case 6: Programmatic Navigation
1. Open Teacher Allocation page
2. Make a change
3. Use any button that calls `router.push()` (if using useGuardedRouter)
4. **Expected:** Confirmation dialog appears

### Test Case 7: RTL Support
1. Switch to Arabic language
2. Make changes in any feature
3. Try to navigate
4. **Expected:** Dialog appears with Arabic text, RTL layout

## Integration Guide for Other Features

To add unsaved changes protection to any feature:

### Step 1: Import the hook
```tsx
import { useDirtyKey } from "@/hooks/useDirtyKey";
```

### Step 2: Initialize with unique key
```tsx
const { markDirty, clearDirty } = useDirtyKey("my-feature-name");
```

### Step 3: Mark dirty when changes occur
```tsx
const handleChange = (newValue) => {
  setValue(newValue);
  markDirty(); // Mark as dirty
};
```

### Step 4: Clear dirty after save
```tsx
const handleSave = async () => {
  await saveData();
  clearDirty(); // Clear dirty state
};
```

### Step 5: Clear dirty on discard/reset
```tsx
const handleDiscard = () => {
  resetForm();
  clearDirty(); // Clear dirty state
};
```

## Feature Keys Convention

Use descriptive, kebab-case keys for features:
- `"teacher-allocation"` - Teacher Allocation page
- `"subjects-allocation"` - Subjects Allocation page
- `"calendar"` - Academic Calendar
- `"curriculum"` - Curriculum editor
- `"student-profile"` - Student profile editor
- `"admissions-application"` - Admissions application form

## Files Created

1. `src/providers/UnsavedChangesProvider.tsx` - Global dirty state store
2. `src/providers/NavigationGuardProvider.tsx` - Navigation guard with dialog
3. `src/hooks/useDirtyKey.ts` - Feature integration hook
4. `src/components/navigation/GuardedLink.tsx` - Guarded link component
5. `src/hooks/useGuardedRouter.ts` - Guarded router hook

## Files Modified

1. `src/app/[lang]/(dashboard)/layout.tsx` - Added providers
2. `src/components/layout/Sidebar.tsx` - Replaced Link with GuardedLink
3. `src/components/features/academics/components/pages/TeacherAllocationPage.tsx` - Added dirty state tracking
4. `src/messages/en.json` - Added translation keys
5. `src/messages/ar.json` - Added translation keys

## Technical Notes

### Why Not Global Router Interception?

Next.js App Router doesn't provide `router.events` like Pages Router. Navigation cannot be globally intercepted. Instead, we:
1. Wrap all navigation components (GuardedLink)
2. Provide guarded router hook (useGuardedRouter)
3. Ensure all dashboard navigation uses these components

### Performance Considerations

- Dirty state uses Set for O(1) lookups
- Context updates only when dirty keys change
- No unnecessary re-renders
- Auto-cleanup on component unmount

### Limitations

- Only works for navigation through GuardedLink or useGuardedRouter
- Direct `router.push()` calls bypass the guard (must use useGuardedRouter)
- External links are not guarded
- Browser back button uses native browser confirmation (cannot be customized)

## Future Enhancements

1. **Auto-save**: Implement auto-save functionality to reduce need for guard
2. **Dirty state persistence**: Store dirty keys in sessionStorage for recovery
3. **Granular dirty tracking**: Track which specific fields are dirty
4. **Undo/Redo**: Implement undo/redo functionality
5. **Conflict resolution**: Handle concurrent edits from multiple tabs

## Status

✅ Global dirty state store implemented
✅ Navigation guard provider with dialog implemented
✅ GuardedLink component created
✅ useGuardedRouter hook created
✅ useDirtyKey helper hook created
✅ Dashboard layout wrapped with providers
✅ Sidebar updated to use GuardedLink
✅ Teacher Allocation integrated as example
✅ Translation keys added (EN/AR)
✅ beforeunload handler for browser refresh/close
✅ Ready for production use
