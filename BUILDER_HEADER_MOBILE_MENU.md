# Builder Header Mobile Menu Implementation

## Overview
Added responsive button layout for the Assignment Builder Header that shows all action buttons on desktop and uses a dropdown menu on mobile screens to save space.

## Changes Made

### Updated BuilderHeader Component
**File**: `src/features/academics/assignments/builder/components/BuilderHeader.tsx`

**Changes**:
1. Added `useMediaQuery` and `useTheme` imports from MUI
2. Added `MoreVertical` icon from lucide-react
3. Added `DropdownMenu` component import
4. Added responsive detection: `isMobile = useMediaQuery(theme.breakpoints.down("md"))`
5. Replaced MUI Menu with existing DropdownMenu component

### Desktop Layout (md and up)
Shows all buttons inline:
- **Save** button (secondary, with Save icon)
- **Publish / Unpublish** button (primary/secondary, with Eye/EyeOff icon)
- **Reset** button (secondary, with RotateCcw icon, disabled when not dirty)
- **Delete** button (danger, with Trash icon)

### Mobile Layout (below md)
Shows:
- **Save** button (primary, with Save icon)
- **More** button (three dots icon) that opens dropdown menu

**Dropdown Menu Items**:
- **Publish / Unpublish** (with Eye/EyeOff icon)
- **Reset** (with RotateCcw icon, disabled when not dirty)
- **Delete** (with Trash icon in red)

## Responsive Breakpoint
- Uses `theme.breakpoints.down("md")` (below 768px)
- Desktop: Shows all buttons inline
- Mobile: Shows Save + More dropdown

## User Flow

### Desktop
1. User sees all action buttons inline in header
2. Clicks any button to perform action
3. Action executes immediately

### Mobile
1. User sees Save button and More button (three dots)
2. Clicks More button to open dropdown menu
3. Selects action from menu (Publish/Unpublish, Reset, or Delete)
4. Menu closes automatically after action

## Technical Details

- **Menu Component**: Uses existing `DropdownMenu` component
- **Menu Trigger**: Custom button with MoreVertical icon
- **Menu Width**: 192px (`w-48`)
- **Menu Close**: Automatically closes after action execution via `onClick` handlers
- **Icon Spacing**: Icons included in dropdown items
- **Delete Color**: Red icon color for delete action
- **Disabled State**: Reset menu item disabled when `!isDirty`
- **Save Button**: Changes to primary variant on mobile for emphasis
- **RTL Support**: DropdownMenu handles RTL automatically

## Benefits

✅ Saves space on mobile screens
✅ All actions still accessible
✅ Better mobile UX with larger touch targets
✅ Consistent with mobile design patterns
✅ Uses existing DropdownMenu component (no new dependencies)
✅ Save button more prominent on mobile (primary variant)
✅ Auto-save status indicators still visible
✅ Read-only mode still enforced
✅ RTL support built-in

## Files Modified

1. `src/features/academics/assignments/builder/components/BuilderHeader.tsx`

## Testing Checklist

- [ ] Desktop: All buttons show inline
- [ ] Mobile: Save button + More button show
- [ ] Mobile: More button opens dropdown menu
- [ ] Mobile: Publish/Unpublish action works from menu
- [ ] Mobile: Reset action works from menu (disabled when not dirty)
- [ ] Mobile: Delete action works from menu
- [ ] Mobile: Menu closes after action
- [ ] Mobile: Menu closes when clicking outside
- [ ] Auto-save status indicators work on both layouts
- [ ] RTL layout works correctly
- [ ] Icons display correctly in menu items
- [ ] Save button is primary on mobile, secondary on desktop
- [ ] Dropdown menu aligns correctly (right for LTR, left for RTL)
