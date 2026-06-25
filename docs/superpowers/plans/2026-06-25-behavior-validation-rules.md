# Behavior Validation Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement validation and business rules for behavior categories, records, and reviews in the behavior module, along with unit tests.

**Architecture:** Centralize pure validation logic in the behavior utility file, then wire it to forms and page actions.

**Tech Stack:** React, Next.js, Vitest, tailwindcss

## Global Constraints
- Naming rules: follow existing CamelCase for variables/functions.
- Copies: use translations from `en.json` and `ar.json`.

---

### Task 1: Centralized Domain Rules in behaviorUiRules.ts

**Files:**
- Modify: `src/features/behavior/shared/utils/behaviorUiRules.ts`
- Modify: `src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts`

**Interfaces:**
- Consumes: `BehaviorCategory`, `BehaviorRecord`, `BehaviorType`, `BehaviorStatus` types
- Produces:
  - `normalizeCategoryCode(code: string): string`
  - `validateCategoryCode(code: string): boolean`
  - `validateCategoryName(nameEn?: string, nameAr?: string): boolean`
  - `validatePoints(type: BehaviorType, points: number | string): boolean`
  - `validateRecordContent(record: { titleEn?: string; titleAr?: string; noteEn?: string; noteAr?: string }): boolean`
  - `validateRecordCategory(category: { isActive: boolean; type: BehaviorType }, recordType: BehaviorType): boolean`
  - `validateRecordTermDate(occurredAt: string | Date, termRange?: { startDate: string; endDate: string }): boolean`
  - `validatePointsOverride(type: BehaviorType, points: number | string): boolean`
  - `shouldCreatePointLedger(status: BehaviorStatus): boolean`
  - `validateDateRange(from?: string | Date | null, to?: string | Date | null): boolean`

- [ ] **Step 1: Write the failing tests**
  Add test blocks to `src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts` covering:
  - normalization (collapsing repeated underscores, converting hyphens to underscores, stripping leading/trailing underscores, uppercasing)
  - name validation (nameEn or nameAr)
  - points sign and integer validation (accept numeric strings, reject decimals/NaN)
  - record category active and type compatibility
  - occurredAt inside term bounds (inclusive of startDate and endDate, returns false on invalid date parsing)
  - points override check
  - date range validator.

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm run test:run -- src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts`
  Expected: FAIL with undefined function errors or missing test coverage.

- [ ] **Step 3: Write minimal implementation in behaviorUiRules.ts**
  Add the validation and normalization functions to `src/features/behavior/shared/utils/behaviorUiRules.ts`. Ensure `points` validations parse string inputs, use `Number.isInteger(num)` (rejecting decimals/NaN), check date parsing, and type compatibility.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npm run test:run -- src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/shared/utils/behaviorUiRules.ts src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts
  git commit -m "feat(behavior): implement and test domain validation rules"
  ```

---

### Task 2: Wire Category Validation & Usage Checks in CategoryModal

**Files:**
- Modify: `src/features/behavior/shared/components/BehaviorActionModals.tsx`

**Interfaces:**
- Consumes: Domain validation functions from `behaviorUiRules.ts`

- [ ] **Step 1: Allow editing Category Code on creation and conditionally on edit**
  In `CategoryModal` within `BehaviorActionModals.tsx`, allow code editing on create. On edit, disable code only when category usage is known and category is in use, unless the product decision is to always lock code after creation.

- [ ] **Step 2: Implement validation & normalization on Save**
  In `handleSave` of `CategoryModal`, call `normalizeCategoryCode(form.code)` first. Then call `validateCategoryCode`, `validateCategoryName`, and `validatePoints` before calling `createBehaviorCategory` or `updateBehaviorCategory`. Show appropriate validation toasts.

- [ ] **Step 3: Enforce edit controls if category in-use is known**
  Disable both `code` and `type` inputs in edit mode if the category usage is known and the category is in use.

- [ ] **Step 4: Catch backend behavior.category.in_use error**
  Wrap saving inside try-catch, and in catch, map backend code `behavior.category.in_use` to `errors.categoryInUse`.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/shared/components/BehaviorActionModals.tsx
  git commit -m "feat(behavior): integrate category form validations and usage constraints"
  ```

---

### Task 3: Category Deletion and Error Handling

**Files:**
- Modify: `src/features/behavior/categories/pages/BehaviorCategoriesPage.tsx`
- Modify: `src/features/behavior/services/behaviorApiService.ts`

**Interfaces:**
- Consumes: `deleteBehaviorCategory` from `behaviorApiService.ts`

- [ ] **Step 1: Check deleteBehaviorCategory existence**
  If `deleteBehaviorCategory` does not exist in `behaviorApiService.ts`, add it.

- [ ] **Step 2: Add Delete button to Category Table**
  Add a Delete action button next to Edit in the actions column of `BehaviorCategoriesPage.tsx`.

- [ ] **Step 3: Trigger deletion and handle conflict error**
  When Delete is clicked, show a confirm dialog. On confirm, invoke `deleteBehaviorCategory`. Catch any API error, check if error code matches `behavior.category.in_use`, and display `errors.categoryInUse` toast.

- [ ] **Step 4: Run dev app to manually test**
  Verify clicking Delete on category in use shows the correct toast, and deleting unused category succeeds.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/categories/pages/BehaviorCategoriesPage.tsx src/features/behavior/services/behaviorApiService.ts
  git commit -m "feat(behavior): add category delete action with conflict error mapping"
  ```

---

### Task 4: Wire Record Validation and Date Range Filters

**Files:**
- Modify: `src/features/behavior/shared/components/BehaviorActionModals.tsx`
- Modify: `src/features/behavior/shared/components/BehaviorFiltersBar.tsx`
- Modify: `src/features/behavior/shared/components/BehaviorTable.tsx`
- Modify: `src/features/behavior/shared/components/BehaviorDetailDrawer.tsx`

**Interfaces:**
- Consumes: Domain rules from `behaviorUiRules.ts`

- [ ] **Step 1: Hide/disable record edit actions for non-draft records**
  Update `BehaviorTable.tsx`, `BehaviorDetailDrawer.tsx`, and pages to hide or disable record edit actions for records that are not in `draft` status. Keep the save-handler guard inside `RecordModal` as a backup.

- [ ] **Step 2: Implement Record form validations**
  In `RecordModal` of `BehaviorActionModals.tsx`, validate:
  - at least one title/note is present.
  - points are integer and compatible with type.
  - category is active and compatible. If values are missing on the record form, default them from category metadata.
  - occurredAt term limit check.
  Only allow editing if record status is `draft`.
  In `ApproveModal`, validate that `pointsOverride` is an integer and compatible with type before calling `approveBehaviorRecord`.

- [ ] **Step 3: Add Date Range pickers to filters**
  In `BehaviorFiltersBar.tsx`, add Date From and Date To inputs. Validate that From date is not after To date.

- [ ] **Step 4: Run Vitest behavior suite to ensure everything compiles and passes**
  Run: `npm run test:run -- src/features/behavior`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/shared/components/BehaviorActionModals.tsx src/features/behavior/shared/components/BehaviorFiltersBar.tsx src/features/behavior/shared/components/BehaviorTable.tsx src/features/behavior/shared/components/BehaviorDetailDrawer.tsx
  git commit -m "feat(behavior): enforce record save constraints, hide edit actions for non-draft, and date filter validations"
  ```
