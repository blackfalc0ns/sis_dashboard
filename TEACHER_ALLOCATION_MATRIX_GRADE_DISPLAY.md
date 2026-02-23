# Teacher Allocation Matrix - Grade Display Enhancement

## Overview
Updated the Teacher Allocation Matrix view to display the grade name alongside each section name for better context and clarity.

## Changes Made

### 1. AllocationMatrixView Component
**File**: `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx`

#### Added Helper Functions
```typescript
const getGradeName = (section: Section) => {
  const grade = grades.find((g) => g.id === section.gradeId);
  if (!grade) return "-";
  return locale === "ar"
    ? (grade.nameAr || grade.nameEn || grade.name)
    : (grade.nameEn || grade.nameAr || grade.name);
};

const getSectionDisplayName = (section: Section) => {
  const gradeName = getGradeName(section);
  const sectionName = getSectionName(section);
  return { gradeName, sectionName };
};
```

#### Updated Section Cell Rendering
Changed from single-line display to two-line display:
- **Primary line**: Section name (bold, larger text)
- **Secondary line**: Grade name (muted, smaller text)

```typescript
<td className={`sticky ${isRTL ? "right-0" : "left-0"} z-10 px-4 py-3 border-r border-gray-200 ${isEvenRow ? "bg-white" : "bg-gray-50"}`}>
  <div className="flex flex-col gap-0.5">
    <span className="text-sm font-semibold text-gray-900">
      {getSectionDisplayName(section).sectionName}
    </span>
    <span className="text-xs text-gray-500">
      {getSectionDisplayName(section).gradeName}
    </span>
  </div>
</td>
```

## Display Format

### Arabic (RTL)
```
شعبة أ
الصف الخامس
```

### English (LTR)
```
Section A
Grade 5
```

## Features

1. **Bilingual Support**: Automatically displays names in the correct language based on locale
2. **Fallback Handling**: Shows "-" if grade information is missing
3. **RTL/LTR Compatible**: Works correctly in both Arabic and English layouts
4. **Sticky Column**: Section column remains pinned during horizontal scrolling
5. **Visual Hierarchy**: 
   - Section name: Bold, 14px (text-sm)
   - Grade name: Muted gray, 12px (text-xs)

## Benefits

1. **Better Context**: Users can immediately see which grade each section belongs to
2. **Reduced Confusion**: No need to remember or look up grade associations
3. **Improved Scanning**: Easier to visually scan and identify sections
4. **Maintains Existing Behavior**: All filtering, sorting, and allocation features work unchanged

## Technical Details

- **No New Dependencies**: Uses existing utility functions and components
- **No Translation Keys Added**: Uses existing typography and styling
- **Performance**: Minimal impact - grade lookup is O(1) with array find
- **Type Safety**: Fully typed with TypeScript
- **Build Status**: ✅ Passes all TypeScript checks

## Testing Checklist

- [x] Build compiles successfully
- [x] TypeScript type checking passes
- [x] Grade name displays correctly for each section
- [x] Fallback "-" shows when grade is missing
- [x] Works in both Arabic (RTL) and English (LTR)
- [x] Sticky column behavior maintained
- [x] Filtering and sorting still work correctly
- [x] Teacher allocation functionality unchanged

## Files Modified

1. `src/components/features/academics/components/teacher-allocation/AllocationMatrixView.tsx`
   - Added `getGradeName()` helper function
   - Added `getSectionDisplayName()` helper function  
   - Updated section cell rendering to show two-line display

## Implementation Approach

Chose **Option A** (single column with two lines) over Option B (separate columns) because:
- Cleaner UI with fewer columns
- Better use of horizontal space
- Maintains visual focus on the section name
- Grade provides context without cluttering the interface
