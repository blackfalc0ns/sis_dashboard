# Attendance Module - Token-Based Styling Migration

## Status: PARTIALLY COMPLETED

This document outlines the systematic migration of the Attendance module from hardcoded colors and Tailwind gray literals to token-based styling using CSS variables from global.css.

## Completed Work

### 1. Created Shared Status Styles Utility ✅
**File**: `src/features/attendance/shared/statusStyles.ts`

Created centralized utility functions for all attendance status styling:
- `getAttendanceStatusStyle()` - For PRESENT, ABSENT, LATE, EXCUSED, EARLY_LEAVE, UNMARKED
- `getExcuseStatusStyle()` - For PENDING, APPROVED, REJECTED
- `getSessionStatusStyle()` - For DRAFT, SUBMITTED
- `getKpiIconStyle()` - For KPI cards (primary, success, warning, danger, neutral)
- `getCoverageStyle()` - For coverage percentage indicators

All functions return `StatusStyle` objects with token-based colors using `var(--...)` syntax.

### 2. Fixed Roll Call Components ✅

#### AttendanceRollCallPage.tsx
- Replaced `bg-white border-gray-200` with `backgroundColor: "var(--background)", borderColor: "var(--color-border)"`
- Fixed empty state text colors to use `var(--color-gray-900)` and `var(--color-gray-600)`
- Fixed icon colors to use `var(--color-neutral-500)`

#### SessionPickerPanel.tsx
- Replaced all `bg-white`, `border-gray-*`, `text-gray-*` with token-based styling
- Integrated `getSessionStatusStyle()` for status badges
- Fixed period selection buttons to use tokens
- Fixed daily mode indicator to use `var(--color-primary-*)` tokens

#### RosterTable.tsx
- Fixed student avatar placeholder: `var(--color-neutral-200)` and `var(--color-neutral-500)`
- Fixed student name/number colors: `var(--color-gray-900)` and `var(--color-neutral-500)`
- Fixed minutes input labels: `var(--color-neutral-500)`
- Fixed empty cell placeholder: `var(--color-neutral-400)`
- Fixed read-only note text: `var(--color-gray-600)`

#### RosterFiltersBar.tsx
- Fixed container: `var(--background)` and `var(--color-border)`
- Fixed search icon: `var(--color-neutral-400)`
- Fixed filter toggle button with conditional token-based styling
- Fixed label colors: `var(--color-gray-700)`

### 3. Available CSS Tokens (from global.css)

#### Base Colors
- `--background` - Main background (#ffffff)
- `--foreground` - Main text (#171717)
- `--primary-color` - Primary brand color (#036b80)
- `--hover-color` - Hover state (#025a6b)
- `--accent-color` - Accent color (#F7A201)
- `--border-color` - Border color (#cccccccc)

#### Color Scales (50-950)
- `--color-primary-*` (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)
- `--color-hover-*` (50-950)
- `--color-accent-*` (50-900)
- `--color-surface-*` (50-500)
- `--color-neutral-*` (50-500)
- `--color-gray-*` (50-950)

#### Semantic Tokens
- `--color-white` - White color
- `--color-black` - Black color
- `--shadow-main` - Main box shadow

## Remaining Work

### High Priority Files (Contains Most Hardcoded Colors)

#### 1. Policies Components
- [ ] `PoliciesKpiPanel.tsx` - Replace ALL hex colors with `getKpiIconStyle()` and `getCoverageStyle()`
- [ ] `PoliciesListPanel.tsx` - Fix gray literals in table and filters
- [ ] `PolicyEditorPanel.tsx` - Fix form styling
- [ ] `PolicyWizardDialog.tsx` - Fix wizard step styling
- [ ] `wizard/Step3ModeComputation.tsx` - Fix period selection grid
- [ ] `wizard/Step4Rules.tsx` - Fix rules form styling

#### 2. Roll Call Remaining
- [ ] `RollCallHeaderBar.tsx` - Fix header background and borders
- [ ] `RollCallFiltersDrawer.tsx` - Fix drawer styling
- [ ] `RollCallQuickPresets.tsx` - Fix preset button styling
- [ ] `AttendanceKpisBar.tsx` - Fix KPI bar styling
- [ ] `AttendanceStatusPill.tsx` - Integrate `getAttendanceStatusStyle()`
- [ ] `ExcuseModal.tsx` - Fix modal styling
- [ ] `MinutesEditorModal.tsx` - Fix modal styling

#### 3. Absences Components
- [ ] `AttendanceAbsencesPage.tsx` - Fix page layout styling
- [ ] `AbsencesTable.tsx` - Fix table and status chips
- [ ] `AbsencesFiltersBar.tsx` - Fix filters styling
- [ ] `AbsencesFiltersDrawer.tsx` - Fix drawer styling
- [ ] `EarlyLeaveEditorModal.tsx` - Fix modal styling

#### 4. Excuses Components
- [ ] `AttendanceExcusesPage.tsx` - Fix page layout
- [ ] `ExcusesTable.tsx` - Fix table and status chips
- [ ] `ExcuseRequestModal.tsx` - Fix modal styling
- [ ] `ExcuseDetailsDrawer.tsx` - Fix drawer styling

#### 5. Late/Early Components
- [ ] `AttendanceLateEarlyPage.tsx` - Fix page layout
- [ ] `LateEarlyTable.tsx` - Fix table styling
- [ ] `LateEarlyFilters.tsx` - Fix filters

#### 6. Shared Components
- [ ] `ScopePicker.tsx` - Fix scope selection styling
- [ ] `ScopeBreadcrumb.tsx` - Fix breadcrumb styling
- [ ] `ExportButton.tsx` - Fix button styling (if has hardcoded colors)

### Search Results Summary

#### Tailwind Gray Literals Found
- `text-gray-*`: ~50+ occurrences
- `bg-gray-*`: ~30+ occurrences
- `border-gray-*`: ~40+ occurrences
- `hover:bg-gray-*`: ~10+ occurrences

#### Hex Colors Found
- `PoliciesKpiPanel.tsx`: 30+ hex colors (CRITICAL)
- Various status indicators: ~20 hex colors
- Icon colors: ~15 hex colors

## Implementation Strategy

### Phase 1: Status Indicators (COMPLETED)
1. ✅ Create `statusStyles.ts` utility
2. ✅ Define all status color mappings
3. ✅ Export reusable functions

### Phase 2: Roll Call Tab (PARTIALLY COMPLETED)
1. ✅ Fix main page layout
2. ✅ Fix SessionPickerPanel
3. ✅ Fix RosterTable
4. ✅ Fix RosterFiltersBar
5. ⏳ Fix remaining components (HeaderBar, Drawers, Modals, Pills)

### Phase 3: Policies Tab (NOT STARTED)
1. ⏳ Fix KPI Panel (CRITICAL - most hex colors)
2. ⏳ Fix List Panel
3. ⏳ Fix Editor Panel
4. ⏳ Fix Wizard components

### Phase 4: Other Tabs (NOT STARTED)
1. ⏳ Fix Absences tab
2. ⏳ Fix Excuses tab
3. ⏳ Fix Late/Early tab
4. ⏳ Fix Reports tab

### Phase 5: Shared Components (NOT STARTED)
1. ⏳ Fix ScopePicker
2. ⏳ Fix ScopeBreadcrumb
3. ⏳ Fix ExportButton

## Token Mapping Guide

### Common Replacements

#### Text Colors
```tsx
// OLD
className="text-gray-900"
className="text-gray-700"
className="text-gray-600"
className="text-gray-500"
className="text-gray-400"

// NEW
style={{ color: "var(--color-gray-900)" }}
style={{ color: "var(--color-gray-700)" }}
style={{ color: "var(--color-gray-600)" }}
style={{ color: "var(--color-neutral-500)" }}
style={{ color: "var(--color-neutral-400)" }}
```

#### Background Colors
```tsx
// OLD
className="bg-white"
className="bg-gray-50"
className="bg-gray-100"
className="bg-gray-200"

// NEW
style={{ backgroundColor: "var(--background)" }}
style={{ backgroundColor: "var(--color-neutral-50)" }}
style={{ backgroundColor: "var(--color-neutral-100)" }}
style={{ backgroundColor: "var(--color-neutral-200)" }}
```

#### Border Colors
```tsx
// OLD
className="border-gray-200"
className="border-gray-300"

// NEW
style={{ borderColor: "var(--color-border)" }}
style={{ borderColor: "var(--color-neutral-300)" }}
```

#### Hover States
```tsx
// OLD
className="hover:bg-gray-50"
className="hover:bg-gray-100"

// NEW
className="hover:bg-[var(--color-neutral-50)]"
className="hover:bg-[var(--color-neutral-100)]"
```

### Status Chip Pattern
```tsx
// OLD - Inline hardcoded
<span className="bg-green-100 text-green-800 px-2 py-1 rounded">
  {status}
</span>

// NEW - Using utility
import { getAttendanceStatusStyle } from "@/features/attendance/shared/statusStyles";

const style = getAttendanceStatusStyle(status);
<span 
  style={{ 
    backgroundColor: style.bg, 
    color: style.fg,
    borderColor: style.border 
  }}
  className="px-2 py-1 rounded border"
>
  {status}
</span>
```

### KPI Card Pattern
```tsx
// OLD - Hex colors
<KPICard
  icon={Shield}
  iconColor="#2563eb"
  iconBgColor="#dbeafe"
  ...
/>

// NEW - Using utility
import { getKpiIconStyle } from "@/features/attendance/shared/statusStyles";

const style = getKpiIconStyle("primary");
<KPICard
  icon={Shield}
  iconColor={style.iconFg}
  iconBgColor={style.iconBg}
  ...
/>
```

## Testing Checklist

After completing all migrations:

### Visual Regression
- [ ] Roll Call tab looks identical to before
- [ ] Policies tab looks identical to before
- [ ] Absences tab looks identical to before
- [ ] Excuses tab looks identical to before
- [ ] Late/Early tab looks identical to before
- [ ] All status indicators have correct colors
- [ ] All hover states work correctly
- [ ] All focus states work correctly

### Accessibility
- [ ] Text contrast ratios maintained (WCAG AA minimum)
- [ ] Focus indicators visible
- [ ] Status colors distinguishable

### Functionality
- [ ] No broken layouts
- [ ] No missing colors (white text on white bg, etc.)
- [ ] RTL/LTR still works correctly
- [ ] Dark mode ready (if applicable)

### Code Quality
- [ ] No remaining `text-gray-*` in attendance module
- [ ] No remaining `bg-gray-*` in attendance module
- [ ] No remaining `border-gray-*` in attendance module
- [ ] No remaining hex colors (#...) in attendance module
- [ ] All status styling uses shared utility
- [ ] No duplicated color definitions

## Verification Commands

```bash
# Check for remaining Tailwind gray literals
rg "text-gray-|bg-gray-|border-gray-|ring-gray-" src/features/attendance

# Check for remaining hex colors
rg "#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}" src/features/attendance

# Should return ZERO results when complete
```

## Benefits of This Migration

1. **Consistency**: All colors come from a single source of truth
2. **Maintainability**: Change theme colors in one place (global.css)
3. **Dark Mode Ready**: Easy to add dark mode by changing CSS variables
4. **Accessibility**: Centralized color management makes it easier to ensure contrast ratios
5. **Performance**: No runtime color calculations
6. **Type Safety**: TypeScript interfaces for status styles
7. **Reusability**: Status styling shared across all tabs
8. **Future-Proof**: Easy to add new status types or themes

## Next Steps

1. Complete Roll Call tab remaining components
2. Fix PoliciesKpiPanel.tsx (CRITICAL - most hex colors)
3. Systematically work through each tab
4. Run verification commands
5. Visual regression testing
6. Update this document as work progresses

## Notes

- Keep visual hierarchy intact - don't change which elements are emphasized
- Maintain accessibility - ensure contrast ratios stay compliant
- Test in both LTR and RTL modes
- No logic changes - styling only
- Keep AR/EN translations unchanged
