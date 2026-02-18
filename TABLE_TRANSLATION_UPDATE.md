# Table Translation Update

## Overview

Fully translated the Transfers & Withdrawals table to support both English and Arabic languages with proper RTL support.

## Changes Made

### 1. Student Names

- Added Arabic names for all mock students
- Implemented `getStudentName()` function that displays:
  - Arabic name when locale is "ar"
  - English name when locale is "en"

**Mock Data Updated:**

```typescript
{
  studentName: "Ahmed Hassan",
  studentNameAr: "أحمد حسن",
  // ...
}
```

### 2. Grade Labels

- Implemented `getGradeLabel()` function
- Converts "Grade X" format to Arabic: "الصف X"
- Maintains English format for English locale

**Examples:**

- English: "Grade 5"
- Arabic: "الصف 5"

### 3. Educational Stages

- Implemented `getStageLabel()` function
- Translates stage names using i18n keys

**Translations Added:**

```json
"stages": {
  "primary": "Primary" / "الابتدائية",
  "preparatory": "Preparatory" / "الإعدادية",
  "secondary": "Secondary" / "الثانوية"
}
```

### 4. Status Values

- Implemented `getStatusLabel()` function
- Translates status chips

**Translations Added:**

```json
"status": {
  "pending": "Pending" / "قيد المراجعة",
  "approved": "Approved" / "موافق عليه",
  "rejected": "Rejected" / "مرفوض"
}
```

### 5. Withdrawal/Transfer Reasons

- Implemented `getReasonLabel()` function
- Translates all reason types

**Translations Added:**

```json
"reasons": {
  "relocation": "Relocation" / "الانتقال",
  "financial": "Financial" / "مالي",
  "academic": "Academic" / "أكاديمي",
  "behavior": "Behavior" / "سلوكي",
  "transfer_in": "Transfer In" / "تحويل وارد",
  "other": "Other" / "أخرى"
}
```

## Implementation Details

### Functions Added

1. **getStudentName(row)** - Returns appropriate name based on locale
2. **getGradeLabel(grade)** - Formats grade with proper translation
3. **getStageLabel(stage)** - Translates educational stage
4. **getStatusLabel(status)** - Translates request status
5. **getReasonLabel(reason)** - Translates withdrawal/transfer reason

### Locale Hook

- Added `useLocale()` hook from next-intl
- Used to determine current language
- Drives conditional rendering logic

### Column Rendering

Updated columns to use render functions:

```typescript
{
  key: "studentName",
  render: (_: unknown, row: { [key: string]: unknown }) => (
    <span className="font-medium">{getStudentName(row)}</span>
  ),
}
```

## Mock Data Structure

Each request now includes:

```typescript
{
  id: string;
  studentName: string; // English name
  studentNameAr: string; // Arabic name
  stage: string; // "Primary" | "Preparatory" | "Secondary"
  grade: string; // "Grade X"
  behaviorAvg: number;
  attendancePercent: number;
  reason: string; // Withdrawal/transfer reason
  status: string; // "Pending" | "Approved" | "Rejected"
  requestDate: string;
  type: string; // "Transfer" | "Withdrawal"
}
```

## Translation Files Updated

### English (src/messages/en.json)

- Added `table.status` section
- Added `table.reasons` section
- Added `table.stages` section

### Arabic (src/messages/ar.json)

- Added `table.status` section with Arabic translations
- Added `table.reasons` section with Arabic translations
- Added `table.stages` section with Arabic translations

## Features

✅ Bilingual student names
✅ Translated grade labels
✅ Translated educational stages
✅ Translated status values with color coding
✅ Translated withdrawal/transfer reasons
✅ RTL support for Arabic
✅ Maintains all existing functionality (search, sort, pagination)
✅ Color coding preserved for status and behavior scores

## Testing

- [x] English locale displays English names and labels
- [x] Arabic locale displays Arabic names and labels
- [x] Grade format correct in both languages
- [x] All status chips show translated text
- [x] All reasons show translated text
- [x] Search works with both English and Arabic names
- [x] Color coding works correctly
- [x] RTL layout works properly in Arabic

## API Integration Notes

When integrating with real API, ensure the response includes:

- Both English and Arabic student names
- Standardized stage values ("Primary", "Preparatory", "Secondary")
- Standardized status values ("Pending", "Approved", "Rejected")
- Standardized reason values matching the translation keys
