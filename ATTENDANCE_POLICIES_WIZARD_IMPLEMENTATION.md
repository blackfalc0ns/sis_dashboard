# Attendance Policies Wizard Implementation

## Overview
Successfully implemented a comprehensive 5-step wizard dialog for creating and editing attendance policies, following the same polished UX pattern as the Timetable Configuration wizard.

## Implementation Summary

### 1. Enhanced Types (`src/features/attendance/policies/types.ts`)

**New Types Added:**
- `DailyComputationStrategy`: "MANUAL" | "DERIVED_FROM_PERIODS"
- `PolicyConflict`: For tracking policy conflicts
- `PolicyValidationResult`: For validation results

**Enhanced AttendancePolicy Interface:**
- `descriptionAr`, `descriptionEn`: Optional bilingual descriptions
- `notesAr`, `notesEn`: Optional bilingual notes
- `dailyComputationStrategy`: How daily attendance is computed
- `selectedPeriodIds`: Array of period IDs for PERIOD mode or DERIVED strategy
- `absentIfMissedPeriodsCount`: Auto-absent rule for PERIOD mode
- `requireExcuseReason`: Whether excuse reason is required
- `maxDaysToSubmitExcuse`: Time limit for submitting excuses
- `notifyTeachers`, `notifyStudents`, `notifyGuardians`: Who to notify
- `notifyOnAbsent`, `notifyOnLate`, `notifyOnEarlyLeave`: When to notify

### 2. PolicyWizardDialog Component (`src/features/attendance/policies/components/PolicyWizardDialog.tsx`)

**Architecture:**
- 5-step wizard using WizardStepper component (reused from timetable)
- Modal-based with fixed header/footer, scrolling content
- Dirty state tracking with unsaved changes confirmation
- Step-by-step validation
- Integration with timetable config service for period loading

**Step 1: Basic Info**
- Bilingual policy name (required, with uniqueness validation)
- Bilingual description (optional, textarea)
- Bilingual notes (optional, textarea)
- Active status toggle
- Info box explaining policy purpose

**Step 2: Scope & Priority**
- Card-based scope selection (SCHOOL/STAGE/GRADE/SECTION)
- Visual priority explanation (SECTION > GRADE > STAGE > SCHOOL)
- Cascading selectors (Stage → Grade → Section)
- Filtered options based on parent selection
- Warning box showing priority rules

**Step 3: Mode & Computation**
- Attendance mode selection:
  - DAILY: Track once per day
  - PERIOD: Track per class period
- Daily computation strategy (only for DAILY mode):
  - MANUAL: Teachers mark daily attendance
  - DERIVED_FROM_PERIODS: Computed from period attendance
- Period selection (for PERIOD mode or DERIVED strategy):
  - Loads periods from timetable config based on scope
  - Respects timetable precedence (SECTION > GRADE > TERM)
  - Select All / Clear All buttons
  - Visual period cards with times
  - Shows selected count
  - Validation: at least 1 period required

**Step 4: Rules**
- Late threshold (minutes, required)
- Early leave threshold (minutes, required)
- Auto-absent rules:
  - DAILY mode: autoAbsentAfterMinutes
  - PERIOD mode: absentIfMissedPeriodsCount
- Excuse settings:
  - Allow excuses toggle
  - Require reason checkbox
  - Require attachment checkbox
  - Max days to submit excuse (optional)
- All numeric fields validated (non-negative)
- Helper text for each field

**Step 5: Dates, Notifications & Review**
- Effective dates:
  - Start date (required, within term range)
  - End date (required, within term range)
  - Date range validation
  - Term range hint displayed
- Notifications:
  - Who to notify: Teachers, Students, Guardians
  - When to notify: Absent, Late, Early Leave
- Review summary box:
  - Policy name
  - Scope
  - Mode
  - Selected periods count
  - Effective dates
  - Excuse settings
  - Override warning (if not SCHOOL scope)

**Features:**
- Responsive layout (mobile/tablet/desktop)
- RTL support (Arabic)
- Loading states for period fetching
- Error messages inline
- Unsaved changes dialog
- Save button disabled while saving
- Back/Next navigation
- ESC to close (with confirmation if dirty)

### 3. Translations

**English (`src/messages/en.json`):**
- Complete wizard translations under `attendance.policies.wizard`
- All 5 steps with titles and subtitles
- All field labels and descriptions
- Scope descriptions
- Mode descriptions
- Computation strategy descriptions
- Validation messages
- Helper texts

**Arabic (`src/messages/ar.json`):**
- Full RTL translations
- Proper Arabic terminology
- Culturally appropriate phrasing
- All wizard keys translated

### 4. Service Enhancements (`src/features/attendance/policies/services/attendancePolicyService.ts`)

**Updated Mock Data:**
- Added all new fields to default policy
- Proper defaults for new properties

**Existing Functions (Still Work):**
- `fetchPolicies()`: Fetch all policies for a term
- `createPolicy()`: Create new policy
- `updatePolicy()`: Update existing policy
- `deletePolicy()`: Delete policy
- `isPolicyNameUnique()`: Check name uniqueness

### 5. Integration

**Main Page (`src/features/attendance/policies/pages/AttendancePoliciesPage.tsx`):**
- Replaced PolicyEditorPanel with PolicyWizardDialog
- Updated import
- Updated component usage
- All existing functionality preserved

**Backward Compatibility:**
- PolicyEditorPanel updated to support new types (for any legacy usage)
- All existing policies work with new structure
- New fields have sensible defaults

## Technical Decisions

### 1. Wizard Pattern
- Followed TimetableConfigDialog pattern exactly
- Reused WizardStepper component
- Same modal structure and footer layout
- Consistent step validation approach

### 2. Period Loading
- Integrated with timetable config service
- Respects timetable scope precedence
- Loads periods dynamically based on policy scope
- Handles missing timetable config gracefully

### 3. Form State Management
- Single formData state object
- Dirty tracking for unsaved changes
- Step-by-step validation
- Error state per field

### 4. Validation Strategy
- Validate on step transition (Next button)
- Validate on save (final step)
- Clear errors when field changes
- Show inline error messages

### 5. Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly targets
- Scrolling content area

## Key Features

### 1. Timetable Integration
- Loads periods from effective timetable config
- Resolves config using precedence rules
- Shows period names (bilingual) and times
- Handles scope changes dynamically

### 2. Advanced Computation
- Manual daily attendance
- Derived daily from periods
- Period-based tracking
- Flexible rules per mode

### 3. Comprehensive Rules
- Late/early thresholds
- Auto-absent logic (mode-specific)
- Excuse policies with time limits
- Attachment requirements

### 4. Notifications
- Granular control (who + when)
- Teachers, students, guardians
- Absent, late, early leave events

### 5. Policy Priority
- Clear visual explanation
- Scope-based override system
- Warning when overriding
- Helps users understand precedence

## Files Created/Modified

### Created Files (1)
1. `src/features/attendance/policies/components/PolicyWizardDialog.tsx` - 5-step wizard component

### Modified Files (5)
1. `src/features/attendance/policies/types.ts` - Enhanced types
2. `src/features/attendance/policies/services/attendancePolicyService.ts` - Updated mock data
3. `src/features/attendance/policies/pages/AttendancePoliciesPage.tsx` - Integrated wizard
4. `src/messages/en.json` - Added wizard translations
5. `src/messages/ar.json` - Added wizard translations
6. `src/features/attendance/policies/components/PolicyEditorPanel.tsx` - Updated for compatibility

## Testing Checklist

### Wizard Navigation
- [x] Step 1 → Step 2 navigation
- [x] Step 2 → Step 3 navigation
- [x] Step 3 → Step 4 navigation
- [x] Step 4 → Step 5 navigation
- [x] Back button works at each step
- [x] Validation blocks Next if errors
- [x] ESC closes with confirmation if dirty

### Step 1: Basic Info
- [x] Bilingual name required
- [x] Uniqueness validation works
- [x] Description optional
- [x] Notes optional
- [x] Active toggle works

### Step 2: Scope
- [x] All 4 scope types selectable
- [x] Stage selector appears for STAGE/GRADE/SECTION
- [x] Grade selector appears for GRADE/SECTION
- [x] Section selector appears for SECTION
- [x] Selectors filter correctly
- [x] Priority warning displayed

### Step 3: Mode & Computation
- [x] DAILY mode selectable
- [x] PERIOD mode selectable
- [x] Daily strategy appears for DAILY
- [x] Period selection appears for PERIOD
- [x] Period selection appears for DAILY+DERIVED
- [x] Periods load from timetable config
- [x] Select All / Clear All work
- [x] At least 1 period validation

### Step 4: Rules
- [x] Late threshold editable
- [x] Early threshold editable
- [x] Auto-absent for DAILY mode
- [x] Absent if missed for PERIOD mode
- [x] Excuse settings work
- [x] Max days optional
- [x] Non-negative validation

### Step 5: Review
- [x] Effective dates required
- [x] Date range validation
- [x] Term range validation
- [x] Notification toggles work
- [x] Summary displays correctly
- [x] Override warning shows

### Create/Edit
- [x] Create new policy works
- [x] Edit existing policy works
- [x] Save creates/updates correctly
- [x] Cancel discards changes
- [x] Unsaved changes dialog works

### Responsive
- [x] Desktop layout (3-column grids)
- [x] Tablet layout (2-column grids)
- [x] Mobile layout (1-column stack)
- [x] Stepper visible on all sizes

### Localization
- [x] English interface complete
- [x] Arabic interface complete
- [x] RTL layout correct
- [x] All labels translated

## Build Status
✅ Build successful with no errors
✅ TypeScript compilation passed
✅ All translations loaded
✅ No new dependencies added

## Usage Example

```typescript
// Open wizard for new policy
<PolicyWizardDialog
  isOpen={true}
  policy={null}
  term={currentTerm}
  stages={stages}
  grades={grades}
  sections={sections}
  isReadOnly={false}
  onSave={handleSave}
  onClose={handleClose}
/>

// Open wizard for editing
<PolicyWizardDialog
  isOpen={true}
  policy={existingPolicy}
  term={currentTerm}
  stages={stages}
  grades={grades}
  sections={sections}
  isReadOnly={false}
  onSave={handleSave}
  onClose={handleClose}
/>
```

## Next Steps (Future Enhancements)

### Phase 2: List Enhancements
1. **Filters**
   - Search by name (bilingual)
   - Filter by scope type
   - Filter by mode
   - Filter by status (active/inactive)

2. **Table Enhancements**
   - Warnings chip (conflicts, missing timetable)
   - Duplicate policy action
   - Bulk actions (activate/deactivate multiple)

3. **Conflict Detection UI**
   - Visual conflict indicators
   - Conflict resolution wizard
   - Overlap warnings in wizard

### Phase 3: Advanced Features
1. **Policy Templates**
   - Save policy as template
   - Apply template to new scope
   - Template library

2. **Bulk Operations**
   - Copy policy to multiple scopes
   - Batch activate/deactivate
   - Mass update effective dates

3. **Reports Integration**
   - Policy coverage report
   - Conflict report
   - Policy usage analytics

4. **Audit Trail**
   - Track policy changes
   - Show who created/modified
   - Change history

## Notes
- Wizard follows exact same pattern as TimetableConfigDialog
- All components reused (WizardStepper, Modal, Button, Input, etc.)
- No hardcoded colors - uses global.css tokens
- Full RTL support throughout
- Responsive on all devices
- Period loading integrates with existing timetable system
- Validation comprehensive and user-friendly
- Ready for backend API integration (just replace service functions)

