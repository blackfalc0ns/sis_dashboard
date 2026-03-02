# Timetable Stage Filter Implementation

## Date: March 1, 2026

## Summary

Successfully added stage filtering to the timetable view. Users can now filter by Stage → Grade → Section in a hierarchical manner.

## Changes Made

### 1. FilterBar Component
**File:** `src/components/features/academics/components/timetable/FilterBar.tsx`

**Changes:**
- Added `Stage` import from structureService
- Added `stages` prop
- Added `selectedStageId` prop
- Added `onStageChange` handler
- Added stage dropdown as first filter
- Implemented cascading filters:
  - Stage selection → filters grades by stageId
  - Grade selection → filters sections by gradeId
  - Changing stage resets grade and section
  - Changing grade resets section
- Grade dropdown now disabled until stage is selected
- Section dropdown disabled until grade is selected
- Added `flex-wrap` for responsive layout

### 2. TimetableView Component
**File:** `src/components/features/academics/components/timetable/TimetableView.tsx`

**Changes:**
- Added `Stage` import from structureService
- Added `stages` state: `useState<Stage[]>([])`
- Added `selectedStageId` state
- Updated `loadData()` to extract and set stages from structure
- Updated FilterBar props to include:
  - `stages={stages}`
  - `selectedStageId={selectedStageId}`
  - `onStageChange={setSelectedStageId}`
- Updated empty state check to include stages

### 3. Translations
**Files:** `src/messages/en.json`, `src/messages/ar.json`

**Added Keys:**
```json
// English
"academics.timetable.filters.selectStage": "Select Stage"

// Arabic
"academics.timetable.filters.selectStage": "اختر المرحلة"
```

## User Flow

### Before
1. Select Grade (all grades shown)
2. Select Section (sections for selected grade)

### After
1. Select Stage (Primary, Middle, High)
2. Select Grade (only grades in selected stage)
3. Select Section (only sections in selected grade)

## Filter Hierarchy

```
Stage (Primary, Middle, High)
  ↓
Grade (filtered by stageId)
  ↓
Section (filtered by gradeId)
```

## Example Usage

### Scenario 1: Primary School
1. User selects "Primary" stage
2. Grade dropdown shows: Grade 1, Grade 2, Grade 3
3. User selects "Grade 1"
4. Section dropdown shows: Section A, Section B
5. User selects "Section A"
6. Timetable loads for Primary → Grade 1 → Section A

### Scenario 2: Middle School
1. User selects "Middle" stage
2. Grade dropdown shows: Grade 6, Grade 7
3. User selects "Grade 6"
4. Section dropdown shows: Section A
5. User selects "Section A"
6. Timetable loads for Middle → Grade 6 → Section A

## Benefits

1. **Better Organization**: Clear hierarchy matches school structure
2. **Reduced Clutter**: Grade dropdown only shows relevant grades
3. **Improved UX**: Logical progression from broad to specific
4. **Scalability**: Works well with large numbers of grades
5. **Consistency**: Matches structure tab organization

## Technical Details

### Data Flow
```typescript
// Load structure
const structure = await fetchStructureTree(yearId, termId);
setStages(structure.stages);
setGrades(structure.grades);
setSections(structure.sections);

// Filter grades by stage
const filteredGrades = selectedStageId
  ? grades.filter((g) => g.stageId === selectedStageId)
  : grades;

// Filter sections by grade
const filteredSections = selectedGradeId
  ? sections.filter((s) => s.gradeId === selectedGradeId)
  : [];
```

### Cascading Reset Logic
```typescript
// When stage changes
const handleStageChange = (value: string) => {
  onStageChange(value);
  onGradeChange(""); // Reset grade
  onSectionChange(""); // Reset section
};

// When grade changes
const handleGradeChange = (value: string) => {
  onGradeChange(value);
  onSectionChange(""); // Reset section
};
```

## UI Layout

### Desktop
```
[Select Stage ▼] [Select Grade ▼] [Select Section ▼]
     260px            260px             260px
```

### Mobile (Responsive)
```
[Select Stage ▼]
[Select Grade ▼]
[Select Section ▼]
```
Filters wrap to multiple rows on small screens.

## Build Status

✅ **Build Successful** - No errors
✅ **Type Check Passed** - No type errors
✅ **Translations Added** - AR/EN complete

## Testing Checklist

- [ ] Stage dropdown shows all stages
- [ ] Grade dropdown disabled until stage selected
- [ ] Grade dropdown shows only grades for selected stage
- [ ] Section dropdown disabled until grade selected
- [ ] Section dropdown shows only sections for selected grade
- [ ] Changing stage resets grade and section
- [ ] Changing grade resets section
- [ ] Timetable loads correctly for selected section
- [ ] Empty state shows when no stages/grades
- [ ] Translations work in AR/EN
- [ ] Responsive layout works on mobile
- [ ] Filters wrap properly on small screens

## Files Modified

1. `src/components/features/academics/components/timetable/FilterBar.tsx`
2. `src/components/features/academics/components/timetable/TimetableView.tsx`
3. `src/messages/en.json`
4. `src/messages/ar.json`

## Backward Compatibility

✅ Fully backward compatible
- Existing data structure unchanged
- Grades already have `stageId` field
- No database migration needed
- Existing timetables work without changes

## Future Enhancements (Optional)

1. **Stage-level timetable config**: Allow different configs per stage
2. **Stage statistics**: Show timetable completion per stage
3. **Stage filtering in other tabs**: Apply same pattern to subjects, teacher allocation
4. **Stage badges**: Show stage color/icon in filters
5. **Quick stage switch**: Keyboard shortcuts for stage navigation

## Conclusion

The timetable now has a complete hierarchical filtering system that matches the school structure organization. Users can navigate from Stage → Grade → Section, making it easier to find and manage timetables in schools with many grades and sections.

---

**Status:** ✅ COMPLETE  
**Build:** ✅ PASSING  
**Ready for:** Testing and Production
