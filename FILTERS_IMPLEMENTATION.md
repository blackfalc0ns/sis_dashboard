# Table Filters Implementation

## Overview

Added comprehensive filtering functionality to Applications and Leads tables with search, status filters, and additional criteria. Includes visual search highlighting to identify matching terms.

## Features Implemented

### 0. Search Highlighting & Result Counter (NEW)

**Component:** `src/components/admissions/HighlightText.tsx`

A reusable component that highlights search terms in table cells:

- Yellow background highlight for matching text
- Case-insensitive matching
- Regex-safe escaping of special characters
- Works with any text content

**Visual Features:**

- Highlighted text: Yellow background (`bg-yellow-200`)
- Bold font weight for emphasis
- Rounded corners for polish
- Maintains text readability

**Search Result Counter:**

- Shows real-time count of matching results inside search input
- Teal color to match theme
- Updates instantly as you type
- Active search indicated by teal border and ring effect

### 1. Applications List Filters

**Location:** `src/components/admissions/ApplicationsList.tsx`

**Filter Options:**

- **Search**: Real-time search across:
  - Student name
  - Guardian name
  - Application ID
  - Guardian email
- **Status Filter**: Filter by application status
  - All Statuses
  - Submitted
  - Documents Pending
  - Under Review
  - Accepted
  - Waitlisted
  - Rejected
- **Grade Filter**: Filter by requested grade (dynamically populated from data)

**UI Features:**

- Collapsible advanced filters panel
- "Clear Filters" button (appears when filters are active)
- Empty state with clear filters option
- Status tags bar updates based on filtered results
- Filter button highlights when panel is open

### 2. Leads List Filters

**Location:** `src/components/admissions/LeadsList.tsx`

**Filter Options:**

- **Search**: Real-time search across:
  - Lead name
  - Phone number
  - Email address
- **Status Filter**: Filter by lead status
  - All Statuses
  - New
  - Contacted
  - Qualified
  - Converted
  - Disqualified
- **Source Filter**: Filter by lead source/channel (dynamically populated)
- **Grade Filter**: Filter by requested grade (dynamically populated)

**UI Features:**

- Collapsible advanced filters panel with 3 filter dropdowns
- "Clear Filters" button (appears when filters are active)
- Empty state with clear filters option
- Status tags bar updates based on filtered results
- Filter button highlights when panel is open

### 3. Parent Inquiries Filters

**Location:** `src/components/inquiries/InquiriesInbox.tsx`

**Already Implemented:**

- Search across parent name, email, phone, and message
- Status filter dropdown
- Category filter dropdown
- Filters respect the status tags bar

## Technical Implementation

### State Management

```tsx
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
const [gradeFilter, setGradeFilter] = useState<string>("all");
const [showFilters, setShowFilters] = useState(false);
```

### Filtering Logic

Uses `useMemo` for performance optimization:

```tsx
const filteredData = useMemo(() => {
  return data.filter((item) => {
    const matchesSearch = /* search logic */;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesGrade = gradeFilter === "all" || item.grade === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });
}, [searchQuery, statusFilter, gradeFilter]);
```

### Dynamic Filter Options

Unique values are extracted from data:

```tsx
const uniqueGrades = useMemo(() => {
  const grades = new Set(data.map((item) => item.grade));
  return Array.from(grades).sort();
}, []);
```

## UI/UX Features

### 0. Search Highlighting (NEW)

- **Yellow highlights** on matching text in table cells
- Works across all searchable fields
- Case-insensitive matching
- Real-time updates as you type

### 0.5. Search Result Counter (NEW)

- Shows number of results inside search input
- Active search indicated by teal border and ring
- Instant feedback on search effectiveness

### 1. Filter Toggle Button

- Changes color when filters panel is open
- Shows active state with teal background
- Icon indicates filter functionality

### 2. Clear Filters Button

- Only appears when filters are active
- Red accent color for visibility
- Includes X icon for clarity
- Resets all filter states

### 3. Advanced Filters Panel

- Collapsible design to save space
- Gray background for visual separation
- Labeled dropdowns for clarity
- Responsive grid layout

### 4. Empty States

- Different messages for "no data" vs "no matches"
- Inline clear filters button in empty state
- Helpful user guidance

### 5. Status Tags Bar Integration

- Updates dynamically based on filtered results
- Shows accurate counts for visible data
- Maintains visual consistency

## Styling

### Filter Panel

```css
- Background: bg-gray-50
- Border: border-gray-200
- Padding: p-4
- Rounded: rounded-lg
```

### Clear Filters Button

```css
- Background: bg-red-50
- Border: border-red-200
- Hover: hover:bg-red-100
- Text: text-red-700
```

### Filter Toggle (Active)

```css
- Background: bg-[#036b80]
- Text: text-white
```

## Performance Considerations

1. **useMemo**: All filtering logic uses `useMemo` to prevent unnecessary recalculations
2. **Debouncing**: Search input updates state immediately (can add debouncing if needed)
3. **Dynamic Options**: Filter options are calculated once and cached

## Future Enhancements

Potential improvements:

- Date range filters
- Multi-select filters
- Save filter presets
- Export filtered data
- Filter by owner/assigned user
- Advanced search operators
