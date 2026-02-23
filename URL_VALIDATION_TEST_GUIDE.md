# URL Validation - Testing Guide

## Quick Test Checklist

### 1. Lesson Video - Link Mode
**Location**: Academics → Curriculum → Select a lesson → Learning Content tab → Video tab

**Test Cases**:
- [ ] Type `https://youtube.com/watch?v=test` → Should accept ✅
- [ ] Type `https://` → Click Save → Should show "URL is incomplete (missing website address)" ❌
- [ ] Type `javascript:alert(1)` → Click Save → Should show "URL must start with http:// or https://" ❌
- [ ] Type `://httpsgoogle.com` → Blur field → Should auto-fix to `https://google.com` 🔧
- [ ] Type `https//example.com` → Blur field → Should auto-fix to `https://example.com` 🔧
- [ ] Type `example.com` → Click Save → Should show "URL must start with http:// or https://" ❌

### 2. Lesson Materials - Add Link
**Location**: Academics → Curriculum → Select a lesson → Learning Content tab → Materials tab → Add Link

**Test Cases**:
- [ ] Title: "Test", URL: `https://docs.google.com` → Should accept ✅
- [ ] Title: "Test", URL: `http://` → Click Add → Should show "URL is incomplete (missing website address)" ❌
- [ ] Title: "Test", URL: `data:text/html,<script>` → Click Add → Should show "URL must start with http:// or https://" ❌
- [ ] Title: "Test", URL: `://httpsexample.com` → Blur → Should auto-fix to `https://example.com` 🔧
- [ ] Empty URL → Click Add → Should show "URL is required" ❌

### 3. Assignment Attachments - Add Link
**Location**: Academics → Curriculum → Select a lesson → Learning Content tab → Assignments tab → Expand assignment → Add Link

**Test Cases**:
- [ ] Title: "Resource", URL: `https://github.com/repo` → Should accept ✅
- [ ] Title: "Resource", URL: `https://` → Click Save → Should show "URL is incomplete (missing website address)" ❌
- [ ] Title: "Resource", URL: `file:///etc/passwd` → Click Save → Should show "URL must start with http:// or https://" ❌
- [ ] Title: "Resource", URL: `http//test.com` → Blur → Should auto-fix to `http://test.com` 🔧

## Expected Behavior

### ✅ Valid URLs (Should Accept)
```
https://example.com
http://example.com/path
https://subdomain.example.com
https://example.com:8080/path?query=value
http://localhost:3000 (in development)
```

### ❌ Invalid URLs (Should Reject)

| Input | Error Message |
|-------|--------------|
| `https://` | URL is incomplete (missing website address) |
| `http://` | URL is incomplete (missing website address) |
| `javascript:alert(1)` | URL must start with http:// or https:// |
| `data:text/html,<script>` | URL must start with http:// or https:// |
| `file:///path` | URL must start with http:// or https:// |
| `example.com` | URL must start with http:// or https:// |
| `ftp://example.com` | URL must start with http:// or https:// |
| (empty) | URL is required |

### 🔧 Auto-Fixed on Blur

| Type | After Blur |
|------|-----------|
| `://httpsgoogle.com` | `https://google.com` |
| `://httpexample.com` | `http://example.com` |
| `https//example.com` | `https://example.com` |
| `http//example.com` | `http://example.com` |

## Security Verification

### Link Opening Security
After adding a valid link, click "Open" button:
- [ ] Link opens in new tab
- [ ] Browser shows no referrer information (check Network tab)
- [ ] Original page remains secure (no window.opener access)

### Protocol Security
Try these malicious URLs (should all be rejected):
- [ ] `javascript:alert(document.cookie)`
- [ ] `data:text/html,<script>alert(1)</script>`
- [ ] `vbscript:msgbox("test")`
- [ ] `about:blank`
- [ ] `blob:https://example.com/test`

## Bilingual Testing (Arabic)

Switch to Arabic language and verify:
- [ ] Error messages appear in Arabic
- [ ] Placeholder shows: `مثال: https://example.com`
- [ ] RTL layout works correctly
- [ ] All validation rules work the same

## Edge Cases

- [ ] Very long URL (>2048 chars) → Should show "URL is too long"
- [ ] URL with spaces → Spaces removed on blur
- [ ] URL with multiple protocols → Should reject
- [ ] URL with only protocol → Should show "incomplete"
- [ ] Localhost in production → Should reject (if not in dev mode)

## Regression Testing

Ensure existing functionality still works:
- [ ] Can upload video files (not just links)
- [ ] Can upload material files (not just links)
- [ ] Can delete videos/materials/assignments
- [ ] Can edit existing assignments
- [ ] Video preview works for YouTube/Vimeo links
- [ ] File attachments still work

## Performance Check

- [ ] No lag when typing in URL field
- [ ] Blur normalization is instant
- [ ] Validation errors appear immediately on submit
- [ ] No console errors or warnings

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Notes for QA

1. The auto-fix only happens on **blur** (when you click outside the field)
2. Validation happens on **submit** (when you click Save/Add)
3. The most common test case: `https://` should show "URL is incomplete"
4. All `window.open()` calls now include security parameters
5. Placeholders changed from "https://..." to "https://example.com"
