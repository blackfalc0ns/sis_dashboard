# Academic Year and Term Date Management - Code Reference

## Quick Reference

This document provides exact code locations for all date management functionality.

## Component Hierarchy

```
AcademicStructurePage
└── ContextBar
    ├── YearDialog (Create/Edit Academic Year)
    └── TermDialog (Create/Edit Term)
```

## File Locations

### 1. Main Context Bar Component
**File:** `src/components/features/academics/components/shared/ContextBar.tsx`

**Key Functions:**
- `loadYears()` - Fetches all academic years
- `loadTerms()` - Fetches terms for selected year
- `handleCreateYear()` - Opens year creation dialog
- `handleCreateTerm()` - Opens term creation dialog
- `handleEditYear()` - Opens year edit dialog
- `handleEditTerm()` - Opens term edit dialog
- `handleYearSuccess()` - Refreshes years after create/edit
- `handleTermSuccess()` - Refreshes terms after create/edit

**Dialog States:**
```typescript
const [showYearDialog, setShowYearDialog] = useState(false);
const [showTermDialog, setShowTermDialog] = useState(false);
const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
const [editingTerm, setEditingTerm] = useState<Term | null>(null);
```

**UI Elements:**
- Line ~150: "Create Year" button
- Line ~160: "Create Term" button
- Line ~140: Edit icon for Academic Year
- Line ~160: Edit icon for Term
- Line ~240: YearDialog component
- Line ~250: TermDialog component

### 2. Year and Term Dialogs
**File:** `src/components/features/academics/components/dialogs/YearTermDialogs.tsx`

#### YearDialog Component
**Props:**
```typescript
interface YearDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingYears: AcademicYear[];
  editYear?: AcademicYear | null;
}
```

**Key Functions:**
- `validateForm()` - Validates year data and checks for overlaps
- `handleSubmit()` - Creates or updates academic year

**Validation Logic:**
- Line ~50: Name validation
- Line ~55: Start date validation
- Line ~60: End date validation
- Line ~65: Start before end validation
- Line ~70: Overlap detection with other years

#### TermDialog Component
**Props:**
```typescript
interface TermDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicYear: AcademicYear;
  existingTerms: Term[];
  editTerm?: Term | null;
  isReadOnly?: boolean;
}
```

**Key Functions:**
- `validateForm()` - Validates term data and checks constraints
- `handleSubmit()` - Creates or updates term
- `hasAvailableRange()` - Checks if there's space for new term
- `durationWeeks` - Calculates term duration

**Auto-Suggestion Logic:**
- Line ~220: Auto-suggest start date based on existing terms
- Line ~235: Auto-suggest end date (16 weeks from start)

**Validation Logic:**
- Line ~270: Name validation
- Line ~275: Start date validation
- Line ~280: End date validation
- Line ~285: Start before end validation
- Line ~290: Within year range validation
- Line ~305: Overlap detection with other terms

### 3. Service Layer
**File:** `src/services/academics/structureService.ts`

**API Functions:**
```typescript
// Line ~130
export const createAcademicYear = async (
  payload: Omit<AcademicYear, "id">
): Promise<AcademicYear>

// Line ~140
export const updateAcademicYear = async (
  id: string, 
  payload: Partial<Omit<AcademicYear, "id">>
): Promise<AcademicYear>

// Line ~150
export const createTerm = async (
  payload: Omit<Term, "id">
): Promise<Term>

// Line ~160
export const updateTerm = async (
  id: string,
  payload: Partial<Omit<Term, "id">>
): Promise<Term>
```

**Data Types:**
```typescript
// Line ~32
export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;  // ISO format: YYYY-MM-DD
  endDate: string;    // ISO format: YYYY-MM-DD
}

// Line ~38
export interface Term {
  id: string;
  name: string;
  yearId: string;
  status: "open" | "closed";
  startDate: string;  // ISO format: YYYY-MM-DD
  endDate: string;    // ISO format: YYYY-MM-DD
}
```

### 4. Translations

#### English Translations
**File:** `src/messages/en.json`

**Location:** `academics.structure`

**Key Sections:**
- `context_bar` (Line ~2130): Button labels
- `year_dialog` (Line ~2220): Year dialog strings
- `term_dialog` (Line ~2235): Term dialog strings
- `validation` (Line ~2255): Validation messages

**Example Keys:**
```json
{
  "academics": {
    "structure": {
      "context_bar": {
        "create_year": "Create Year",
        "create_term": "Create Term",
        "edit_year": "Edit Year",
        "edit_term": "Edit Term"
      },
      "year_dialog": {
        "create_title": "Create Academic Year",
        "edit_title": "Edit Academic Year",
        "name": "Year Name",
        "start_date": "Start Date",
        "end_date": "End Date"
      },
      "term_dialog": {
        "create_title": "Create Term",
        "edit_title": "Edit Term",
        "duration_weeks": "Duration: {{count}} weeks"
      },
      "validation": {
        "start_before_end": "Start date must be before end date",
        "year_overlap": "Academic year dates overlap with {{yearName}}",
        "term_overlap": "Term dates overlap with {{termName}} ({{termStart}} to {{termEnd}})"
      }
    }
  }
}
```

#### Arabic Translations
**File:** `src/messages/ar.json`

**Location:** Same structure as English, with Arabic translations

### 5. Date Picker Component
**File:** `src/components/ui/input/DatePicker.tsx`

**Already Exists** - No modifications needed

**Key Props Used:**
```typescript
<DatePicker
  label={string}
  required={boolean}
  value={Date | null}
  onChange={(date: Date | null) => void}
  error={string}
  minDate={Date}
  maxDate={Date}
  format="YYYY-MM-DD"
  helperText={string}
/>
```

## Data Flow

### Creating an Academic Year

```
User clicks "Create Year"
  ↓
ContextBar.handleCreateYear()
  ↓
Opens YearDialog (editYear = null)
  ↓
User fills form and clicks "Create"
  ↓
YearDialog.handleSubmit()
  ↓
YearDialog.validateForm() - checks overlaps
  ↓
createAcademicYear(payload) - API call
  ↓
YearDialog.onSuccess()
  ↓
ContextBar.handleYearSuccess()
  ↓
ContextBar.loadYears() - refresh data
  ↓
UI updates with new year
```

### Creating a Term

```
User selects academic year
  ↓
User clicks "Create Term"
  ↓
ContextBar.handleCreateTerm()
  ↓
Opens TermDialog (editTerm = null)
  ↓
TermDialog auto-suggests dates based on existing terms
  ↓
User adjusts form and clicks "Create"
  ↓
TermDialog.handleSubmit()
  ↓
TermDialog.validateForm() - checks constraints
  ↓
createTerm(payload) - API call
  ↓
TermDialog.onSuccess()
  ↓
ContextBar.handleTermSuccess()
  ↓
ContextBar.loadTerms() - refresh data
  ↓
UI updates with new term
```

## Validation Flow

### Academic Year Validation

```
validateForm()
  ↓
Check name is not empty
  ↓
Check start date exists
  ↓
Check end date exists
  ↓
Check start < end
  ↓
Loop through existingYears
  ↓
For each year (except current if editing):
  - Check if new dates overlap with year dates
  - Overlap = (start within year) OR (end within year) OR (spans entire year)
  ↓
If overlap found: Set error with year name
  ↓
Return true if no errors
```

### Term Validation

```
validateForm()
  ↓
Check name is not empty
  ↓
Check start date exists
  ↓
Check end date exists
  ↓
Check start < end
  ↓
Check start >= academicYear.startDate
  ↓
Check start <= academicYear.endDate
  ↓
Check end >= academicYear.startDate
  ↓
Check end <= academicYear.endDate
  ↓
Loop through existingTerms
  ↓
For each term (except current if editing):
  - Check if new dates overlap with term dates
  - Overlap = (start within term) OR (end within term) OR (spans entire term)
  ↓
If overlap found: Set error with term name and dates
  ↓
Return true if no errors
```

## Styling Classes

### Context Bar Buttons
```css
/* Desktop layout */
.hidden.lg:flex.items-center.gap-2

/* Mobile layout */
.lg:hidden.flex.flex-col.gap-2
```

### Edit Icons
```css
/* Icon button */
.p-2.text-gray-500.hover:text-primary.hover:bg-gray-100.rounded-lg.transition-colors
```

### Dialog Sizes
```typescript
size="md"  // Used for both Year and Term dialogs
```

## Testing Checklist

### Unit Test Locations
- [ ] `ContextBar.tsx` - Button clicks, dialog open/close
- [ ] `YearTermDialogs.tsx` - Validation logic
- [ ] `structureService.ts` - API calls

### Integration Test Scenarios
- [ ] Create year → Create term → Edit year → Edit term
- [ ] Overlap detection for years
- [ ] Overlap detection for terms
- [ ] Date constraints for terms
- [ ] Auto-suggestion logic
- [ ] Read-only mode for closed terms

### E2E Test Scenarios
- [ ] Full workflow: Create year → Create 3 terms → Edit dates
- [ ] Error handling: Try to create overlapping years/terms
- [ ] Responsive: Test on mobile and desktop
- [ ] RTL: Test in Arabic locale

## Common Customization Points

### Change Default Term Duration
**File:** `YearTermDialogs.tsx`
**Line:** ~235
```typescript
// Change from 16 weeks to desired duration
const suggestedEnd = dayjs(suggestedStart).add(16, "week").toDate();
```

### Change Date Format Display
**File:** `YearTermDialogs.tsx`
**Line:** Multiple locations
```typescript
format="YYYY-MM-DD"  // Change to desired format
```

### Disable Year Overlap Check
**File:** `YearTermDialogs.tsx`
**Line:** ~70-85
```typescript
// Comment out or remove this section
if (overlappingYear) {
  newErrors.startDate = tValidation("year_overlap", {
    yearName: overlappingYear.name,
  });
}
```

### Add Additional Validation
**File:** `YearTermDialogs.tsx`
**Function:** `validateForm()`
Add custom validation logic before `return Object.keys(newErrors).length === 0;`

## Dependencies

### Required Packages
- `@mui/x-date-pickers` - Date picker component
- `dayjs` - Date manipulation
- `next-intl` - Internationalization
- `lucide-react` - Icons

### No New Dependencies Added
All required packages were already in the project.
