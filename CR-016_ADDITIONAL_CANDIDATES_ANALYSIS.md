# CR-016: Additional Container/Presenter Pattern Candidates

## Analysis Summary

After reviewing the codebase, I've identified several page components that could benefit from the container/presenter pattern. However, most fall into different categories that require different considerations.

## Completed Refactors ✅
1. Students & Guardians Dashboard (350+ lines → 3 modules)
2. School Dashboard (280+ lines → 3 modules)
3. Admissions Dashboard (400+ lines → 3 modules)

## Categories of Remaining Pages

### Category 1: Complex Feature Pages (High Priority)
These pages have significant business logic mixed with presentation:

#### ApplicationsList.tsx (709 lines)
- **Location**: `src/features/admissions/components/lists/ApplicationsList.tsx`
- **Complexity**: High
- **Issues**:
  - Multiple filter states (search, status, grade, gender, nationality, date range)
  - Complex filtering logic in useMemo
  - KPI calculations mixed with UI
  - Modal state management
- **Recommendation**: GOOD CANDIDATE for container/presenter pattern
- **Benefit**: Would separate filtering logic, KPI calculations, and modal management from UI

#### LessonPlansPage.tsx (533 lines, 17.9KB)
- **Location**: `src/components/features/academics/components/pages/LessonPlansPage.tsx`
- **Complexity**: Very High
- **Issues**:
  - 15+ state variables
  - Complex data fetching (terms, stages, grades, sections, subjects, teachers, units, lessons, plans)
  - Multiple useEffect hooks for data loading
  - Mobile drawer state management
  - URL parameter synchronization
- **Recommendation**: EXCELLENT CANDIDATE but requires careful planning
- **Benefit**: Would separate data fetching, state management, and business logic from UI

#### TeacherAllocationPage.tsx (423 lines, 14.8KB)
- **Location**: `src/components/features/academics/components/pages/TeacherAllocationPage.tsx`
- **Complexity**: High
- **Issues**:
  - Multiple data sources (years, terms, grades, sections, subjects, teachers, allocations)
  - Complex initialization from URL
  - Validation logic
  - Dirty state tracking
- **Recommendation**: GOOD CANDIDATE
- **Benefit**: Would separate allocation logic and validation from UI

#### SubjectsAllocationPage.tsx (400+ lines, 13.8KB)
- **Location**: `src/components/features/academics/components/pages/SubjectsAllocationPage.tsx`
- **Complexity**: High
- **Issues**:
  - Similar to TeacherAllocationPage
  - Multiple data sources
  - URL synchronization
  - Allocation management
- **Recommendation**: GOOD CANDIDATE
- **Benefit**: Would separate allocation logic from UI

### Category 2: Builder/Editor Pages (Different Pattern Needed)
These pages are complex but follow a different pattern (form builders, editors):

#### AssignmentBuilderPage.tsx (1768 lines, 56.6KB)
- **Complexity**: Extremely High
- **Type**: Form builder with complex state machine
- **Recommendation**: NOT suitable for simple container/presenter
- **Better approach**: Consider state machine pattern (XState) or form library (React Hook Form)

#### AcademicStructurePage.tsx (810 lines, 27.7KB)
- **Complexity**: Very High
- **Type**: Tree editor with drag-and-drop
- **Recommendation**: NOT suitable for simple container/presenter
- **Better approach**: Specialized tree management pattern

#### CurriculumPageResizable.tsx (709 lines, 25KB)
- **Complexity**: Very High
- **Type**: Resizable panel layout with complex interactions
- **Recommendation**: NOT suitable for simple container/presenter
- **Better approach**: Keep as is or use specialized layout library

### Category 3: Detail Pages (Lower Priority)
These pages are complex but mostly presentational:

#### TestDetailsPage.tsx (509 lines, 17.7KB)
#### InterviewDetailsPage.tsx (492 lines, 17.3KB)
- **Complexity**: Medium
- **Type**: Detail views with tabs and modals
- **Recommendation**: LOW PRIORITY
- **Reason**: Mostly presentational with minimal business logic

### Category 4: Calendar/Schedule Pages (Specialized)
#### AcademicCalendarPage.tsx (455 lines, 13.8KB)
- **Complexity**: High
- **Type**: Calendar with event management
- **Recommendation**: NOT suitable for simple container/presenter
- **Better approach**: Specialized calendar state management

## Recommended Next Steps

### Immediate Priority (High Value, Clear Benefit)
1. **ApplicationsList.tsx** - Clear separation of filtering logic and KPI calculations
2. **SubjectsAllocationPage.tsx** - Similar to completed dashboards
3. **TeacherAllocationPage.tsx** - Similar to completed dashboards

### Medium Priority (High Value, More Complex)
4. **LessonPlansPage.tsx** - Requires careful planning due to complexity

### Not Recommended
- AssignmentBuilderPage.tsx (needs different pattern)
- AcademicStructurePage.tsx (needs different pattern)
- CurriculumPageResizable.tsx (specialized layout)
- Detail pages (mostly presentational)
- Calendar pages (specialized pattern)

## Pattern Guidelines

For pages that ARE good candidates:
1. Extract filtering/calculation logic to utilities
2. Container handles state, data fetching, event handlers
3. Presenter is pure UI with no business logic
4. Entry point is thin wrapper

For pages that are NOT good candidates:
1. Consider specialized patterns (state machines, form libraries)
2. Keep complex interactions together
3. Focus on smaller refactors within the page
4. Use composition to break down complexity

## Estimated Impact

If we refactor the 4 recommended pages:
- **ApplicationsList**: 700 lines → ~250 lines (utility) + ~150 lines (container) + ~300 lines (presenter)
- **SubjectsAllocationPage**: 400 lines → ~150 lines (utility) + ~100 lines (container) + ~150 lines (presenter)
- **TeacherAllocationPage**: 420 lines → ~150 lines (utility) + ~120 lines (container) + ~150 lines (presenter)
- **LessonPlansPage**: 530 lines → ~200 lines (utility) + ~150 lines (container) + ~180 lines (presenter)

Total: ~2,050 lines of mixed concerns → ~1,900 lines with clear separation
Benefit: Improved testability, maintainability, and code organization
