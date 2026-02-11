# Admissions Sub-Tabs Export Implementation

## Overview

Added export functionality to all admissions sub-tab pages, allowing users to export filtered data directly from each page as CSV files with full Arabic text support.

## Implementation

### New Utility File

**`src/utils/simpleExport.ts`**

- Client-side export utility for quick CSV/JSON downloads
- Includes UTF-8 BOM for Excel Arabic support
- Functions:
  - `downloadCSV()` - Export data as CSV file
  - `downloadJSON()` - Export data as JSON file
  - `generateFilename()` - Create timestamped filenames

### Export Functions Added

**`src/utils/admissionsExportUtils.ts`** (extended)

- `formatTestsForExport()` - Format test data with scores and percentages
- `formatInterviewsForExport()` - Format interview data with ratings

### Pages Updated

All admissions sub-tab pages now have export functionality:

1. **Leads** (`/admissions/leads`)
   - Exports: Guardian/Parent Name, Phone, Email, Grade Interest, Channel, Source, Status, Owner, Created At, Notes
   - Respects: Search, status, channel, owner filters, and date range

2. **Applications** (`/admissions/applications`)
   - Exports: Application ID, Student Name (English & Arabic), DOB, Gender, Nationality, Grade, Guardian info, Status, Documents, Tests, Interviews
   - Respects: Search, status, grade filters, and date range

3. **Tests** (`/admissions/tests`)
   - Exports: Test ID, Application ID, Student Name, Grade, Type, Subject, Date, Time, Location, Proctor, Status, Score, Max Score, Percentage, Notes
   - Respects: Search, status, type filters, and date range

4. **Interviews** (`/admissions/interviews`)
   - Exports: Interview ID, Application ID, Student Name, Grade, Date, Time, Interviewer, Location, Status, Rating, Notes
   - Respects: Search, status filters, and date range

5. **Decisions** (`/admissions/decisions`)
   - Exports: Application ID, Student Name, Grade, Decision, Reason, Decision Date, Decided By
   - Respects: Search, decision type filters, and date range

6. **Enrollments** (`/admissions/enrollment`)
   - Exports: Enrollment ID, Application ID, Student Name, Grade, Section, Academic Year, Start Date, Enrolled Date, Guardian info
   - Respects: Search, grade, academic year filters, and date range

## Features

### Export Button Placement

- Located in the header section of each page
- Positioned before the primary action button (New Lead, New Application, etc.)
- Consistent styling across all pages
- White background with gray border for secondary action appearance

### Data Filtering

- Exports only the filtered/visible data
- Respects all active filters:
  - Search queries
  - Status/type filters
  - Date range selections
  - Custom filters (grade, channel, owner, etc.)

### File Naming

- Format: `{type}-{date}.csv`
- Examples:
  - `leads-2026-02-11.csv`
  - `applications-2026-02-11.csv`
  - `tests-2026-02-11.csv`
  - `interviews-2026-02-11.csv`
  - `decisions-2026-02-11.csv`
  - `enrollments-2026-02-11.csv`

### Arabic Support

- UTF-8 BOM added to all CSV files
- Arabic names and text display correctly in Excel
- No manual encoding selection needed
- Works on Windows, Mac, and web versions of Excel

## User Experience

### How to Export

1. Navigate to any admissions sub-tab
2. Apply desired filters (optional):
   - Use search to find specific records
   - Select status/type filters
   - Choose date range
3. Click the "Export" button in the header
4. CSV file downloads automatically with filtered data

### Export Behavior

- **Empty Results**: Shows alert "No data to export"
- **Filtered Data**: Only exports visible/filtered records
- **All Data**: If no filters applied, exports all records
- **Instant Download**: No loading modal, direct download
- **Client-Side**: Fast processing, no server calls needed

## Technical Details

### Architecture

**Client-Side Export:**

- Data formatted in browser
- No API calls required
- Fast and responsive
- Works offline

**Data Flow:**

1. User clicks Export button
2. Component calls `handleExport()`
3. Filtered data passed to format function
4. CSV generated with UTF-8 BOM
5. Browser downloads file

### Code Pattern

Each component follows this pattern:

```typescript
// Import utilities
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { formatXXXForExport } from "@/utils/admissionsExportUtils";

// Add export handler
const handleExport = () => {
  const formattedData = formatXXXForExport(filteredData);
  const filename = generateFilename("xxx", "csv");
  downloadCSV(formattedData, filename);
};

// Add export button
<button
  onClick={handleExport}
  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
>
  <Download className="w-4 h-4" />
  Export
</button>
```

## Files Created

1. `src/utils/simpleExport.ts` - Client-side export utilities

## Files Modified

1. `src/utils/admissionsExportUtils.ts` - Added test and interview formatters
2. `src/components/leads/LeadsList.tsx` - Added export button and handler
3. `src/components/admissions/ApplicationsList.tsx` - Added export button and handler
4. `src/components/admissions/TestsList.tsx` - Added export button and handler
5. `src/components/admissions/InterviewsList.tsx` - Added export button and handler
6. `src/components/admissions/DecisionsList.tsx` - Added export button and handler
7. `src/components/admissions/EnrollmentList.tsx` - Added export button and handler

## Benefits

### For Users

- Quick access to data exports from any page
- No need to navigate to dashboard for exports
- Exports respect current filters and search
- Immediate downloads without waiting
- Arabic text works perfectly in Excel

### For Developers

- Reusable export utilities
- Consistent implementation across pages
- Easy to maintain and extend
- No server-side complexity
- Type-safe with TypeScript

## Future Enhancements

### Potential Additions:

1. **JSON Export Option**: Add format selector (CSV/JSON)
2. **Column Selection**: Let users choose which columns to export
3. **Export History**: Track what was exported and when
4. **Scheduled Exports**: Automatic daily/weekly exports
5. **Email Delivery**: Send exports via email
6. **Excel Format**: Direct XLSX export with formatting
7. **Bulk Export**: Export multiple tabs at once

## Testing Checklist

- [x] Leads export with filters
- [x] Applications export with Arabic names
- [x] Tests export with scores
- [x] Interviews export with ratings
- [x] Decisions export
- [x] Enrollments export
- [x] Date range filtering works
- [x] Search filtering works
- [x] Status/type filtering works
- [x] Empty data handling
- [x] File naming correct
- [x] Arabic text in Excel
- [x] No TypeScript errors
- [x] Consistent button styling

## Summary

All admissions sub-tabs now have fully functional export capabilities. Users can export filtered data with a single click, and all exports include proper UTF-8 BOM for Excel Arabic support. The implementation is consistent, maintainable, and provides a great user experience.
