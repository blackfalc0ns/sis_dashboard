# Allocation Matrix Refactoring - Shared Component

## Overview

Extracted the common matrix table structure from the Subjects Allocation Matrix and created a reusable `AllocationMatrixTable` component that is now used by both Subjects Allocation and Teacher Allocation matrices.

## What Was Done

### 1. Created Shared Component

**File:** `src/components/features/academics/components/shared/AllocationMatrixTable.tsx`

A generic, reusable matrix table component with the following features:

- **Generic Types**: Supports any row and column types that extend `MatrixRow` and `MatrixColumn` interfaces
- **Pinned Headers**: Sticky row and column headers that stay visible during scrolling
- **RTL Support**: Automatically adjusts layout for Arabic (RTL) locale
- **Customizable Rendering**:
  - `renderCell`: Custom cell rendering function
  - `renderColumnHeader`: Optional custom column header rendering
  - `renderRowTotal`: Optional custom total column rendering
- **Styling**: Uses CSS variables for consistent theming
- **Hover Effects**: Row highlighting on hover
- **Alternating Rows**: Even/odd row coloring for better readability

### 2. Updated Subjects Allocation Matrix

**File:** `src/components/features/academics/components/subjects/AllocationMatrix.tsx`

**Changes:**
- Imported `AllocationMatrixTable` and its types
- Prepared matrix data using `matrixRows` and `matrixColumns`
- Created `renderCell` function for number input cells
- Created `getRowTotal` function for calculating grade totals
- Replaced entire table markup with `<AllocationMatrixTable />` component
- Removed ~200 lines of table HTML/JSX

**Result:** Cleaner, more maintainable code with the same functionality.

### 3. Updated Teacher Allocation Matrix

**File:** `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx`

**Changes:**
- Imported `AllocationMatrixTable` and its types
- Prepared matrix data with section and subject information
- Created `renderCell` function for `TeacherSelect` components
- Created `renderColumnHeader` function for custom headers with bulk action buttons
- Created `renderRowTotal` function for missing count display
- Replaced entire table markup with `<AllocationMatrixTable />` component
- Removed ~150 lines of table HTML/JSX

**Result:** Consistent table structure with specialized rendering for teacher selection.

## Component API

### MatrixRow Interface

```typescript
export interface MatrixRow {
  id: string;
  label: string;
  secondaryLabel?: string;
}
```

### MatrixColumn Interface

```typescript
export interface MatrixColumn {
  id: string;
  label: string;
  code?: string;
  minWidth?: string;
  maxWidth?: string;
}
```

### AllocationMatrixTable Props

```typescript
interface AllocationMatrixTableProps<TRow, TColumn> {
  rows: TRow[];                                    // Array of row data
  columns: TColumn[];                              // Array of column data
  rowHeaderLabel: string;                          // Label for row header column
  totalColumnLabel?: string;                       // Label for total/summary column (optional)
  renderCell: (row: TRow, column: TColumn) => ReactNode;  // Cell renderer
  renderColumnHeader?: (column: TColumn) => ReactNode;    // Custom column header (optional)
  getRowTotal?: (row: TRow) => number;            // Calculate row total (optional)
  renderRowTotal?: (row: TRow) => ReactNode;      // Custom total cell renderer (optional)
  isEvenRow?: (index: number) => boolean;         // Row striping logic (optional)
  className?: string;                              // Additional CSS classes (optional)
}
```

## Usage Examples

### Simple Number Input Matrix (Subjects Allocation)

```typescript
<AllocationMatrixTable
  rows={matrixRows}
  columns={matrixColumns}
  rowHeaderLabel={t("table.grade")}
  totalColumnLabel={t("table.total")}
  renderCell={(row, column) => (
    <input
      type="number"
      value={getValue(row, column)}
      onChange={(e) => setValue(row, column, e.target.value)}
    />
  )}
  getRowTotal={(row) => calculateTotal(row)}
/>
```

### Complex Custom Rendering (Teacher Allocation)

```typescript
<AllocationMatrixTable
  rows={matrixRows}
  columns={matrixColumns}
  rowHeaderLabel={t("matrix.section")}
  totalColumnLabel={t("matrix.missingCount")}
  renderCell={(row, column) => (
    <TeacherSelect
      value={getValue(row, column)}
      onChange={(value) => setValue(row, column, value)}
    />
  )}
  renderColumnHeader={(column) => (
    <div>
      <span>{column.label}</span>
      <IconButton onClick={() => bulkAction(column)} />
    </div>
  )}
  renderRowTotal={(row) => (
    <span>{getMissingCount(row)}</span>
  )}
/>
```

## Benefits

### Code Reusability
- Single source of truth for matrix table structure
- Consistent behavior across all allocation matrices
- Easy to add new matrix types in the future

### Maintainability
- Changes to table structure only need to be made once
- Reduced code duplication (~350 lines removed total)
- Clearer separation of concerns

### Consistency
- Identical styling and behavior across matrices
- Same RTL support implementation
- Unified hover effects and interactions

### Flexibility
- Generic types allow any data structure
- Custom rendering functions for specialized needs
- Optional features (totals, custom headers) can be enabled per use case

## Files Modified

1. **Created:**
   - `src/components/features/academics/components/shared/AllocationMatrixTable.tsx` (~200 lines)

2. **Modified:**
   - `src/components/features/academics/components/subjects/AllocationMatrix.tsx` (removed ~200 lines, added ~50 lines)
   - `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx` (removed ~150 lines, added ~80 lines)

## Net Result

- **Lines Added:** ~330
- **Lines Removed:** ~350
- **Net Change:** -20 lines
- **Reusable Component:** 1 new shared component
- **Improved Maintainability:** Significant

## Future Enhancements

The shared component can be extended to support:
- Column sorting
- Column resizing
- Cell validation indicators
- Keyboard navigation
- Copy/paste functionality
- Bulk edit operations
- Export functionality at component level

## Testing

To verify the refactoring:
1. Navigate to Academics > Subjects Allocation (Tab 2)
2. Verify the matrix displays correctly
3. Test number input, save, reset, and export
4. Navigate to Academics > Teacher Allocation (Tab 7)
5. Verify the matrix displays correctly
6. Test teacher selection, bulk actions, save, reset, and export
7. Test in both English and Arabic locales
8. Verify RTL layout works correctly in Arabic

All functionality should work exactly as before the refactoring.
