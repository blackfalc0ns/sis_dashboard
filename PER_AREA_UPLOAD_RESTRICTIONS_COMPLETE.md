# Per-Area Upload Restrictions - Complete ✅

## Summary
Successfully implemented per-area upload restrictions with different rules for Materials, Assignments, and Video uploads. Each area now has specific file type whitelists, size limits, and validation rules.

## Upload Rules by Area

### A) MATERIALS (مواد الدرس)
**Allowed File Types:**
- Documents: PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx), Text (.txt)
- Images: PNG, JPG, JPEG

**Max Size:** 20 MB

**MIME Types:**
- application/pdf
- application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation
- application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- text/plain
- image/png, image/jpeg

### B) ASSIGNMENTS (مرفقات الواجب)
**Same as MATERIALS** - Documents + Images

**Max Size:** 20 MB

### C) VIDEO (رفع فيديو)
**Allowed File Types:**
- Video: MP4, WebM, MOV, M4V

**Max Size:** 200 MB

**MIME Types:**
- video/mp4
- video/webm
- video/quicktime

**Special:** `multiple=false` (only one video at a time)

## Security Blocks (All Areas)

**Explicitly Blocked Extensions:**
- Executables: .exe, .bat, .cmd, .msi, .jar, .apk, .dmg, .sh, .com, .scr
- Scripts: .js, .vbs, .ps1
- Archives: .zip, .rar, .7z, .tar, .gz

These are blocked for security reasons to prevent malware uploads.

## Implementation Details

### 1. Centralized Validation (`src/utils/upload/validateFile.ts`)

**Updated Interface:**
```typescript
export interface UploadRules {
  maxSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  blockedExtensions: string[];
  acceptString: string; // for HTML input accept attribute
  acceptLabelKey: string; // i18n key for display label
}
```

**Key Functions:**
- `getUploadRules(area)` - Returns rules object with all validation data
- `validateFileForArea(file, area)` - Validates file against area-specific rules
- `formatFileSize(bytes)` - Formats bytes to human-readable size
- `getAllowedTypesKey(area)` - Returns i18n key for allowed types label

**Validation Logic:**
1. Check if extension is in blocked list → reject with "blocked" reason
2. Check if file size exceeds max → reject with "size" reason
3. Check if extension OR mime type is in allowed list → accept
4. Otherwise → reject with "type" reason

### 2. Translation Keys Added

**English (`src/messages/en.json`):**
```json
"upload": {
  "allowedTypesMaterials": "PDF, Word, PowerPoint, Excel, Text, Images",
  "allowedTypesAssignments": "PDF, Word, PowerPoint, Excel, Text, Images",
  "allowedTypesVideo": "Video files (MP4, WebM, MOV)"
}
```

**Arabic (`src/messages/ar.json`):**
```json
"upload": {
  "allowedTypesMaterials": "PDF وWord وPowerPoint وExcel ونصوص وصور",
  "allowedTypesAssignments": "PDF وWord وPowerPoint وExcel ونصوص وصور",
  "allowedTypesVideo": "ملفات فيديو (MP4, WebM, MOV)"
}
```

### 3. Component Updates

**LessonMaterials.tsx:**
```typescript
const UPLOAD_AREA = "MATERIALS" as const;
const uploadRules = getUploadRules(UPLOAD_AREA);
const allowedTypesKey = getAllowedTypesKey(UPLOAD_AREA);

// In DragDropUploadArea:
uploadArea={UPLOAD_AREA}
helperText={tUpload("allowedHint", {
  types: tUpload(allowedTypesKey),
  size: formatFileSize(uploadRules.maxSizeBytes),
})}
```

**LessonAssignments.tsx:**
```typescript
const UPLOAD_AREA = "ASSIGNMENTS" as const;
// Same pattern as Materials
```

**LessonVideo.tsx:**
```typescript
const UPLOAD_AREA = "VIDEO" as const;
const uploadRules = getUploadRules(UPLOAD_AREA);
const allowedTypesKey = getAllowedTypesKey(UPLOAD_AREA);

// In DragDropUploadArea:
uploadArea={UPLOAD_AREA}
multiple={false} // Only one video at a time
helperText={tUpload("allowedHint", {
  types: tUpload(allowedTypesKey),
  size: formatFileSize(uploadRules.maxSizeBytes),
})}
```

### 4. UI Display

**Helper Text Format:**
- English: "Allowed: PDF, Word, PowerPoint, Excel, Text, Images • Max: 20 MB"
- Arabic: "المسموح: PDF وWord وPowerPoint وExcel ونصوص وصور • الحد الأقصى: 20 MB"

**Error Messages:**
- Invalid type: "Unsupported file type for educational content." / "نوع الملف غير مدعوم للمحتوى التعليمي."
- Blocked type: "This file type is blocked for security reasons." / "تم حظر نوع الملف لأسباب أمنية."
- Size exceeded: "File exceeds max size (20 MB)." / "حجم الملف يتجاوز الحد الأقصى (20 MB)."

## Test Cases

### ✅ Materials Upload Tests
- [x] Upload PDF → Accepted
- [x] Upload Word (.docx) → Accepted
- [x] Upload PowerPoint (.pptx) → Accepted
- [x] Upload Excel (.xlsx) → Accepted
- [x] Upload PNG image → Accepted
- [x] Upload JPG image → Accepted
- [x] Upload MP4 video → Rejected (type)
- [x] Upload ZIP file → Rejected (blocked)
- [x] Upload EXE file → Rejected (blocked)
- [x] Upload 25MB file → Rejected (size)

### ✅ Assignments Upload Tests
- [x] Same as Materials (identical rules)

### ✅ Video Upload Tests
- [x] Upload MP4 → Accepted
- [x] Upload WebM → Accepted
- [x] Upload MOV → Accepted
- [x] Upload PDF → Rejected (type)
- [x] Upload ZIP → Rejected (blocked)
- [x] Upload 250MB video → Rejected (size)
- [x] Multiple files → Only first file accepted (multiple=false)

### ✅ Security Tests
- [x] .exe blocked in all areas
- [x] .bat blocked in all areas
- [x] .js blocked in all areas
- [x] .zip blocked in all areas
- [x] .rar blocked in all areas

### ✅ UI/UX Tests
- [x] Helper text shows allowed types + max size
- [x] Error messages are localized (AR/EN)
- [x] RTL layout works correctly
- [x] Term closed disables uploads
- [x] Validation happens before upload API call

## Files Modified

1. `src/utils/upload/validateFile.ts` - Updated with per-area rules
2. `src/messages/en.json` - Added new translation keys
3. `src/messages/ar.json` - Added new translation keys
4. `src/components/features/academics/components/curriculum/LessonVideo.tsx` - Added VIDEO area restrictions
5. `src/components/features/academics/components/curriculum/LessonMaterials.tsx` - Already using MATERIALS area
6. `src/components/features/academics/components/curriculum/LessonAssignments.tsx` - Already using ASSIGNMENTS area

## Key Features

✅ **Per-area restrictions** - Different rules for Materials, Assignments, and Video
✅ **Centralized validation** - Single source of truth in validateFile.ts
✅ **Security-first** - Blocks executables, scripts, and archives
✅ **Whitelist approach** - Only explicitly allowed types can be uploaded
✅ **Size limits** - 20MB for documents, 200MB for videos
✅ **i18n support** - Full Arabic/English translations
✅ **RTL compatible** - Works correctly in both directions
✅ **User-friendly errors** - Clear, localized error messages
✅ **Pre-upload validation** - Blocks invalid files before API call
✅ **No new dependencies** - Uses existing infrastructure

## Benefits

1. **Security:** Prevents malicious file uploads with explicit blocking
2. **User Experience:** Clear feedback on what's allowed before upload
3. **Performance:** Validation happens client-side, no wasted API calls
4. **Maintainability:** Single source of truth for all upload rules
5. **Flexibility:** Easy to add new areas or modify rules per area
6. **Compliance:** Enforces educational content standards

## Status: COMPLETE ✅

All three upload areas now have proper per-area restrictions with security blocking, size limits, and user-friendly validation messages in both Arabic and English.
