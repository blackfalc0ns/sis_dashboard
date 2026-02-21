# Subjects & Allocation Tab Implementation

## Summary

Successfully implemented a comprehensive Subjects & Allocation management tab for the Academics module. This tab is fully term-scoped, allowing schools to manage subjects and weekly hour allocations per term with proper validation, responsive design, and full i18n support.

## Files Created/Modified

### 1. Navigation
- **`src/config/navigation.ts`**
  - Added "Subjects & Allocation" as a child item under Academics
  - EN: "Subjects & Allocation"
  - AR: "المواد وتوزيعها"

### 2. Routing
- **`src/app/[lang]/(dashboard)/academics/subjects/page.tsx`** (NEW)
  - App Router page component
  - Route: `/en/academics/subjects` and `/ar/academics/subjects`

### 3. Service Layer
- **`src/services/academics/subjectsService.ts`** (NEW)
  - Term-scoped CRUD operations for subjects
  - Term-scoped allocation management
  - Carry over functionality
  - Mock data keyed by termId

**Key Functions:**
- `fetchSubjects(termId)` - Get subjects for a term
- `createSubject(termId, payload)` - Create subject in term
- `updateSubject(termId, subjectId, payload)` - Update subject
- `deleteSubject(termId, subjectId)` - Delete subject and its allocations
- `fetchSubjectAllocations(termId)` - Get allocations for term
- `bulkUpsertSubjectAllocations(termId, items)` - Batch save allocations
- `carryOverSubjectsAndAllocations(params)` - Copy from another term
- `subjectHasAllocations(termId, subjectId)` - Check if subject is allocated

### 4. Page Component
- **`src/components/features/academics/components/pages/SubjectsAllocationPage.tsx`** (NEW)
  - Main page component
  - Integrates with existing Context Bar
  - Manages term-scoped state
  - Handles unsaved changes guard
  - Responsive layout (desktop: two-panel, mobile: tabs)

### 5. Feature Components

#### SubjectsList Component
- **`src/components/features/academics/components/subjects/SubjectsList.tsx`** (NEW)
  - Left panel on desktop / Subjects tab on mobile
  - Search functionality
  - Add/Edit/Delete subjects
  - Shows allocation status per subject
  - Inactive subject indicator

#### SubjectDialog Component
- **`src/components/features/academics/components/subjects/SubjectDialog.tsx`** (NEW)
  - Create/Edit subject modal
  - Fields: name (required), code, stage, isActive
  - Validation: name required, duplicate check within term
  - Stage options: Primary, Middle, High

#### AllocationMatrix Component
- **`src/components/features/academics/components/subjects/AllocationMatrix.tsx`** (NEW)
  - Right panel on desktop / Matrix tab on mobile
  - Grade × Subject matrix with weekly hours
  - Inline editing with dirty state tracking
  - Stage filter
  - Show only missing allocations toggle
  - Summary: subjects count, grades count, completion %
  - Total column per grade
  - Batch save functionality
  - Reset to original values
  - Horizontally scrollable with sticky columns

#### CarryOverDialog Component
- **`src/components/features/academics/components/subjects/CarryOverDialog.tsx`** (NEW)
  - Copy subjects and/or allocations from another term
  - Source year and term selection
  - Options: copy subjects, copy allocations
  - Validation: allocations require subjects
  - Disabled when term is closed

### 6. Translations

#### English (`src/messages/en.json`)
Added under `academics.subjects`:
- `readonly_banner` - Closed term banner
- `tabs` - Mobile tab labels
- `empty_state` - No grades message
- `unsaved_changes` - Confirmation dialog
- `subjects_list.*` - Subjects list UI
- `subject_dialog.*` - Subject form
- `delete_dialog.*` - Delete confirmation
- `matrix.*` - Allocation matrix UI
- `carry_over_dialog.*` - Carry over dialog

#### Arabic (`src/messages/ar.json`)
Complete Arabic translations for all above keys with proper RTL support.

## Key Features Implemented

### Term-Scoping (CRITICAL)
✓ All subjects are scoped to termId
✓ All allocations are scoped to termId
✓ Service layer enforces term-scoping
✓ Mock data keyed by termId
✓ No global/school-level subjects

### Closed/Open Term Gating
✓ Read-only banner when term is closed
✓ All add/edit/delete actions disabled
✓ Matrix editing disabled
✓ Save button disabled
✓ Carry over disabled with tooltip

### Subjects Management
✓ Search subjects by name, code, or stage
✓ Add subject (name, code, stage, isActive)
✓ Edit subject
✓ Delete subject with allocation warning
✓ Allocation status chip (Allocated/Not Allocated)
✓ Inactive subject indicator
✓ Duplicate name validation within term

### Allocation Matrix
✓ Grade × Subject grid
✓ Inline number input (0-50 hours)
✓ Dirty state tracking with visual feedback
✓ Batch save (single API call)
✓ Reset to original values
✓ Stage filter
✓ Show only missing allocations
✓ Total column per grade
✓ Summary: subjects, grades, completion %
✓ Sticky header and first/last columns
✓ Horizontal scroll
✓ Empty state when no subjects

### Carry Over
✓ Copy subjects from another term
✓ Copy allocations from another term
✓ Source year/term selection
✓ Options: copy subjects, copy allocations
✓ Subject ID mapping for allocations
✓ Disabled when term closed

### Unsaved Changes Guard
✓ Warns when switching year/term
✓ Warns when switching mobile tabs
✓ Warns when navigating away
✓ Confirmation dialog with Stay/Discard

### Empty States
✓ No grades: Link to Academic Structure tab
✓ No subjects: Add subject CTA
✓ No allocations: Helper text

### Responsive Design
✓ Desktop: Two-panel layout (Subjects left, Matrix right)
✓ Mobile: Internal tabs (Subjects, Matrix)
✓ Matrix horizontally scrollable
✓ Touch-friendly inputs

### Internationalization
✓ Full English translations
✓ Full Arabic translations
✓ RTL support via MUI theme
✓ No hardcoded left/right positioning

## Technical Implementation

### Data Flow
```
URL (?year=...&term=...) 
  ↓
Context Bar (shared with Tab 1)
  ↓
SubjectsAllocationPage
  ↓
├─ SubjectsList (left/tab 1)
│  ├─ SubjectDialog (create/edit)
│  └─ Delete confirmation
│
└─ AllocationMatrix (right/tab 2)
   ├─ Inline editing
   ├─ Dirty tracking
   └─ Batch save

CarryOverDialog (triggered from Context Bar)
```

### State Management
- URL params for year/term (shared with Tab 1)
- Local state for subjects and allocations
- Dirty state tracking for matrix edits
- Unsaved changes guard across navigation

### API Integration
All service functions are ready for backend integration:
- Replace mock data with real API calls
- Keep function signatures identical
- Term-scoping enforced at service layer

### Validation
- Client-side: name required, duplicate check
- Server-side: ready for backend validation
- Allocation range: 0-50 hours (clamped)

## Usage

### Accessing the Tab
1. Navigate to Academics in sidebar
2. Click "Subjects & Allocation" sub-item
3. Select academic year and term from Context Bar

### Managing Subjects
1. Click "Add Subject" in left panel
2. Fill in name (required), code, stage, active status
3. Click "Create"
4. Edit/Delete via dropdown menu on each subject

### Allocating Hours
1. Switch to Matrix tab (mobile) or view right panel (desktop)
2. Enter weekly hours in each Grade × Subject cell
3. Changed cells are highlighted
4. Click "Save Changes" to persist
5. Click "Reset" to revert to original

### Copying from Another Term
1. Click "Promote / Carry Over" in Context Bar
2. Select source year and term
3. Choose options: copy subjects, copy allocations
4. Click "Copy"

## Term-Scoping Enforcement

### Service Layer
```typescript
// All functions require termId
fetchSubjects(termId: string)
createSubject(termId: string, payload)
fetchSubjectAllocations(termId: string)
bulkUpsertSubjectAllocations(termId: string, items)
```

### Mock Data Structure
```typescript
const subjectsByTerm: Record<string, Subject[]> = {
  "term-1-1": [...],
  "term-2-1": [...],
};

const allocationsByTerm: Record<string, SubjectAllocation[]> = {
  "term-1-1": [...],
  "term-2-1": [...],
};
```

### Component Props
```typescript
// termId passed to all components
<SubjectsList termId={termId} ... />
<AllocationMatrix termId={termId} ... />
<SubjectDialog termId={termId} ... />
```

## Testing Recommendations

### Functional Tests
- [ ] Create subject in term 1
- [ ] Verify subject doesn't appear in term 2
- [ ] Edit subject in term 1
- [ ] Delete subject with allocations
- [ ] Allocate hours in matrix
- [ ] Save allocations
- [ ] Reset allocations
- [ ] Carry over subjects to new term
- [ ] Carry over allocations to new term
- [ ] Switch to closed term (verify read-only)
- [ ] Try to edit in closed term (verify disabled)

### Validation Tests
- [ ] Create subject without name (should fail)
- [ ] Create duplicate subject name (should fail)
- [ ] Enter negative hours (should clamp to 0)
- [ ] Enter hours > 50 (should clamp to 50)
- [ ] Copy allocations without subjects (should disable)

### UX Tests
- [ ] Unsaved changes warning when switching year
- [ ] Unsaved changes warning when switching term
- [ ] Unsaved changes warning when switching mobile tabs
- [ ] Empty state when no grades
- [ ] Empty state when no subjects
- [ ] Search subjects
- [ ] Filter matrix by stage
- [ ] Show only missing allocations

### Responsive Tests
- [ ] Desktop: two-panel layout
- [ ] Mobile: tabs work correctly
- [ ] Matrix scrolls horizontally
- [ ] Sticky columns work
- [ ] Touch inputs work on mobile

### i18n Tests
- [ ] All strings translated in English
- [ ] All strings translated in Arabic
- [ ] RTL layout works correctly
- [ ] Date/number formatting correct per locale

## Future Enhancements

### Potential Improvements
1. **Subject Templates**: Pre-defined subject sets per stage
2. **Bulk Import**: CSV import for subjects and allocations
3. **Allocation Templates**: Common allocation patterns (e.g., "Standard Elementary")
4. **Subject Groups**: Group related subjects (e.g., "Sciences")
5. **Validation Rules**: Min/max hours per grade, total hours limits
6. **History**: Track allocation changes over time
7. **Reports**: Export allocations to PDF/Excel
8. **Conflicts**: Detect scheduling conflicts
9. **Recommendations**: Suggest allocations based on standards
10. **Multi-select**: Bulk edit multiple subjects

### Performance Optimizations
- Virtualize matrix for large datasets (>100 grades × subjects)
- Debounce matrix input changes
- Optimize re-renders with React.memo
- Lazy load subjects list

## Migration Notes

### Backend Integration
When backend is ready:
1. Replace mock functions in `subjectsService.ts`
2. Keep function signatures identical
3. Add error handling and loading states
4. Implement proper pagination if needed
5. Add optimistic updates for better UX

### Database Schema
Suggested tables:
```sql
subjects (
  id, term_id, name, code, stage, is_active, created_at, updated_at
)

subject_allocations (
  id, term_id, grade_id, subject_id, weekly_hours, created_at, updated_at
  UNIQUE(term_id, grade_id, subject_id)
)
```

## Related Documentation
- ACADEMICS_STRUCTURE_IMPLEMENTATION.md - Tab 1 implementation
- TERM_SCOPED_ACADEMICS_IMPLEMENTATION.md - Term-scoping architecture
- ACADEMICS_DATE_FUNCTIONALITY_IMPLEMENTATION.md - Date management

## Support
For questions or issues:
1. Check this documentation
2. Review component source code
3. Check translation files for missing keys
4. Verify term-scoping in service layer
