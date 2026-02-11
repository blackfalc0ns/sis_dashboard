# Applications Page KPI Enhancement

## Overview

Updated the Applications page KPIs to provide more actionable insights for admissions staff, replacing the previous 4 KPIs with 6 new metrics focused on operational needs.

## Changes Made

### 1. Updated KPI Calculations

**File**: `src/components/admissions/ApplicationsList.tsx`

Replaced the previous KPI calculations with 6 new metrics:

#### New KPIs:

1. **New Applications**
   - Shows total applications this week
   - Displays both today's count and week's count in the subtitle
   - Includes sparkline trend visualization
   - Week starts on Sunday

2. **Pending Review**
   - Counts applications with status: `submitted` or `documents_pending`
   - Shows "Awaiting action" subtitle
   - Amber color indicator

3. **Missing Documents**
   - Counts applications that have at least one document with status `missing`
   - Shows "Applications incomplete" subtitle
   - Red color indicator for urgency

4. **Approved**
   - Counts applications with status: `accepted`
   - Shows "Accepted applications" subtitle
   - Includes sparkline trend
   - Green color indicator

5. **Rejected**
   - Counts applications with status: `rejected`
   - Shows "Declined applications" subtitle
   - Gray color indicator

6. **Avg Processing Time**
   - Calculates average time from submission to decision
   - Uses `decision.decisionDate` when available
   - Display logic:
     - Shows hours if < 48 hours (e.g., "36h")
     - Shows days with 1 decimal if ≥ 48 hours (e.g., "7.5 days")
   - Shows "N/A" if no decided applications exist
   - Purple color indicator

### 2. Updated Grid Layout

- Changed from 4-column to 3-column grid on large screens
- Responsive: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- All KPIs use the existing `KPICard` component for consistency

### 3. Date Calculations

- Week starts on Sunday (consistent with dashboard)
- Today's date calculated with time set to 00:00:00 for accurate comparison
- Processing time calculated in hours, then converted to appropriate display format

## Technical Details

### KPI Calculation Logic

```typescript
const kpis = useMemo(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Week start (Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  // ... calculations
}, []);
```

### Document Status Check

```typescript
const missingDocuments = mockApplications.filter((app) =>
  app.documents.some((doc) => doc.status === "missing"),
).length;
```

### Processing Time Calculation

```typescript
const avgHours = totalProcessingTime / decidedApps.length;

if (avgHours < 48) {
  avgProcessingDisplay = `${Math.round(avgHours)}h`;
} else {
  const days = avgHours / 24;
  avgProcessingDisplay = `${days.toFixed(1)} days`;
}
```

## Visual Design

- Maintained existing theme colors (#036b80 teal)
- Used Montserrat font (existing)
- Consistent spacing and shadows with dashboard
- Icon colors match KPI purpose:
  - Blue: New Applications
  - Amber: Pending Review
  - Red: Missing Documents
  - Green: Approved
  - Gray: Rejected
  - Purple: Processing Time

## Integration

- No breaking changes to existing functionality
- All filters, search, and table features remain unchanged
- KPIs update in real-time based on filtered data
- Uses `useMemo` for performance optimization

## Files Modified

- `src/components/admissions/ApplicationsList.tsx`

## Dependencies

- Existing `KPICard` component from dashboard
- Lucide React icons
- Mock data from `@/data/mockAdmissions`
- Types from `@/types/admissions`

## Testing Recommendations

1. Verify "Today" count updates correctly with current date
2. Test "This Week" calculation across week boundaries (Saturday/Sunday)
3. Confirm missing documents count matches applications with incomplete docs
4. Validate processing time displays correctly in hours vs days
5. Check responsive layout on mobile, tablet, and desktop
6. Ensure sparklines render correctly for trending KPIs

## Future Enhancements

- Add click-through functionality to filter table by KPI
- Add date range selector for custom time periods
- Add export functionality for KPI data
- Add historical comparison (vs last week/month)
