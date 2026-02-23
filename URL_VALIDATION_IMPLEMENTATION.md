# URL Validation Implementation - Complete

## Overview
Implemented strict, reusable URL validation that replaces the previous permissive validation. The new system rejects incomplete URLs, unsafe protocols, and enforces HTTP(S) with valid hostnames.

## Files Changed

### 1. New Utility: `src/utils/validation/url.ts`
Created comprehensive URL validation utility with:
- `normalizeUrl()`: Fixes common typos (://https, https//, etc.)
- `validateHttpUrl()`: Strict validation with detailed error reasons
- `getHostname()`: Safe hostname extraction
- `getUrlErrorKey()`: Maps validation reasons to i18n keys

**Key Features:**
- Rejects incomplete URLs like "https://" → `urlIncomplete` error
- Rejects unsafe protocols (javascript:, data:, file:, etc.)
- Requires http:// or https:// with valid hostname
- Hostname must have at least one dot OR be localhost (dev only)
- Max length 2048 characters
- Auto-fixes typos on blur: "://https" → "https://", "https//" → "https://"
- Optional domain allowlist support

### 2. Updated Components

#### `src/components/features/academics/components/curriculum/LessonVideo.tsx`
- Added URL validation imports
- Updated `validate()` to use `validateHttpUrl()`
- Added `onBlur` handler to normalize URL and fix typos
- Updated `handleSave()` to use normalized URL
- Added security: `window.open()` now uses "noopener,noreferrer"
- Changed placeholder from "https://..." to "https://example.com"

#### `src/components/features/academics/components/curriculum/LessonMaterials.tsx`
- Added URL validation imports and `tValidation` hook
- Updated `validateLinkForm()` to use `validateHttpUrl()`
- Added `onBlur` handler to normalize URL
- Updated `handleAddLink()` to use normalized URL
- Changed placeholder to "https://example.com"

#### `src/components/features/academics/components/curriculum/LessonAssignments.tsx`
- Added URL validation imports and `tValidation` hook
- Updated `handleSaveLink()` to use `validateHttpUrl()`
- Added `onBlur` handler to normalize URL
- Updated to use normalized URL when saving
- Added security: `window.open()` now uses "noopener,noreferrer"
- Changed placeholder to "https://example.com"

### 3. Translations Added

#### `src/messages/en.json`
```json
"validation": {
  "urlRequired": "URL is required",
  "urlInvalid": "Enter a valid URL",
  "urlProtocol": "URL must start with http:// or https://",
  "urlIncomplete": "URL is incomplete (missing website address)",
  "urlTooLong": "URL is too long",
  "urlBlocked": "This domain is not allowed"
},
"helper": {
  "urlExample": "Example: https://example.com"
}
```

#### `src/messages/ar.json`
```json
"validation": {
  "urlRequired": "الرابط مطلوب",
  "urlInvalid": "أدخل رابطًا صحيحًا",
  "urlProtocol": "يجب أن يبدأ الرابط بـ http:// أو https://",
  "urlIncomplete": "الرابط غير مكتمل (مفقود عنوان الموقع)",
  "urlTooLong": "الرابط طويل جدًا",
  "urlBlocked": "هذا النطاق غير مسموح"
},
"helper": {
  "urlExample": "مثال: https://example.com"
}
```

## Validation Rules

### Accepted URLs
✅ `https://example.com`
✅ `http://example.com/path`
✅ `https://subdomain.example.com`
✅ `http://localhost:3000` (dev only)

### Rejected URLs
❌ `https://` → "URL is incomplete (missing website address)"
❌ `http://` → "URL is incomplete (missing website address)"
❌ `javascript:alert(1)` → "URL must start with http:// or https://"
❌ `data:text/html,<script>` → "URL must start with http:// or https://"
❌ `example.com` → "URL must start with http:// or https://"
❌ `ftp://example.com` → "URL must start with http:// or https://"

### Auto-Fixed on Blur
🔧 `://httpsgoogle.com` → `https://google.com`
🔧 `https//example.com` → `https://example.com`
🔧 `http//example.com` → `http://example.com`

## Security Enhancements

1. **Protocol Enforcement**: Only http:// and https:// allowed
2. **Unsafe Protocol Blocking**: Rejects javascript:, data:, file:, vbscript:, about:, blob:
3. **Safe Link Opening**: All `window.open()` calls now use `"noopener,noreferrer"`
4. **Control Character Rejection**: Blocks URLs with control characters
5. **Length Limit**: Maximum 2048 characters

## User Experience

1. **Real-time Validation**: Errors show immediately on submit
2. **Auto-fix on Blur**: Common typos fixed automatically when user leaves field
3. **Clear Error Messages**: Specific messages for each validation failure
4. **Bilingual Support**: All messages in English and Arabic
5. **Consistent Placeholders**: "https://example.com" across all URL fields

## Testing Guide

### Test Cases

1. **Valid URLs** (should accept):
   ```
   https://example.com
   http://example.com/path?query=value
   https://subdomain.example.com:8080/path
   ```

2. **Incomplete URLs** (should reject with "URL is incomplete"):
   ```
   https://
   http://
   ```

3. **Unsafe Protocols** (should reject with "URL must start with http://"):
   ```
   javascript:alert(1)
   data:text/html,<script>alert(1)</script>
   file:///etc/passwd
   ```

4. **Auto-fix on Blur** (should fix automatically):
   - Type: `://httpsgoogle.com` → Blur → Shows: `https://google.com`
   - Type: `https//example.com` → Blur → Shows: `https://example.com`

5. **Missing Protocol** (should reject):
   ```
   example.com
   www.example.com
   ```

### Where to Test

1. **Lesson Video** → Select a lesson → Learning Content tab → Video tab → Link mode
2. **Lesson Materials** → Select a lesson → Learning Content tab → Materials tab → Add Link
3. **Assignment Attachments** → Select a lesson → Learning Content tab → Assignments tab → Expand assignment → Add Link

## Implementation Notes

- No new dependencies added
- TypeScript strict mode compatible
- RTL-safe (works in Arabic)
- Follows existing repo patterns
- Reusable across entire codebase
- Optional domain allowlist support (not configured by default)

## Future Enhancements

If needed, domain allowlist can be configured by:
1. Adding allowed domains to a config file
2. Passing `allowedDomains` option to `validateHttpUrl()`
3. Users will see "This domain is not allowed" error for blocked domains
