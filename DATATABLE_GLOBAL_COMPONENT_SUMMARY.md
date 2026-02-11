# DataTable Component - Responsive Global Component

## Overview

The DataTable component is now a fully responsive, reusable table component used across all admissions sub-tabs and other sections of the application. It provides consistent table functionality with built-in sorting, pagination, search highlighting, and mobile optimization.

## Responsive Implementation

### Table Container

- **Horizontal scroll**: `overflow-x-auto` for mobile devices
- **Minimum width**: `min-w-[640px]` prevents cramping on small screens
- **Rounded corners**: `rounded-xl` with proper overflow handling
- **Shadow**: `shadow-sm` for subtle elevation

### Table Headers

- **Responsive padding**: `px-3 sm:px-4 lg:px-6` (tighter on mobile)
- **Responsive padding vertical**: `py-2.5 sm:py-3`
- **Text size**: `text-xs` (consistent across breakpoints for headers)
- **Truncate**: Long header text truncates with ellipsis
- **Sort icons**: `w-3 h-3 sm:w-4 sm:h-4` with `shrink-0`
- **Gap**: `gap-1.5 sm:gap-2` between label and icon

### Table Cells

- **Responsive padding**: `px-3 sm:px-4 lg:px-6` (matches headers)
- **Responsive padding vertical**: `py-3 sm:py-4`
- **Text size**: `text-xs sm:text-sm` (smaller on mobile)
- **Hover state**: Smooth transition on clickable rows

### Empty State

- **Responsive padding**: `py-8 sm:py-12`
- **Text size**: `text-sm` (consistent)

### Pagination

- **Layout**: Stacks vertically on mobile (`flex-col sm:flex-row`)
- **Spacing**: `gap-3 sm:gap-4`
- **Padding**: `px-3 sm:px-4 lg:px-6 py-3 sm:py-4`

#### Items Per Page Section

- **Layout**: Stacks on mobile (`flex-col sm:flex-row`)
- **Label**: `text-xs sm:text-sm` with `shrink-0`
- **Select**: `min-h-[40px]` for touch targets
- **Select padding**: `px-2 sm:px-3`
- **Select text**: `text-xs sm:text-sm`

#### Page Navigation

- **Horizontal scroll**: `overflow-x-auto pb-2 sm:pb-0` on mobile
- **Gap**: `gap-1 sm:gap-2`
- **Button sizes**: `min-h-[36px] min-w-[36px]` for touch targets
- **Icon buttons**: `shrink-0` to prevent squishing
- **Page numbers**: `min-w-[36px] sm:min-w-[40px]`
- **Page number padding**: `px-2 sm:px-3`
- **Page number text**: `text-xs sm:text-sm`
- **Shrink-0**: All buttons prevent squishing

## Features

### 1. Sorting

- Click column headers to sort (asc → desc → none)
- Visual indicators: ArrowUp, ArrowDown, ArrowUpDown
- Handles strings, numbers, dates automatically
- Null/undefined values handled gracefully
- Responsive icons: `w-3 h-3 sm:w-4 sm:h-4`

### 2. Pagination

- Configurable items per page (5, 10, 25, 50, 100)
- Smart page number display with ellipsis
- First/Previous/Next/Last navigation
- Shows current range and total entries
- Fully responsive with horizontal scroll on mobile
- Touch-friendly buttons (36-40px min-height)

### 3. Search Highlighting

- Automatic highlighting on searchable columns
- Yellow background with rounded corners
- Case-insensitive matching
- Regex-based highlighting

### 4. Custom Renderers

- Support for custom cell rendering
- Used for status badges, action buttons, date formatting
- Full access to row data in render functions

### 5. Row Click Handling

- Optional onRowClick callback
- Hover state for clickable rows
- Smooth transitions

## Column Configuration

```typescript
interface Column<T> {
  key: string; // Data key
  label: string; // Column header
  sortable?: boolean; // Enable sorting (default: true)
  searchable?: boolean; // Enable search highlighting
  render?: (value: unknown, row: T) => React.ReactNode; // Custom renderer
}
```

## Props

```typescript
interface DataTableProps<T> {
  columns: Column<T>[]; // Column definitions
  data: T[]; // Data array
  onRowClick?: (row: T) => void; // Optional row click handler
  itemsPerPage?: number; // Items per page (default: 10)
  showPagination?: boolean; // Show pagination (default: true)
  searchQuery?: string; // Search query for highlighting
}
```

## Usage Example

```typescript
const columns = [
  { key: "id", label: "ID", searchable: true },
  { key: "name", label: "Name", searchable: true },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (value) => <StatusBadge status={value} />
  },
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString()
  },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    render: (_, row) => <ActionButtons row={row} />
  }
];

<DataTable
  columns={columns}
  data={filteredData}
  searchQuery={searchQuery}
  showPagination={true}
  itemsPerPage={10}
  onRowClick={(row) => handleRowClick(row)}
/>
```

## Responsive Breakpoints

- **Mobile** (<640px): Tighter spacing, smaller text, horizontal scroll
- **Tablet** (640-1024px): Medium spacing and text
- **Desktop** (>1024px): Full spacing and text

## Mobile Optimizations

1. **Horizontal scroll** - Table scrolls horizontally on small screens
2. **Minimum width** - Prevents table from becoming too cramped
3. **Tighter spacing** - Reduced padding on mobile (px-3 vs px-6)
4. **Smaller text** - text-xs on mobile, text-sm on desktop
5. **Touch targets** - All buttons 36-40px minimum height
6. **Pagination scroll** - Page numbers scroll horizontally on mobile
7. **Stacked layout** - Pagination info stacks vertically on mobile
8. **Responsive icons** - Icons scale down on mobile (w-3 vs w-4)

## Accessibility

- **Keyboard navigation** - All interactive elements keyboard accessible
- **Focus indicators** - Visible focus states
- **ARIA labels** - Proper button titles (First page, Previous page, etc.)
- **Touch targets** - Minimum 36px for mobile usability
- **Semantic HTML** - Proper table structure
- **Screen reader friendly** - Clear labels and structure

## Performance

- **Efficient sorting** - Single pass through data
- **Memoization ready** - Works well with useMemo for data
- **No unnecessary re-renders** - Controlled state updates
- **Lightweight** - No external dependencies beyond Lucide icons

## Browser Compatibility

- ✅ Chrome/Edge (mobile & desktop)
- ✅ Firefox (mobile & desktop)
- ✅ Safari (iOS & macOS)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Used In

- DocumentCenter (Admissions)
- LeadsList (Admissions)
- ApplicationsList (Admissions)
- TestsList (Admissions)
- InterviewsList (Admissions)
- DecisionsList (Admissions)
- EnrollmentList (Admissions)

## Files

- `src/components/ui/common/DataTable.tsx` - Main component

## Status

✅ Fully responsive and production-ready
✅ No TypeScript errors
✅ Consistent with design system
✅ Touch-friendly on mobile
✅ Accessible and performant
