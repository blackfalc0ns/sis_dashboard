# Export Functionality - Quick Reference

## Summary

Export functionality has been successfully added to Academics matrices using the **existing** export system found in `src/utils/exportUtils.ts`.

## What Was Found

### Existing Export Utilities
- **Location**: `src/utils/exportUtils.ts`
- **Functions**: `exportToCSV()`, `exportToExcel()`, `exportToJSON()`, `exportToPDF()`
- **Features**: UTF-8 BOM for Arabic, special character escaping, no dependencies

## What Was Created

### 1. Export Adapter (`src/utils/academics/exportAdapter.ts`)
- Minimal bridge between Academics data and existing export utilities
- ~70 lines of code
- No new export logic, just data transformation

### 2. Export Button (`src/components/ui/button/ExportButton.tsx`)
- Reusable component with CSV/Excel dropdown
- ~80 lines of code
- Consistent with existing UI patterns

## What Was Modified

### Tab 2: Subjects Allocation Matrix
**File**: `src/components/features/academics/components/subjects/AllocationMatrix.tsx`

**Added**:
- Import statements (3 lines)
- `handleExport` function (~35 lines)
- `<ExportButton />` in toolbar (4 lines)

**Exports**:
- Columns: Grade + all subjects
- Rows: Weekly hours per grade/subject
- Respects stage filter and "show only missing"

### Tab 7: Teacher Allocation Matrix
**File**: `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx`

**Added**:
- Import statements (3 lines)
- `handleExport` function (~45 lines)
- `<ExportButton />` in toolbar (4 lines)

**Exports**:
- Columns: Section, Grade + all subjects
- Rows: Teacher names per section/subject
- Respects all filters (grade, section, subject, show-only-missing)

### Translation Files
**Added to `src/messages/en.json` and `src/messages/ar.json`**:
- `academics.subjects.matrix.actions.export`
- `academics.subjects.matrix.columns.grade`
- `academics.teacherAllocation.actions.export`
- `academics.teacherAllocation.matrix.columns.*`

## How It Works

```typescript
// 1. User clicks Export button
<ExportButton onExport={handleExport} />

// 2. Handler prepares data
const handleExport = (format: "csv" | "excel") => {
  const columns = [/* localized headers */];
  const rows = [/* transformed data */];
  const filename = generateExportFilename("prefix", termId);
  
  // 3. Adapter calls existing utility
  exportAcademicsData({ filename, format, columns, rows });
};

// 4. Existing utility handles download
exportToExcel(transformedData, filename); // or exportToCSV
```

## Key Benefits

✅ **No New Dependencies** - Uses existing export utilities  
✅ **Minimal Code** - Only ~150 lines of new code total  
✅ **Localization** - Arabic/English headers, UTF-8 BOM for Excel  
✅ **Filter Respect** - Exports only visible/filtered data  
✅ **Reusable** - Easy to add to other Academics tables  
✅ **Consistent UX** - Matches existing UI patterns  

## Adding Export to New Tables

```typescript
// 1. Import
import ExportButton from "@/components/ui/button/ExportButton";
import { exportAcademicsData, generateExportFilename, ExportColumn } from "@/utils/academics/exportAdapter";

// 2. Create handler
const handleExport = (format: "csv" | "excel") => {
  const columns: ExportColumn[] = [
    { key: "field", label: t("label") }
  ];
  const rows = data.map(item => ({ field: item.value }));
  const filename = generateExportFilename("name", termId);
  exportAcademicsData({ filename, format, columns, rows });
};

// 3. Add button
<ExportButton onExport={handleExport} disabled={!data.length} />

// 4. Add translations
// en.json: "export": "Export"
// ar.json: "export": "تصدير"
```

## Files Modified

| File | Lines Added | Purpose |
|------|-------------|---------|
| `src/utils/academics/exportAdapter.ts` | 70 | New adapter |
| `src/components/ui/button/ExportButton.tsx` | 80 | New component |
| `src/components/features/academics/components/subjects/AllocationMatrix.tsx` | 42 | Add export to Tab 2 |
| `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx` | 52 | Add export to Tab 7 |
| `src/messages/en.json` | 8 | English translations |
| `src/messages/ar.json` | 8 | Arabic translations |
| **Total** | **260 lines** | **Complete solution** |

## Testing

1. Navigate to Academics → Subjects & Allocation (Tab 2)
2. Click Export button → Select Excel or CSV
3. Verify file downloads with correct data
4. Switch to Arabic locale and repeat
5. Navigate to Academics → Teacher Allocation (Tab 7)
6. Repeat export tests with different filters

## Notes

- Export button appears in toolbar next to Save/Reset buttons
- Button disabled when no data to export
- Filename format: `{feature}-{termId}-{filterId}-{date}.csv`
- Arabic text exports correctly with UTF-8 BOM for Excel compatibility
- No toast system found, using simple `alert()` for errors
