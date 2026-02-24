# Academics Export - Enhanced with Title & Metadata

This document describes the enhanced export functionality for Academics matrices and tables, now including formatted title sections and metadata.

## Overview

The export system uses existing utilities (`exportUtils.ts`) with minimal adapters to convert Academics data into CSV/Excel formats. The enhanced version adds:
- Title row (large/bold in concept, merged cell in CSV)
- Subtitle/metadata row (year, term, grade, section, export date)
- Blank spacer row
- Table headers and data

## Enhanced Export Structure

### Excel/CSV File Layout

```
Row 1: [Title]                                    (merged across all columns)
Row 2: [Year • Term • Grade • Section • Date]    (merged across all columns)
Row 3: [blank]
Row 4: [Column Headers]
Row 5+: [Data rows]
```

### Example Output

**English:**
```
Subjects Allocation
Year: 2026/2027 • Term: Term 1 • Grade: Grade 5 • Exported: 2026-02-24

Grade,Mathematics,Science,English
Grade 5,5,4,6
Grade 6,5,4,6
```

**Arabic:**
```
توزيع المواد
العام: 2026/2027 • الترم: الأول • الصف: الخامس • تاريخ التصدير: 2026-02-24

الصف,الرياضيات,العلوم,الإنجليزية
الصف الخامس,5,4,6
الصف السادس,5,4,6
```

## Architecture

### Core Files

1. **src/utils/exportUtils.ts** - Base export utilities (enhanced)
   - `exportToExcelWithTitle()` - Excel export with title/metadata support
   - `exportToCSVWithTitle()` - CSV export with title/metadata support
   - `exportToExcel()` - Legacy function (still available)
   - `exportToCSV()` - Legacy function (still available)

2. **src/utils/academics/exportAdapter.ts** - Academics-specific adapter
   - `exportAcademicsData()` - Main export function with title/metadata
   - `ExportMetadata` interface - Metadata structure
   - `buildSubtitle()` - Builds localized subtitle from metadata
   - `formatExportDate()` - Formats date based on locale

3. **src/components/ui/button/ExportButton.tsx** - Reusable export button
   - Dropdown with CSV/Excel options
   - Localized labels
   - Disabled state support

## Usage

### In Matrix/Table Components

```typescript
import { 
  exportAcademicsData, 
  generateExportFilename, 
  ExportColumn, 
  ExportMetadata,
  formatExportDate 
} from "@/utils/academics/exportAdapter";

const handleExport = (format: "csv" | "excel") => {
  // 1. Prepare title (localized)
  const title = t("title"); // e.g., "Subjects Allocation" or "توزيع المواد"

  // 2. Prepare metadata
  const metadata: ExportMetadata = {
    yearName: "2026/2027",
    termName: "Term 1",
    gradeName: "Grade 5",      // optional
    sectionName: "Section A",  // optional
    exportDate: formatExportDate(locale),
  };

  // 3. Prepare columns
  const columns: ExportColumn[] = [
    { key: "grade", label: t("columns.grade") },
    { key: "subject1", label: "Mathematics" },
    // ... more columns
  ];

  // 4. Prepare rows
  const rows = data.map(item => ({
    grade: item.gradeName,
    subject1: item.hours,
    // ... more fields
  }));

  // 5. Generate filename
  const filename = generateExportFilename(
    "subjects-allocation",
    termId,
    gradeId
  );

  // 6. Export with title and metadata
  exportAcademicsData({ 
    title, 
    metadata, 
    filename, 
    format, 
    columns, 
    rows, 
    locale 
  });
};
```

### ExportMetadata Interface

```typescript
export interface ExportMetadata {
  yearName?: string;      // Academic year name
  termName?: string;      // Term name
  gradeName?: string;     // Grade name (if filtered)
  sectionName?: string;   // Section name (if filtered)
  exportDate?: string;    // Export date (formatted)
}
```

All fields are optional. The subtitle builder will only include fields that are provided.

## Implementation Details

### Tab 2: Subjects Allocation Matrix

**File:** `src/components/features/academics/components/subjects/AllocationMatrix.tsx`

**Props Added:**
- `yearName?: string` - Academic year name
- `termName?: string` - Term name

**Export Includes:**
- Title: "Subjects Allocation" / "توزيع المواد"
- Metadata: Year, Term, Grade (if stage filter selected), Export Date
- Columns: Grade + all subjects
- Rows: Weekly hours per grade/subject

### Tab 7: Teacher Allocation Matrix

**File:** `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx`

**Props Added:**
- `yearName?: string` - Academic year name
- `termName?: string` - Term name

**Export Includes:**
- Title: "Teacher Allocation" / "توزيع المعلمين"
- Metadata: Year, Term, Grade, Section (if filters selected), Export Date
- Columns: Section, Grade + all subjects
- Rows: Teacher names per section/subject

## Localization

### Metadata Labels

The subtitle builder automatically uses localized labels:
- EN: "Year", "Term", "Grade", "Section", "Exported"
- AR: "العام", "الترم", "الصف", "الشعبة", "تاريخ التصدير"

## Features

### Title & Metadata
- Title row merged across all columns
- Subtitle with contextual metadata (year, term, filters, date)
- Localized labels and separators
- Only includes metadata fields that are provided

### Localization
- All headers and data localized based on current locale
- Arabic text exports correctly with UTF-8 BOM for Excel
- Date formatting respects locale (ar-EG / en-US)
- RTL-aware separator (• bullet)

### Filtering
- Export respects current page filters
- Stage/Grade filter reflected in metadata
- Section filter reflected in metadata
- "Show only missing" toggle affects exported data

## Files Modified

### Enhanced Files
1. `src/utils/exportUtils.ts` - Added `exportToExcelWithTitle()` and `exportToCSVWithTitle()`
2. `src/utils/academics/exportAdapter.ts` - Enhanced with metadata support
3. `src/components/features/academics/components/subjects/AllocationMatrix.tsx` - Added title/metadata to export
4. `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx` - Added title/metadata to export
5. `src/components/features/academics/components/pages/SubjectsAllocationPage.tsx` - Pass year/term names
6. `src/components/features/academics/components/pages/TeacherAllocationPage.tsx` - Pass year/term names

## Summary

The enhanced export system adds professional title sections and contextual metadata to all Academics exports while maintaining:
- Zero new dependencies
- Backward compatibility with existing exports
- Full localization support (AR/EN)
- Minimal code changes (~200 lines total)
- Reusable patterns for future tables

Exported files now include clear context (year, term, filters, date) making them more useful for reporting and archival purposes.
