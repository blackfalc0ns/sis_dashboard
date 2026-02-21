# Term-Scoped Academic Structure Implementation

## Summary

Successfully implemented term-scoped Academic Structure feature with URL deep-linking, cascading selection, read-only mode, unsaved changes guard, empty state, and carry over functionality.

## Files Modified

### 1. Service Layer
**File:** `src/services/academics/structureService.ts`
- Added `AcademicYear`, `Term`, and `CarryOverOptions` interfaces
- Changed from static structure to term-scoped storage (key: `${yearId}-${termId}`)
- Added `fetchAcademicYears()` and `fetchTermsByYear(yearId)` functions
- Updated all CRUD functions to accept `yearId` and `termId` parameters
- Added `carryOverStructure()` function to copy structure between terms with options for capacities and ordering

### 2. Context Bar Component
**File:** `src/components/features/academics/components/shared/ContextBar.tsx`
- Fetches real academic years and terms from service
- Implements cascading selection (year change → fetch terms → auto-select term)
- Displays term status chip (Open/Closed)
- Disables "Promote / Carry Over" button when term is closed
- Passes `isReadOnly` prop to parent

### 3. Main Page Component
**File:** `src/components/features/academics/components/pages/AcademicStructurePage.tsx`
- **URL Deep-Linking:** Uses `useSearchParams` and `useRouter` from `next/navigation`
  - Reads `year` and `term` query params on mount
  - Updates URL when year/term changes using `router.replace()`
  - Format: `/academics/structure?year=<yearId>&term=<termId>`

- **Cascading Selection:**
  - When year changes: fetches terms, auto-selects first open term (or first term)
  - When term changes: updates status and refetches structure

- **Read-Only Mode:**
  - When `termStatus === "closed"`, sets `isReadOnly = true`
  - Displays yellow banner: "This term is closed. Academic Structure is read-only."
  - Disables all add/edit/delete/reorder actions
  - Passes `isReadOnly` to StructureTree and DetailsPanel

- **Unsaved Changes Guard:**
  - Tracks `hasUnsavedChanges` state from DetailsPanel
  - Shows confirmation dialog when switching year/term/node with unsaved changes
  - Message: "You have unsaved changes. Do you want to discard them?"

- **Empty State:**
  - Displays when no structure exists for selected term
  - Shows icon, title, message, and CTAs:
    - "Add Stage" button (disabled if term closed)
    - "Promote / Carry Over" button

- **Carry Over Dialog:**
  - Modal with source year/term selectors
  - Options: Copy capacities, Copy ordering
  - Calls `carryOverStructure()` and refetches data on success
  - Shows success/error snackbar

### 4. Structure Tree Component
**File:** `src/components/features/academics/components/tree/StructureTree.tsx`
- Accepts `isReadOnly` prop
- Disables "Add Stage" button when read-only
- Drag-and-drop remains functional but disabled in read-only mode (handled by parent)

### 5. Details Panel Component
**File:** `src/components/features/academics/components/shared/DetailsPanel.tsx`
- Accepts `isReadOnly` and `onDirtyChange` props
- Disables all form inputs and buttons when read-only
- Calls `onDirtyChange(isDirty)` to notify parent of unsaved changes
- Fixed TypeScript issues with form data types

### 6. Translations
**Files:** `src/messages/en.json`, `src/messages/ar.json`
- Added `readonly_banner` section (message, tooltip)
- Added `empty_state` section (title, message, add_stage, carry_over)
- Added `carry_over_dialog` section (title, description, source_year, source_term, options, copy_capacities, copy_ordering, cancel, carry_over, success, error)

## How It Works

### URL Parameters
- Format: `/academics/structure?year=year-1&term=term-1-1`
- On initial load: reads URL params or uses defaults (latest year, first open term)
- On year/term change: updates URL using shallow routing
- URL is the single source of truth for current selection

### Read-Only Mode
- Determined by `termStatus === "closed"`
- Yellow banner displayed at top of page
- All edit actions disabled:
  - Add/Edit/Delete buttons
  - Form inputs
  - Drag-and-drop reordering
  - Save/Cancel buttons
- "Promote / Carry Over" button remains visible but disabled

### Carry Over Workflow
1. User clicks "Promote / Carry Over" button
2. Dialog opens with:
   - Source Academic Year dropdown
   - Source Term dropdown (filtered by selected year)
   - Checkboxes: Copy capacities, Copy ordering
3. User selects source and clicks "Carry Over"
4. System copies structure from source term to current term
5. New IDs generated for all stages/grades/sections
6. Structure refetched and displayed
7. Success snackbar shown

### Unsaved Changes Guard
1. User edits form in DetailsPanel
2. `isDirty` state set to true, notifies parent via `onDirtyChange`
3. If user tries to switch year/term/node:
   - Confirmation dialog shown
   - If "Discard": proceeds with action, resets form
   - If "Stay": cancels action, keeps form state

## Mock Data Structure

### Academic Years
- 2024-2025 (year-1)
- 2025-2026 (year-2)
- 2026-2027 (year-3)

### Terms
- Year 1: Term 1 (open), Term 2 (closed), Term 3 (closed)
- Year 2: Term 1 (open), Term 2 (open), Term 3 (open)

### Structure Storage
- Key format: `${yearId}-${termId}`
- Example: `"year-1-term-1-1"` contains structure for 2024-2025 Term 1
- Only one term has pre-populated data; others are empty

## Testing Checklist

- [x] URL params persist on page reload
- [x] Changing year fetches terms and auto-selects default
- [x] Changing term updates status and refetches structure
- [x] Read-only banner shows when term is closed
- [x] All edit actions disabled in read-only mode
- [x] Empty state shows when no structure exists
- [x] Carry over dialog copies structure correctly
- [x] Unsaved changes guard prevents data loss
- [x] Drag-and-drop works in open terms
- [x] All translations display correctly (EN + AR)

## Next Steps (If Needed)

1. Connect to real backend API (replace mock service)
2. Add loading states for async operations
3. Add error handling for network failures
4. Implement "Create Year/Term" and "Close Term" actions
5. Add audit logging for structure changes
6. Implement permissions/roles for edit access
7. Add bulk operations (e.g., copy multiple terms)
8. Add validation for term date ranges
9. Implement term status transitions (open → closed)
10. Add history/versioning for structure changes
