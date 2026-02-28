# Assignment Builder - Phase 1 Complete ✅

## Overview
Phase 1 establishes the foundation for the Google Forms-style assignment builder by creating routes and updating navigation from the Lesson Editor.

## What Was Implemented

### 1. Route Structure Created
**New Assignment Route**:
- Path: `/academics/curriculum/lessons/[lessonId]/assignments/new`
- File: `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/new/page.tsx`
- Behavior: Renders AssignmentBuilderPage with lessonId

**Edit Assignment Route**:
- Path: `/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]`
- File: `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]/page.tsx`
- Behavior: Renders AssignmentBuilderPage with lessonId and assignmentId

### 2. Assignment Builder Page (Skeleton)
**File**: `src/components/features/academics/components/pages/AssignmentBuilderPage.tsx`

**Features Implemented**:
- Sticky header with back button, title, status chips, and actions
- Auto-create draft on `/new` route, then redirect to edit route
- Load existing assignment data on edit route
- Dirty state management integration
- Read-only mode support (termStatus === "closed")
- Save, Publish/Unpublish, Delete actions
- Navigation guard integration

**Header Components**:
- Left: Back button → navigates to curriculum page with context
- Center: Assignment title + status chips (Draft/Published, Read-only)
- Right: Save button, Publish/Unpublish button, More menu (Delete)

**Status**:
- ✅ Header complete
- ⏳ Main content area (placeholder for 3-column layout)

### 3. LessonAssignments Component Updated
**File**: `src/components/features/academics/components/curriculum/LessonAssignments.tsx`

**Changes Made**:
- Removed embedded AssignmentDialog
- Removed embedded AssignmentQuestionsBuilder
- Removed attachment management (moved to builder page)
- Simplified to list view only
- "Add Assignment" button navigates to `/lessons/[lessonId]/assignments/new`
- Assignment cards navigate to `/lessons/[lessonId]/assignments/[assignmentId]` on click
- Cards show: title, description, due date, max score, published status
- Hover effect on cards (border → primary, shadow)
- Preserved read-only mode

**Removed Features** (moved to builder page):
- Assignment create/edit dialog
- Questions builder
- Attachments upload/management
- Expand/collapse functionality

**New Features**:
- Click-to-navigate on entire card
- Cleaner, simpler list view
- Uses GuardedRouter for navigation protection

### 4. Translation Keys Added
**English** (`src/messages/en.json`):
```json
"assignmentBuilder": {
  "backToLesson": "Back to Lesson",
  "questions": "Questions",
  "settings": "Settings",
  "attachments": "Attachments",
  "addQuestion": "Add Question",
  "addFirstQuestion": "Add your first question",
  "unsaved": "Unsaved changes",
  "readOnly": "Read-only",
  "publish": "Publish",
  "unpublish": "Unpublish",
  "published": "Published",
  "draft": "Draft",
  "confirmDelete": "Are you sure you want to delete this assignment?",
  "notFound": "Assignment not found",
  "questionsOutline": "Questions Outline",
  "noQuestionsYet": "No questions yet. Add your first question to get started.",
  "assignmentDetails": "Assignment Details",
  "pointsSummary": "Points Summary"
}
```

**Arabic** (`src/messages/ar.json`):
```json
"assignmentBuilder": {
  "backToLesson": "العودة إلى الدرس",
  "questions": "الأسئلة",
  "settings": "الإعدادات",
  "attachments": "المرفقات",
  "addQuestion": "إضافة سؤال",
  "addFirstQuestion": "إضافة أول سؤال",
  "unsaved": "تغييرات غير محفوظة",
  "readOnly": "للعرض فقط",
  "publish": "نشر",
  "unpublish": "إلغاء النشر",
  "published": "منشور",
  "draft": "مسودة",
  "confirmDelete": "هل أنت متأكد من حذف هذا الواجب؟",
  "notFound": "الواجب غير موجود",
  "questionsOutline": "قائمة الأسئلة",
  "noQuestionsYet": "لا توجد أسئلة بعد. أضف أول سؤال للبدء.",
  "assignmentDetails": "تفاصيل الواجب",
  "pointsSummary": "ملخص الدرجات"
}
```

## User Flow

### Creating a New Assignment
1. User is in Lesson Editor (Curriculum page)
2. Clicks "Add Assignment" button
3. Navigates to `/lessons/[lessonId]/assignments/new?termId=...&yearId=...`
4. Page creates draft assignment immediately
5. Redirects to `/lessons/[lessonId]/assignments/[assignmentId]?...`
6. Shows builder page with empty state

### Editing an Existing Assignment
1. User is in Lesson Editor (Curriculum page)
2. Clicks on an assignment card
3. Navigates to `/lessons/[lessonId]/assignments/[assignmentId]?termId=...&yearId=...`
4. Page loads assignment data
5. Shows builder page with data

### Navigating Back
1. User clicks "Back to Lesson" button in header
2. GuardedRouter checks for unsaved changes
3. If dirty: shows confirmation dialog
4. If confirmed or not dirty: navigates to curriculum page with same context

## Technical Details

### Dirty State Management
```typescript
const { markDirty, clearDirty } = useDirtyKey(
  `assignment-builder:${assignmentId || "new"}:${lessonId}`
);
```

- Integrated with global unsaved changes system
- Unique key per assignment
- Will be marked dirty when editing (Phase 2+)
- Cleared on save/delete

### Context Preservation
- URL params (termId, yearId, termStatus) preserved across navigation
- Passed via query string
- Read from searchParams in builder page
- Used for read-only mode detection

### Read-Only Mode
- Detected via `termStatus === "closed"` from URL params
- Shows "Read-only" chip in header
- Disables all edit/add/delete/publish actions
- Hides action buttons

## Files Modified

1. `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/new/page.tsx` - NEW
2. `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]/page.tsx` - NEW
3. `src/components/features/academics/components/pages/AssignmentBuilderPage.tsx` - NEW
4. `src/components/features/academics/components/curriculum/LessonAssignments.tsx` - UPDATED
5. `src/messages/en.json` - UPDATED
6. `src/messages/ar.json` - UPDATED

## Testing Checklist

### Navigation
- [ ] Click "Add Assignment" in Lesson Editor → navigates to `/new` route
- [ ] Click assignment card → navigates to `/[assignmentId]` route
- [ ] Click "Back to Lesson" → returns to curriculum page
- [ ] URL params preserved across navigation

### New Assignment Flow
- [ ] Navigate to `/new` route
- [ ] Draft assignment created automatically
- [ ] Redirected to edit route with new assignment ID
- [ ] Header shows "Draft" chip
- [ ] Title shows "New Assignment" / "واجب جديد"

### Edit Assignment Flow
- [ ] Navigate to existing assignment
- [ ] Assignment data loaded
- [ ] Header shows correct title
- [ ] Status chip shows Published/Draft correctly

### Header Actions
- [ ] Save button works (placeholder)
- [ ] Publish/Unpublish button toggles state
- [ ] Delete button shows confirmation and deletes
- [ ] Back button navigates correctly

### Read-Only Mode
- [ ] When termStatus=closed, "Read-only" chip appears
- [ ] All action buttons hidden/disabled
- [ ] Can view but not edit

### Dirty State
- [ ] Navigation guard not triggered yet (no edits implemented)
- [ ] Will be tested in Phase 2+

## Next Steps: Phase 2

Phase 2 will implement the 3-column layout structure:
- Left sidebar: Questions outline (list of questions)
- Center: Question editor (inline, not drawer)
- Right panel: Settings + Attachments

Components to create:
1. QuestionsOutline
2. QuestionEditorInline
3. AssignmentSettingsPanel
4. AssignmentAttachmentsPanel

## Notes

- No business logic changes
- All existing APIs reused
- Backward compatible with existing data
- Foundation ready for full builder implementation
- Mobile layout will be implemented in Phase 2
