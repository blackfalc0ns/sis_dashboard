# CR-006: DataTable Regex Security Fix - Complete

## Issue Summary
**Title**: DataTable highlight uses unescaped regex (crash + UI security footgun)  
**Severity**: High  
**Area**: Security / Performance / UI

## Problem
The `HighlightText` component in DataTable was building regex patterns directly from user input without escaping special characters, causing:
- Client-side crashes when searching for regex special characters like `(`, `[`, `\`
- Performance issues from global regex state
- Potential DoS-style attacks through malicious search queries

## Root Cause
```typescript
// BEFORE - Unsafe
const regex = new RegExp(`(${highlight})`, "gi");
const parts = text.split(regex);
// ...
regex.test(part) // Global flag causes stateful issues
```

The code was:
1. Creating regex directly from user input without escaping
2. Using global flag `g` with `.test()` which maintains state between calls
3. No validation or sanitization of search input

## Solution Implemented

### Changes Made
**File**: `src/components/ui/data-table/DataTable.tsx`

1. **Added regex escaping function**:
   ```typescript
   const escapeRegExp = (str: string): string =>
     str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
   ```

2. **Escaped user input before creating regex**:
   ```typescript
   const safeHighlight = escapeRegExp(highlight);
   const regex = new RegExp(`(${safeHighlight})`, "gi");
   ```

3. **Created separate non-global regex for testing**:
   ```typescript
   const testRegex = new RegExp(safeHighlight, "i");
   // Use testRegex.test(part) instead of regex.test(part)
   ```

### Complete Fixed Implementation
```typescript
function HighlightText({ text, highlight }: HighlightTextProps) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  // Escape special regex characters to prevent crashes and security issues
  const escapeRegExp = (str: string): string =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const safeHighlight = escapeRegExp(highlight);
  const regex = new RegExp(`(${safeHighlight})`, "gi");
  const parts = text.split(regex);

  // Create a non-global regex for testing (avoids stateful .test() issues)
  const testRegex = new RegExp(safeHighlight, "i");

  return (
    <span>
      {parts.map((part, index) =>
        testRegex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}
```

## Security Improvements

### Before (Vulnerable)
- ❌ Searching for `(test)` would crash: `SyntaxError: Invalid regular expression`
- ❌ Searching for `[abc]` would crash or behave unexpectedly
- ❌ Searching for `\` would crash
- ❌ Global regex state could cause inconsistent highlighting
- ❌ Potential for ReDoS (Regular Expression Denial of Service) attacks

### After (Secure)
- ✅ All special characters are properly escaped
- ✅ Searches for `(test)` work correctly, treating `(` and `)` as literal characters
- ✅ No crashes from special characters
- ✅ Non-global regex for testing eliminates state issues
- ✅ Consistent highlighting behavior
- ✅ Protected against regex-based attacks

## Testing Scenarios

The fix handles these previously problematic searches:
1. `(test)` - Parentheses
2. `[abc]` - Square brackets
3. `test*` - Asterisk
4. `test+` - Plus sign
5. `test?` - Question mark
6. `test.` - Period
7. `test$` - Dollar sign
8. `test^` - Caret
9. `test|other` - Pipe
10. `test\` - Backslash
11. `{test}` - Curly braces

All now work as literal string searches without crashes.

## Performance Impact
- ✅ Eliminated global regex state issues
- ✅ Faster and more predictable highlighting
- ✅ No performance degradation from malicious patterns

## Validation
- ✅ TypeScript compilation passes
- ✅ No linting errors
- ✅ Maintains existing functionality
- ✅ Backward compatible with all existing uses

## Related Files
- `src/components/ui/data-table/DataTable.tsx` - Fixed component

## Impact Assessment
- **Security**: High - Prevents client-side crashes and potential DoS
- **UX**: High - Users can now search for any text including special characters
- **Performance**: Medium - Eliminates regex state issues
- **Compatibility**: None - Fully backward compatible

## Recommendations
Consider applying similar escaping to any other components that build regex from user input.

---
**Status**: ✅ Complete  
**Build**: ✅ Passing  
**Diagnostics**: ✅ No errors
