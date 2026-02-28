# Teacher Select UI Refactor - Implementation Complete

## Overview
Refactored the TeacherSelect component to match the required UI design: a normal Select dropdown when closed, with a search TextField appearing as the first item inside the dropdown menu when opened. The bilingual search functionality is preserved.

## UI Design Changes

### Before (Autocomplete)
- Search input always visible
- Autocomplete-style dropdown
- Search box outside/above the menu

### After (Select with Internal Search)
- **Closed state:** Normal Select dropdown (no search visible)
- **Open state:** Search TextField appears as first item inside menu
- List scrolls under the sticky search input
- Selecting an item closes the menu and updates value

## Implementation Details

### 1. Component Refactor
**File:** `src/components/features/academics/components/teacher-allocation/TeacherSelect.tsx`

**Key Changes:**
- Replaced `Autocomplete` with `Select` + `MenuItem`
- Added `ListSubheader` for sticky search input at top of menu
- Implemented state management:
  - `searchQuery`: tracks search input value
  - `isOpen`: tracks menu open/close state
  - `searchInputRef`: ref for auto-focusing search input

**UI Structure:**
```tsx
<Select>
  <ListSubheader> {/* Sticky at top */}
    <TextField /> {/* Search input */}
  </ListSubheader>
  
  {filteredOptions.map(option => (
    <MenuItem>{/* Teacher with load badge */}</MenuItem>
  ))}
  
  {/* Or "No results" if empty */}
</Select>
```

### 2. Sticky Search Input
**Implementation:**
- Used `ListSubheader` component with `position: sticky`
- `top: 0` and `zIndex: 2` to stay above scrolling items
- `backgroundColor: white` to prevent transparency
- Event handlers to prevent menu closing:
  - `onKeyDown={(e) => e.stopPropagation()}`
  - `onClick={(e) => e.stopPropagation()}`

### 3. Auto-Focus Behavior
- `useEffect` watches `isOpen` state
- When menu opens, focuses search input after 100ms delay
- When menu closes, clears search query

### 4. Menu Styling
**MenuProps:**
- `maxHeight: 320px` for scrollable list
- `paddingTop: 0` so sticky search touches top
- `borderRadius: 3` with 2px primary border
- Box shadow for depth

**Select Styling:**
- 2px primary color border
- Hover state with darker primary
- Disabled state with gray background
- `minWidth: 200px` for compact use in table cells

### 5. Bilingual Search (Preserved)
- Uses existing `normalizeSearchText()` and `buildSearchText()` utilities
- Filters options based on normalized query
- Searches both Arabic and English names
- Works regardless of UI language

### 6. Teacher Load Display (Preserved)
- Shows load badge: "24/wk" or "24/أسبوع"
- Highlights overloaded teachers (yellow background)
- Displays max load: "/ 30"

### 7. Translation Keys
**Files:** `src/messages/en.json`, `src/messages/ar.json`

Added `academics.teacherAllocation.matrix.searchTeacher`:
- EN: "Search teacher..."
- AR: "ابحث عن معلم..."

## Technical Details

### Event Handling
- `onOpen` / `onClose`: Track menu state
- `onChange`: Handle teacher selection
- `stopPropagation()`: Prevent menu closing while typing in search

### Performance
- `useMemo` for building teacher options (only when teachers/locale change)
- `useMemo` for filtering options (only when query/options change)
- Suitable for use in DataTable cells (Teacher Allocation matrix)

### RTL Support
- Uses flexbox with `justify-between` (not hardcoded left/right)
- Teacher name on one side, load badge on other
- Works correctly in both LTR and RTL layouts

## Testing Scenarios

### Test Case 1: Closed State
- Component should look like normal Select dropdown
- No search input visible
- Placeholder text shows "Select teacher" / "اختر معلم"

### Test Case 2: Open Menu
- Click dropdown
- **Expected:** Menu opens with search input at top
- Search input should be auto-focused
- List of teachers appears below search

### Test Case 3: Search Functionality
- Type in search input
- **Expected:** List filters in real-time
- Both Arabic and English names match
- "No results" appears if no matches

### Test Case 4: Select Teacher
- Click a teacher from list
- **Expected:** Menu closes, selected teacher appears in dropdown
- Search query is cleared

### Test Case 5: Close Without Selection
- Open menu, type search, press Escape or click outside
- **Expected:** Menu closes, search is cleared, previous selection preserved

### Test Case 6: Bilingual Search
- UI in Arabic, type English name → finds teacher
- UI in English, type Arabic name → finds teacher

### Test Case 7: Load Display
- Teachers with loads show badge: "24/wk"
- Overloaded teachers have yellow badge
- Max load shows: "/ 30"

### Test Case 8: RTL Layout
- Switch to Arabic
- **Expected:** Menu alignment correct, badges on correct side

## Files Changed

1. `src/components/features/academics/components/teacher-allocation/TeacherSelect.tsx` - Refactored from Autocomplete to Select
2. `src/messages/en.json` - Added `searchTeacher` key
3. `src/messages/ar.json` - Added `searchTeacher` key

## Migration Notes

### Breaking Changes
None - component interface remains the same:
```tsx
<TeacherSelect
  teachers={teachers}
  value={selectedTeacherId}
  onChange={setSelectedTeacherId}
  teacherLoads={teacherLoadsMap}
  disabled={termClosed}
  size="small"
/>
```

### Behavior Changes
- Search input now inside menu (not always visible)
- Search clears when menu closes (better UX)
- Auto-focus on search when menu opens

## Advantages Over Autocomplete

1. **Cleaner UI:** No search input clutter when closed
2. **Better for Tables:** More compact in DataTable cells
3. **Consistent:** Matches other Select dropdowns in the app
4. **Performance:** No Autocomplete overhead
5. **Accessibility:** Standard Select behavior with enhanced search

## Status
✅ Implementation complete
✅ TypeScript compilation successful
✅ JSON translation files validated
✅ No diagnostics errors
✅ Bilingual search preserved
✅ UI matches required design
✅ Ready for testing
