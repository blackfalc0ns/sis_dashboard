# Behavior Validation and Business Rules Spec

This document specifies the validation and business rules for behavior categories, records, and reviews within the behavior module.

## 1. Domain Validation Rules

The following functions will be implemented in `src/features/behavior/shared/utils/behaviorUiRules.ts`:

### Category Rules
- **Category Code Validation and Normalization:**
  - `normalizeCategoryCode(code: string): string`: Converts input to uppercase, replaces spaces and hyphens with underscores, and trims any leading or trailing underscores.
  - `validateCategoryCode(code: string): boolean`: Ensures code is required, matches regex `^[A-Z0-9]+(?:_[A-Z0-9]+)*$`, and is at most 100 characters long.
- **Category Name Validation:**
  - `validateCategoryName(nameEn?: string, nameAr?: string): boolean`: Checks that at least one of `nameEn` or `nameAr` is present and contains non-whitespace characters.
- **Category Points Validation:**
  - `validateCategoryPoints(type: BehaviorType, points: number): boolean`:
    - For `positive` behavior, points must be `>= 0`.
    - For `negative` behavior, points must be `<= 0`.

### Record Rules
- **Record Content Validation:**
  - `validateRecordContent(record: { titleEn?: string; titleAr?: string; noteEn?: string; noteAr?: string }): boolean`: Ensures at least one of `titleEn`, `titleAr`, `noteEn`, or `noteAr` contains non-whitespace characters.
- **Record Points Validation:**
  - `validateRecordPoints(type: BehaviorType, points: number): boolean`:
    - For `positive` behavior, points must be `>= 0`.
    - For `negative` behavior, points must be `<= 0`.
- **Record Category Compatibility:**
  - `validateRecordCategory(category: { isActive: boolean; type: BehaviorType }, recordType: BehaviorType): boolean`: Category must be active and type-compatible (matching record type).
- **Record Term Date Validation:**
  - `validateRecordTermDate(occurredAt: string | Date, termRange: { startDate: string; endDate: string }): boolean`: Checks if `occurredAt` date falls inside the selected term's date range.
- **Enrollment Scope Validation:**
  - `validateEnrollmentScope(enrollment: { studentId: string; academicYearId: string; termId?: string }, scope: { studentId: string; academicYearId: string; termId?: string }): boolean`: Verifies that the student's enrollment matches the selected academic year and term context.

### Review and Date Range Rules
- **Review Approval Ledger Creation:**
  - `shouldCreatePointLedger(status: BehaviorStatus): boolean`: Returns `true` only for approved status (which creates a point ledger). Returns `false` for rejected status (which does not create a point ledger).
- **Dashboard/Review Date Range Validation:**
  - `validateDateRange(dateFrom?: string | Date | null, dateTo?: string | Date | null): boolean`: Verifies that `dateFrom` is not after `dateTo`.

---

## 2. Component Integration

### Category Creation & Modification (`CategoryModal`)
- **Code Field Editing:** Code field is editable on creation and disabled on edit mode if the category is in use.
- **Name Validation:** Shows validation error if both name fields are empty.
- **Points Validation:** Ensures correct sign is used based on type.

### Record Creation & Modification (`RecordModal` & `ApproveModal`)
- **Content Requirements:** Blocks saving records with empty content.
- **Term Range Check:** Checks if `occurredAt` falls within selected term date limits before submitting or saving.
- **Scope Verification:** Automatically associates student record with the corresponding student enrollment matching the selected academic year and term.

### Behavior Categories Page (`BehaviorCategoriesPage.tsx`)
- **Delete Category Button:** Added to the actions list.
- **Delete Block:** Checks if the category is used by records or point ledger entries. If used, the delete action shows toast message `errors.categoryInUse` and does not call the delete service.

### Filter Panel (`BehaviorFiltersBar.tsx`)
- **Date Pickers:** Date From and Date To inputs are added to filter behavior records by occurrence.
- **Filter Date Validation:** Restricts filtering if Date From is after Date To.

---

## 3. Verification Plan

### Unit Tests
We will add comprehensive unit tests in `src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts` verifying all 12 rules with various combinations of valid and invalid data.

### Manual Verification
- Verify that creating a category with invalid code regex fails with validation message.
- Verify that editing code of an existing category that has records is disabled or blocked.
- Verify that deleting a category that has records is blocked and displays the toast error.
- Verify that entering a Date From after Date To in filters raises an error.
