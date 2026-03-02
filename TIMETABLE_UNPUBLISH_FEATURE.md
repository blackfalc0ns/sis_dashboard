# Timetable Unpublish Feature - Complete

## Summary
Successfully added unpublish functionality to the timetable, allowing users to revert a published timetable back to draft status.

## Changes Made

### 1. Timetable Service
**File**: `src/services/academics/timetableService.ts`

#### Added unpublishTimetable Function
```typescript
export async function unpublishTimetable(
  termId: string,
  sectionId: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update all entries for this section to DRAFT
  mockTimetableEntries.forEach((entry) => {
    if (entry.termId === termId && entry.sectionId === sectionId) {
      entry.status = "DRAFT";
    }
  });
}
```

### 2. TimetableView Component
**File**: `src/components/features/academics/components/timetable/TimetableView.tsx`

#### Import unpublishTimetable
```typescript
import {
  fetchTimetable,
  fetchAllTimetablesForTerm,
  upsertTimetableEntries,
  publishTimetable,
  unpublishTimetable,
  detectConflicts,
} from "@/services/academics/timetableService";
```

#### Added Published State
```typescript
const [isPublished, setIsPublished] = useState(false);
```

#### Updated loadTimetable to Check Status
```typescript
const loadTimetable = async () => {
  if (!selectedSectionId) return;

  try {
    const entries = await fetchTimetable(termId, selectedSectionId);
    setTimetableEntries(entries);
    setIsDirty(false);
    
    // Check if timetable is published
    const published = entries.length > 0 && entries.every((e) => e.status === "PUBLISHED");
    setIsPublished(published);
    
    // Calculate validation
    calculateValidation(entries);
  } catch (error) {
    console.error("Failed to load timetable:", error);
    showToast("Failed to load timetable", "error");
  }
};
```

#### Updated confirmPublish to Set State
```typescript
const confirmPublish = async () => {
  if (!selectedSectionId) return;

  try {
    await publishTimetable(termId, selectedSectionId);
    setIsPublished(true);
    showToast(t("publish.success"), "success");
    await loadTimetable();
  } catch (error) {
    console.error("Failed to publish timetable:", error);
    showToast(t("publish.error"), "error");
  } finally {
    setPublishConfirmOpen(false);
  }
};
```

#### Added handleUnpublish Function
```typescript
const handleUnpublish = async () => {
  if (!selectedSectionId) return;

  try {
    await unpublishTimetable(termId, selectedSectionId);
    setIsPublished(false);
    showToast(t("unpublish.success"), "success");
    await loadTimetable();
  } catch (error) {
    console.error("Failed to unpublish timetable:", error);
    showToast(t("unpublish.error"), "error");
  }
};
```

#### Updated Action Bar with Conditional Button
```typescript
{!isPublished ? (
  <Button
    onClick={handlePublish}
    disabled={isReadOnly}
    variant="secondary"
  >
    {t("actions.publish")}
  </Button>
) : (
  <Button
    onClick={handleUnpublish}
    disabled={isReadOnly}
    variant="secondary"
  >
    {t("actions.unpublish")}
  </Button>
)}
```

### 3. English Translations
**File**: `src/messages/en.json`

#### Added to actions section
```json
"actions": {
  "unpublish": "Unpublish"
}
```

#### Added unpublish section
```json
"unpublish": {
  "success": "Timetable unpublished successfully",
  "error": "Failed to unpublish timetable"
}
```

### 4. Arabic Translations
**File**: `src/messages/ar.json`

#### Added to actions section
```json
"actions": {
  "unpublish": "إلغاء النشر"
}
```

#### Added unpublish section
```json
"unpublish": {
  "success": "تم إلغاء نشر الجدول بنجاح",
  "error": "فشل إلغاء نشر الجدول"
}
```

## Features

### Publish/Unpublish Toggle
- Button dynamically changes based on timetable status
- Shows "Publish" when timetable is in draft
- Shows "Unpublish" when timetable is published
- Both buttons respect read-only mode

### Status Tracking
- `isPublished` state tracks current status
- Automatically detected when loading timetable
- Updated when publishing or unpublishing
- Checks if all entries have "PUBLISHED" status

### User Feedback
- Success toast: "Timetable unpublished successfully" / "تم إلغاء نشر الجدول بنجاح"
- Error toast: "Failed to unpublish timetable" / "فشل إلغاء نشر الجدول"
- Immediate UI update after action

## User Flow

### Publishing Flow
1. User edits timetable (status: DRAFT)
2. User clicks "Publish" button
3. Confirmation dialog appears
4. User confirms
5. Timetable status changes to PUBLISHED
6. Button changes to "Unpublish"
7. Success toast appears

### Unpublishing Flow
1. Timetable is published (status: PUBLISHED)
2. User clicks "Unpublish" button
3. Timetable status changes to DRAFT
4. Button changes to "Publish"
5. Success toast appears
6. Timetable can be edited again

## Technical Details

### Status Detection
```typescript
const published = entries.length > 0 && entries.every((e) => e.status === "PUBLISHED");
```
- Checks if all entries have PUBLISHED status
- Empty timetables are considered unpublished
- Partial publishing not supported (all or nothing)

### API Calls
- `publishTimetable(termId, sectionId)` - Sets all entries to PUBLISHED
- `unpublishTimetable(termId, sectionId)` - Sets all entries to DRAFT
- Both functions update status for entire section

### State Management
- `isPublished` - Boolean tracking current status
- Updated on load, publish, and unpublish
- Used to conditionally render button

## Benefits

1. **Flexibility** - Teachers can unpublish to make corrections
2. **Control** - Prevents accidental edits to published timetables
3. **Workflow** - Clear draft/published lifecycle
4. **Visibility** - Students/teachers only see published timetables
5. **Reversible** - Easy to revert if needed

## Build Status
✅ Build passes successfully
✅ No TypeScript errors
✅ No linting warnings
✅ All diagnostics clean

## Testing Checklist
- [ ] Publish button shows when timetable is draft
- [ ] Unpublish button shows when timetable is published
- [ ] Clicking Publish changes status to published
- [ ] Clicking Unpublish changes status to draft
- [ ] Success toast appears after publish
- [ ] Success toast appears after unpublish
- [ ] Error toast appears on failure
- [ ] Button respects read-only mode
- [ ] Status persists after page reload
- [ ] Arabic translations display correctly
- [ ] English translations display correctly

## Files Modified
1. `src/services/academics/timetableService.ts` - Added unpublishTimetable function
2. `src/components/features/academics/components/timetable/TimetableView.tsx` - Added unpublish logic and UI
3. `src/messages/en.json` - Added English translations
4. `src/messages/ar.json` - Added Arabic translations

## Next Steps
The unpublish feature is complete and ready for use. Users can now:
1. Publish timetables to make them visible
2. Unpublish timetables to make corrections
3. Toggle between published and draft states
4. See clear status indicators
