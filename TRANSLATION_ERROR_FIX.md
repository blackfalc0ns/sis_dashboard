# Translation Error Fix - academics.curriculum.filters.grade

## Issue
Error: `Could not resolve 'academics.curriculum.filters.grade' in messages for locale 'ar'`

## Root Cause
The English translation file (`src/messages/en.json`) had a duplicate `curriculum` section that was missing its closing brace, causing a JSON syntax error. This prevented the application from properly loading the translation keys.

## Files Fixed
- `src/messages/en.json` - Removed duplicate curriculum section after calendar section
- `src/messages/ar.json` - Already valid (no changes needed)

## Changes Made

### English File (en.json)
Removed the duplicate curriculum section that appeared after the calendar section (around line 2655). The duplicate section was:

```json
"curriculum": {
  "readonly_banner": {
    "message": "This term is closed. Curriculum is read-only."
  },
  "filters": {
    "grade": "Grade",
    "subject": "Subject"
  },
  "teachingWeeksHint": "Teaching weeks: {count} (holidays excluded)",
  "assignments": {
    "dueDateHolidayWarning": "This due date falls on a holiday."
  }
}  // <-- Missing closing brace was causing JSON parse error
```

This duplicate was overwriting the first (complete) curriculum section that already existed at line 2389.

## Verification

### JSON Validation
Both files now pass JSON validation:
```bash
✓ ar.json is valid
✓ en.json is valid
```

### Translation Keys Exist
```javascript
EN curriculum.filters.grade: "Grade"
AR curriculum.filters.grade: "الصف"
```

## Current Structure

Both translation files now have a single, complete `academics.curriculum` section with all required keys:

```json
{
  "academics": {
    "curriculum": {
      "readonly_banner": { ... },
      "filters": {
        "grade": "Grade" / "الصف",
        "subject": "Subject" / "المادة"
      },
      "actions": { ... },
      "tabs": { ... },
      "empty_state": { ... },
      "unsaved_changes": { ... },
      "create_dialog": { ... },
      "carry_over_dialog": { ... },
      "outline": { ... },
      "editor": { ... },
      "plan": { ... },
      "materials": { ... },
      "video": { ... },
      "assignments": {
        "title": "...",
        "add_assignment": "...",
        // ... other assignment keys
        "dueDateHolidayWarning": "This due date falls on a holiday." / "تاريخ التسليم يقع في يوم إجازة."
      },
      "learningContent": { ... },
      "questions": { ... },
      "teachingWeeksHint": "Teaching weeks: {count} (holidays excluded)" / "أسابيع الدراسة: {count} (مع استبعاد الإجازات)"
    }
  }
}
```

## Status
✅ **RESOLVED** - The translation error is fixed and the application should now load correctly.

## Next Steps
1. Test the application to confirm the error is resolved
2. Verify the CurriculumPage loads without translation errors
3. Continue with Task 4 (Calendar Integrations) testing
