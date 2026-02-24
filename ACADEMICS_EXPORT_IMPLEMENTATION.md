# Academics Export Implementation Summary

## Overview
Successfully added export functionality to Academics matrices/tables by reusing the existing export system in the codebase.

## Existing Export System Discovered

### Location
- **Export Utilities**: `src/utils/exportUtils.ts`
- **Export Modal**: `src/components/features/dashboard/components/ExportModal.tsx`

### Key Functions
- `exportToCSV(data, filename)` - Export to CSV format
- `exportToExcel(data, filename)` - Export to Excel-compatible CSV with UTF-8 BOM
- `exportToJSON(data, filename)` - Export to JSON format
- `exportToPDF()` - Print to PDF using browser print dialog

### Features
- Handles Arabic text correctly with UTF-8 BOM for Excel
- Escapes special characters (commas, quotes)
- Creates downloadable blob files
- No external dependencies required

## New Files Created

### 1. Export Adapter (`src/utils/academics/exportAdapter.ts`)
Minimal adapter that bridges Academics data structures with existing export utilities.

**Key Functions:**
- `exportAcademicsData(options)` - Main export function
  - Transforms rows to use localized column labels
  - Calls existing `exportToCSV` or `exportToExcel`
- `generateExportFilename(prefix, termId, gradeId)` - Creates locale-safe filenames with timestamps

**Interface:**
```typescript
interface ExportOptions {
  filename: string;
  format: "csv" | "excel";
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}
```

### 2. Export Button Component (`src/components/ui/button/ExportButton.tsx`)
Reusable export button with format selection dropdown.

**Features:**
- Dropdown menu for CSV/Excel selection
- Disabled state support
- Customizable label
- Consistent with existing UI patterns

**Usage:**
```typescript
<ExportButton
  onExport={(format) => handleExport(format)}
  disabled={data.length === 0}
  label={t("actions.export")}
/>
```

## Modified Files

### 1. Subjects Allocation Matrix (`src/components/features/academics/components/subjects/AllocationMatrix.tsx`)

**Changes:**
- Added imports for `ExportButton` and export adapter
- Added `handleExport` function that:
  - Prepares columns with localized headers
  - Maps grades and subjects to rows
  - Respects current filters (stage, show-only-missing)
  - Generates filename with termId and optional gradeId
- Added Export button to toolbar (before Reset/Save buttons)
- Button disabled when no data to export

**Export Data Structure:**
- Columns: Grade + all subjects (localized names)
- Rows: One per grade with weekly hours for each subject
- Empty cells shown as blank strings

### 2. Teacher Allocation Matrix (`src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx`)

**Changes:**
- Added imports for `ExportButton` and export adapter
- Added `handleExport` function that:
  - Prepares columns: Section, Grade + all subjects
  - Maps sections to rows with assigned teacher names
  - Respects current filters (grade, section, subject, show-only-missing)
  - Generates filename with termId and optional gradeId
- Added Export button to toolbar (before Reset/Save buttons)
- Button disabled when no data to export

**Export Data Structure:**
- Columns: Section, Grade + all subjects (localized names)
- Rows: One per section with teacher names for each subject
- Empty cells shown as blank strings

### 3. Translation Files

**English (`src/messages/en.json`):**
- Added `academics.subjects.matrix.actions.export`: "Export"
- Added `academics.subjects.matrix.columns.grade`: "Grade"
- Added `academics.teacherAllocation.actions.export`: "Export"
- Added `academics.teacherAllocation.matrix.columns.section`: "Section"
- Added `academics.teacherAllocation.matrix.columns.grade`: "Grade"

**Arabic (`src/messages/ar.json`):**
- Added `academics.subjects.matrix.actions.export`: "تصدير"
- Added `academics.subjects.matrix.columns.grade`: "الصف"
- Added `academics.teacherAllocation.actions.export`: "تصدير"
- Added `academics.teacherAllocation.matrix.columns.section`: "الشعبة"
- Added `academics.teacherAllocation.matrix.columns.grade`: "الصف"

## How to Add Export to Future Academics Tables

### Step 1: Import Required Components
```typescript
import ExportButton from "@/components/ui/button/ExportButton";
import { exportAcademicsData, generateExportFilename, ExportColumn } from "@/utils/academics/exportAdapter";
```

### Step 2: Create Export Handler
```typescript
const handleExport = (format: "csv" | "excel") => {
  // 1. Define columns with localized labels
  const columns: ExportColumn[] = [
    { key: "columnKey", label: t("translation.key") },
    // ... more columns
  ];

  // 2. Prepare rows from your data
  const rows = yourData.map((item) => ({
    columnKey: item.value,
    // ... more fields
  }));

  // 3. Generate filename
  const filename = generateExportFilename(
    "your-feature-name",
    termId,
    optionalFilterId
  );

  // 4. Export
  exportAcademicsData({ filename, format, columns, rows });
};
```

### Step 3: Add Export Button to Toolbar
```typescript
<ExportButton
  onExport={handleExport}
  disabled={data.length === 0}
  label={t("actions.export")}
/>
```

### Step 4: Add Translation Keys
Add to both `en.json` and `ar.json`:
```json
{
  "yourFeature": {
    "actions": {
      "export": "Export" // or "تصدير" in Arabic
    },
    "columns": {
      "columnName": "Column Label"
    }
  }
}
```

## Features

### ✅ Localization Support
- Headers use current locale (AR/EN)
- Arabic text exports correctly with UTF-8 BOM
- RTL-safe implementation

### ✅ Filter Respect
- Exports only visible/filtered data
- Respects stage/grade/section filters
- Respects "show only missing" toggles

### ✅ User Experience
- Format selection (CSV/Excel) via dropdown
- Disabled state when no data
- Filename includes timestamp and context (termId, gradeId)
- Success/failure handled by existing alert system

### ✅ No New Dependencies
- Uses existing `exportToCSV` and `exportToExcel` functions
- No new npm packages required
- Minimal code duplication

## Testing Checklist

- [ ] Export Subjects Allocation Matrix (Tab 2)
  - [ ] Export with all stages
  - [ ] Export with specific stage filter
  - [ ] Export with "show only missing" enabled
  - [ ] Verify Arabic headers in Excel
  - [ ] Verify English headers in Excel
  
- [ ] Export Teacher Allocation Matrix (Tab 7)
  - [ ] Export with all grades/sections
  - [ ] Export with specific grade filter
  - [ ] Export with specific section filter
  - [ ] Export with "show only missing" enabled
  - [ ] Verify teacher names appear correctly
  - [ ] Verify Arabic/English localization

- [ ] General
  - [ ] Button disabled when no data
  - [ ] Filename includes termId
  - [ ] Filename includes timestamp
  - [ ] CSV format works
  - [ ] Excel format works
  - [ ] Arabic text displays correctly in Excel

## Future Enhancements (Optional)

1. **Add to More Tables**: Apply same pattern to:
   - Academic Structure tree export
   - Curriculum outline export
   - Calendar events export

2. **Enhanced Formats**: If needed, add:
   - PDF export using existing `exportToPDF()`
   - JSON export using existing `exportToJSON()`

3. **Bulk Export**: Add option to export multiple matrices at once

4. **Custom Columns**: Allow users to select which columns to export

## Notes

- The existing export system already handles Arabic correctly with UTF-8 BOM
- No toast/notification system found, using simple `alert()` for errors
- Export respects read-only mode (button still enabled, exports current state)
- Filenames are locale-safe (no Arabic characters in filename, only in content)
