# Attendance Policies Wizard - Component Organization

## Overview
Successfully refactored the PolicyWizardDialog into a well-organized component structure by breaking down the monolithic wizard into separate step components for better maintainability, reusability, and code clarity.

## New Folder Structure

```
src/features/attendance/policies/components/
├── PolicyWizardDialog.tsx          # Main wizard orchestrator (400 lines)
└── wizard/                          # Step components folder
    ├── Step1BasicInfo.tsx          # Step 1: Basic Info (150 lines)
    ├── Step2Scope.tsx              # Step 2: Scope & Priority (180 lines)
    ├── Step3ModeComputation.tsx    # Step 3: Mode & Computation (200 lines)
    ├── Step4Rules.tsx              # Step 4: Rules (180 lines)
    └── Step5Review.tsx             # Step 5: Review & Dates (200 lines)
```

## Component Breakdown

### 1. PolicyWizardDialog.tsx (Main Orchestrator)
**Responsibilities:**
- Wizard state management (activeStep, formData, errors, isDirty)
- Form data initialization and reset
- Period loading from timetable config
- Step validation logic
- Navigation (Next/Back/Save)
- Unsaved changes handling
- Modal wrapper and footer

**Key Features:**
- Manages all wizard state
- Coordinates between steps
- Handles save/cancel actions
- Provides filtered data to steps (filteredGrades, filteredSections)
- Integrates with timetable service

**Props Interface:**
```typescript
interface PolicyWizardDialogProps {
  isOpen: boolean;
  policy: AttendancePolicy | null;
  term: Term | null;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  isReadOnly: boolean;
  onSave: (data: PolicyFormData) => Promise<void>;
  onClose: () => void;
}
```

### 2. Step1BasicInfo.tsx
**Responsibilities:**
- Policy name (bilingual, required)
- Description (bilingual, optional)
- Notes (bilingual, optional)
- Active status toggle
- Info box with step description

**Props Interface:**
```typescript
interface Step1BasicInfoProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}
```

**Features:**
- BilingualTextField for policy name
- Custom textarea components for description/notes
- Checkbox for active status
- Error display for validation

### 3. Step2Scope.tsx
**Responsibilities:**
- Scope type selection (SCHOOL/STAGE/GRADE/SECTION)
- Stage/Grade/Section cascading selectors
- Priority explanation
- Visual card-based selection

**Props Interface:**
```typescript
interface Step2ScopeProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  stages: Stage[];
  filteredGrades: Grade[];
  filteredSections: Section[];
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}
```

**Features:**
- 4 scope cards with radio-style selection
- Conditional selectors based on scope type
- Uses pre-filtered grades and sections from parent
- Priority warning box
- Bilingual labels

### 4. Step3ModeComputation.tsx
**Responsibilities:**
- Attendance mode selection (DAILY/PERIOD)
- Daily computation strategy (MANUAL/DERIVED)
- Period selection with timetable integration
- Select All / Clear All functionality

**Props Interface:**
```typescript
interface Step3ModeComputationProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  availablePeriods: TimetablePeriod[];
  isLoadingPeriods: boolean;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}
```

**Features:**
- Radio buttons for mode selection
- Conditional daily strategy selection
- Period grid with checkboxes
- Loading state for periods
- Empty state when no periods available
- Selected count display

### 5. Step4Rules.tsx
**Responsibilities:**
- Late/early thresholds
- Auto-absent rules (mode-specific)
- Excuse settings
- Numeric validations

**Props Interface:**
```typescript
interface Step4RulesProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}
```

**Features:**
- Grid layout for thresholds
- Conditional auto-absent fields based on mode
- Nested excuse settings
- Helper text for each field
- Unit labels (minutes, periods, days)

### 6. Step5Review.tsx
**Responsibilities:**
- Effective date selection
- Notification settings
- Review summary
- Override warning

**Props Interface:**
```typescript
interface Step5ReviewProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  term: Term | null;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}
```

**Features:**
- DatePicker for start/end dates
- Notification checkboxes (who + when)
- Beautiful summary box with gradient
- Override warning for non-SCHOOL scopes
- Term range hint

## Benefits of Organization

### 1. Maintainability
- Each step is self-contained and focused
- Easy to locate and modify specific step logic
- Clear separation of concerns
- Reduced cognitive load when working on a specific step

### 2. Reusability
- Step components can be reused in other wizards
- Common patterns extracted (e.g., scope selection)
- Easy to create variations of steps

### 3. Testability
- Each step can be tested independently
- Easier to mock props for unit tests
- Isolated validation logic per step

### 4. Readability
- Main wizard file is now ~400 lines (was ~1300)
- Each step file is ~150-200 lines
- Clear component hierarchy
- Easy to understand data flow

### 5. Collaboration
- Multiple developers can work on different steps
- Reduced merge conflicts
- Clear ownership of components

### 6. Performance
- Potential for lazy loading steps
- Smaller bundle chunks
- Better code splitting

## Data Flow

```
PolicyWizardDialog (Parent)
    ↓ Props
    ├─→ Step1BasicInfo
    ├─→ Step2Scope
    ├─→ Step3ModeComputation
    ├─→ Step4Rules
    └─→ Step5Review
    
    ↑ Callbacks
    onFieldChange() → Updates formData in parent
```

**Key Points:**
- Parent manages all state
- Steps are presentational components
- Single source of truth (formData in parent)
- Unidirectional data flow
- Type-safe field changes with generics

## Type Safety

All step components use generic type constraints for `onFieldChange`:

```typescript
onFieldChange: <K extends keyof PolicyFormData>(
  field: K,
  value: PolicyFormData[K]
) => void;
```

**Benefits:**
- TypeScript ensures field names are valid
- Value types match field types
- Compile-time error checking
- IntelliSense support

## File Sizes

**Before Organization:**
- PolicyWizardDialog.tsx: ~1300 lines

**After Organization:**
- PolicyWizardDialog.tsx: ~400 lines (main orchestrator)
- Step1BasicInfo.tsx: ~150 lines
- Step2Scope.tsx: ~180 lines
- Step3ModeComputation.tsx: ~200 lines
- Step4Rules.tsx: ~180 lines
- Step5Review.tsx: ~200 lines

**Total:** ~1310 lines (similar total, but much better organized)

## Usage Example

```typescript
// Main wizard usage (unchanged from outside)
<PolicyWizardDialog
  isOpen={true}
  policy={policy}
  term={term}
  stages={stages}
  grades={grades}
  sections={sections}
  isReadOnly={false}
  onSave={handleSave}
  onClose={handleClose}
/>

// Internal step rendering (in PolicyWizardDialog)
{activeStep === 0 && (
  <Step1BasicInfo
    formData={formData}
    errors={errors}
    isReadOnly={isReadOnly}
    onFieldChange={handleFieldChange}
  />
)}
```

## Migration Notes

### What Changed
- Monolithic wizard split into 6 files
- Step content moved to separate components
- Props interfaces defined for each step
- Type-safe field change handlers

### What Stayed the Same
- External API (PolicyWizardDialog props)
- Validation logic
- State management approach
- User experience
- All functionality preserved

### Backward Compatibility
- ✅ No breaking changes
- ✅ Same props interface
- ✅ Same behavior
- ✅ All features work identically

## Build Status
✅ Build successful with no errors
✅ TypeScript compilation passed
✅ All type warnings resolved
✅ No runtime changes

## Future Enhancements

### 1. Step Composition
- Create reusable step primitives
- Extract common patterns (e.g., ScopeSelector)
- Build step library

### 2. Lazy Loading
- Load steps on demand
- Reduce initial bundle size
- Improve performance

### 3. Step Validation
- Move validation to step components
- Self-validating steps
- Cleaner parent component

### 4. Step State
- Allow steps to manage local state
- Reduce parent state complexity
- Better encapsulation

### 5. Step Hooks
- Create custom hooks for step logic
- Reusable step behaviors
- Cleaner component code

## Best Practices Applied

1. **Single Responsibility**: Each step has one clear purpose
2. **DRY**: No code duplication between steps
3. **Type Safety**: Full TypeScript coverage with generics
4. **Composition**: Steps compose together to form wizard
5. **Separation of Concerns**: UI separated from logic
6. **Prop Drilling**: Minimal, only necessary data passed
7. **Naming**: Clear, descriptive component names
8. **File Organization**: Logical folder structure

## Conclusion

The wizard is now well-organized, maintainable, and follows React best practices. Each step is a focused, testable component that can be easily modified or reused. The refactoring improves code quality without changing functionality or breaking existing integrations.

