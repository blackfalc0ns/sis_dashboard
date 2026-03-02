# Same Route Navigation Prevention

## Overview
Implemented route equality checks to prevent unnecessary navigation, loading states, and progress bar activation when clicking the currently active tab/route.

## Problem
When users clicked on the same sidebar tab they were already on, the system would:
- Trigger navigation (router.push)
- Show loading states (spinner in sidebar)
- Display progress bar
- Potentially trigger data refetches
- Show unsaved changes guard unnecessarily

This created a poor UX with unnecessary loading indicators and wasted resources.

## Solution
Added pathname comparison logic to both `GuardedLink` and `useGuardedRouter` to detect and prevent same-route navigation. Also added `onNavigationStart` callback to GuardedLink so parent components only set pending states when navigation actually occurs.

## Implementation Details

### 1. Route Normalization Function
Created `normalizePathname()` helper that:
- Handles absolute URLs (http/https)
- Handles relative URLs
- Strips query parameters and hash fragments
- Returns clean pathname for comparison

```typescript
function normalizePathname(href: string, currentPathname: string): string {
  // Handles various URL formats and returns clean pathname
}
```

### 2. GuardedLink Component
**File**: `src/components/navigation/GuardedLink.tsx`

**Changes**:
- Added `usePathname()` hook to get current route
- Added `onNavigationStart` callback prop
- Added route comparison before navigation
- If target === current pathname:
  - Prevent default
  - Call onClick callback (if provided)
  - Return early (no navigation, no progress, no guard, no onNavigationStart)
- If different route:
  - Call onNavigationStart callback
  - Proceed with normal guarded navigation flow

**New Prop**:
```typescript
interface GuardedLinkProps {
  // ... existing props
  onNavigationStart?: () => void; // Called only when navigation actually starts
}
```

**Behavior**:
```typescript
// Same route - do nothing
if (targetPathname === currentPathname) {
  onClick?.(e);
  return; // onNavigationStart NOT called
}

// Different route - navigate
onNavigationStart?.(); // Called before navigation
guardedNavigate(() => {
  progress.start();
  router.push(href);
});
```

### 3. useGuardedRouter Hook
**File**: `src/hooks/useGuardedRouter.ts`

**Changes**:
- Added `usePathname()` and `useProgressBar()` hooks
- Added route comparison in `push()` and `replace()` methods
- If target === current pathname:
  - Return early (no navigation, no progress, no guard)
- If different route:
  - Start progress bar
  - Proceed with guarded navigation

**Behavior**:
```typescript
const push = useCallback((href: string) => {
  const targetPathname = normalizePathname(href, pathname);
  if (targetPathname === pathname) {
    return; // Same route - do nothing
  }
  
  guardedNavigate(() => {
    progress.start();
    router.push(href);
  });
}, [guardedNavigate, router, pathname, progress]);
```

### 4. Sidebar Integration
**File**: `src/components/layout/Sidebar.tsx`

**Changes**:
- Split `handleItemClick` into two functions:
  - `handleItemClick(key)` - handles selection callback only
  - `handleNavigationStart(href)` - sets pending state only when navigation starts
- Updated all GuardedLink usages to use both callbacks:
  - `onClick={() => handleItemClick(key)}` - always called
  - `onNavigationStart={() => handleNavigationStart(href)}` - only called when navigating

**Before**:
```typescript
const handleItemClick = (key: string, href: string) => {
  setPendingHref(href); // Always set, even for same route
  onSelect?.(key);
};

<GuardedLink onClick={() => handleItemClick(key, href)} />
```

**After**:
```typescript
const handleItemClick = (key: string) => {
  onSelect?.(key);
};

const handleNavigationStart = (href: string) => {
  setPendingHref(href); // Only set when navigation actually starts
};

<GuardedLink 
  onClick={() => handleItemClick(key)}
  onNavigationStart={() => handleNavigationStart(href)}
/>
```

## Benefits

### User Experience
- No loading spinner when clicking active tab
- No progress bar animation
- No unsaved changes dialog
- Instant feedback (nothing happens = already there)
- Cleaner, more polished feel

### Performance
- No unnecessary router.push() calls
- No data refetches triggered by navigation
- No React re-renders from navigation state changes
- Reduced server load

### Developer Experience
- Centralized logic in navigation primitives
- Clean separation of concerns (selection vs navigation)
- Works automatically for all GuardedLink usage
- Consistent behavior across the app

## Testing

### Manual Testing Checklist
1. ✅ Click active sidebar tab → No navigation, no loading spinner
2. ✅ Click different sidebar tab → Normal navigation with spinner and progress
3. ✅ Click active tab with unsaved changes → No guard dialog
4. ✅ Click different tab with unsaved changes → Guard dialog shows
5. ✅ Programmatic navigation with useGuardedRouter → Same behavior
6. ✅ Routes with query params → Correctly compared by pathname only
7. ✅ RTL/Arabic navigation → Works correctly
8. ✅ Nested routes (children/grandchildren) → Works correctly

### Edge Cases Handled
- Absolute URLs (http/https)
- Relative URLs
- URLs with query parameters
- URLs with hash fragments
- Nested sidebar items
- Collapsed sidebar navigation
- Mobile sidebar navigation

## Technical Notes

### Pathname-Only Comparison
The implementation compares **pathname only**, ignoring:
- Query parameters (`?year=2024&term=1`)
- Hash fragments (`#section`)

This is appropriate for sidebar navigation where tabs are distinguished by pathname, not query params.

### Query Parameter Handling
If you need to treat routes with different query params as different routes:
1. Extend `normalizePathname()` to include query params
2. Use `useSearchParams()` to get current query params
3. Compare both pathname and query string

### Back Button
The `back()` method in `useGuardedRouter` does NOT check for same route because:
- We don't know the target route until after navigation
- Back navigation is intentional user action
- Browser handles back button state correctly

### onNavigationStart Callback
The new `onNavigationStart` prop is optional and backward compatible:
- If not provided, GuardedLink works as before (just without parent notification)
- If provided, only called when navigation actually occurs
- Allows parent components to set loading states accurately

## Files Modified

1. **src/components/navigation/GuardedLink.tsx**
   - Added `usePathname()` hook
   - Added `normalizePathname()` helper
   - Added `onNavigationStart` prop
   - Added route comparison logic
   - Updated JSDoc comments

2. **src/hooks/useGuardedRouter.ts**
   - Added `usePathname()` and `useProgressBar()` hooks
   - Added `normalizePathname()` helper
   - Added route comparison in `push()` and `replace()`
   - Updated JSDoc comments

3. **src/components/layout/Sidebar.tsx**
   - Split `handleItemClick` into two functions
   - Added `handleNavigationStart` function
   - Updated all GuardedLink usages with both callbacks
   - Fixed pending state to only show during actual navigation

## Related Features

This enhancement works seamlessly with:
- ✅ Global progress bar (ProgressBarProvider)
- ✅ Navigation guards (NavigationGuardProvider)
- ✅ Unsaved changes detection (useDirtyKey)
- ✅ Route prefetching on hover
- ✅ Pending state visual feedback (spinner in sidebar)
- ✅ Loading states (loading.tsx files)
- ✅ Suspense boundaries

## Future Enhancements

Potential improvements:
1. Add query parameter comparison option (opt-in)
2. Add route comparison with hash fragments
3. Add analytics event for "same route click" (user confusion metric)
4. Add visual feedback (subtle pulse/shake) when clicking active tab
5. Add accessibility announcement "Already on this page"

## Conclusion

Same-route navigation prevention is now fully functional across the entire dashboard. Users will experience smoother, more responsive navigation with no unnecessary loading states when clicking the active tab. The sidebar spinner only appears when actual navigation occurs.
