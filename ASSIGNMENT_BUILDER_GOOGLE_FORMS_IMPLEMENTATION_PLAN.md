# Assignment Builder - Google Forms Style Implementation Plan

## Overview
Transform the current embedded assignment editor into a dedicated Google Forms-style page with proper routing, similar to how Google Forms provides a focused editing experience.

## Current State (Phase 2 Complete)
- ✅ Assignments embedded in Lesson Editor
- ✅ QuestionDrawer for editing questions
- ✅ Enhanced question cards with previews
- ✅ Summary bar with auto-distribute
- ✅ Attachments with drag & drop

## Target State (Google Forms Style)
- Dedicated routes for assignment creation/editing
- Full-page builder with sticky header
- 3-column desktop layout (outline + editor + settings)
- Mobile tabs/drawers
- Global unsaved changes guard
- Navigate from Lesson Editor to builder page

## Routes to Implement

### 1. New Assignment Route
```
/academics/curriculum/lessons/[lessonId]/assignments/new
```
- **File**: `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/new/page.tsx`
- **Behavior**: Create draft assignment immediately, then redirect to edit route
- **Status**: ✅ Created (skeleton)

### 2. Edit Assignment Route
```
/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]
```
- **File**: `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]/page.tsx`
- **Behavior**: Load existing assignment and display builder
- **Status**: ✅ Created (skeleton)

## Page Layout Structure

### Sticky Top Header
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Lesson  │  Assignment Title  [Draft]  │  Actions  │
└─────────────────────────────────────────────────────────────┘
```

**Components**:
- Left: Back button (navigates to curriculum page with context)
- Center: Assignment title + status chips (Draft/Published, Read-only)
- Right: Save, Publish/Unpublish, More menu (Delete)

### Desktop 3-Column Layout
```
┌──────────┬────────────────────┬──────────┐
│          │                    │          │
│ Questions│   Question Editor  │ Settings │
│ Outline  │                    │    +     │
│          │                    │Attachments│
│          │                    │          │
└──────────┴────────────────────┴──────────┘
  280-320px      flex-1 (min 520px)  320-400px
```

#### Left Sidebar - Questions Outline
- Scrollable list of questions
- Each item shows:
  - Question number (Q1, Q2, ...)
  - Question type chip
  - Points
  - Validity badge (✅ configured / ⚠ needs attention)
- Click to select question
- "+ Add Question" button at bottom
- Reorder with Up/Down buttons (or DnD if already in repo)

#### Center - Question Editor
- Shows selected question editor inline (not drawer)
- If no question selected: Large empty state with "Add your first question" CTA
- Bilingual fields for question text
- Type selector
- Points input
- Answer configuration based on type
- Save button (or auto-save on blur)

#### Right Panel - Settings + Attachments
**Settings Card**:
- Assignment title (bilingual)
- Description (bilingual)
- Due date picker
- Max score (manual input)
- Points summary bar:
  - Sum of question points
  - Difference (max - sum)
  - Status badge (match/mismatch)
  - "Auto distribute points" button
- Publish validation: blocked if points mismatch

**Attachments Card**:
- Drag & drop upload area
- "Add link" button
- List of attachments with actions
- Reuse existing restrictions for ASSIGNMENTS area

### Mobile Layout
- Sticky header (same as desktop)
- Tabs: Questions | Settings | Attachments
- Questions outline opens in drawer (button "Questions")
- Question editor full-width
- Settings and Attachments in their respective tabs

## Data Flow

### New Assignment Flow (Option A - Recommended)
1. User clicks "Add Assignment" in Lesson Editor
2. Navigate to `/lessons/[lessonId]/assignments/new?termId=...&yearId=...`
3. Page immediately creates draft assignment via API
4. `router.replace` to `/lessons/[lessonId]/assignments/[assignmentId]?...`
5. Show builder with empty state

### Edit Assignment Flow
1. User clicks assignment in Lesson Editor
2. Navigate to `/lessons/[lessonId]/assignments/[assignmentId]?termId=...&yearId=...`
3. Load assignment data + questions + attachments
4. Show builder with data

### Save Flow
- Manual save button in header
- OR auto-save on blur (debounced)
- Update assignment fields
- Clear dirty state on success

### Publish Flow
- Validate: points must match (sum of questions = maxScore)
- If mismatch: show error, suggest auto-distribute
- Toggle `isPublished` flag
- Update UI

### Delete Flow
- Confirm dialog
- Delete assignment via API
- Clear dirty state
- Navigate back to curriculum page

## Dirty State Management

### Integration with Global Guard
```typescript
const { markDirty, clearDirty } = useDirtyKey(
  `assignment-builder:${assignmentId || "new"}:${lessonId}`
);
```

### Mark Dirty When:
- Editing assignment title/description/dueDate/maxScore
- Adding/editing/deleting questions
- Changing question order
- Editing question options/points
- Adding/deleting attachments (optional but recommended)

### Clear Dirty When:
- Successful save
- Successful publish/unpublish
- Navigating away after delete

### Navigation Guard
- Intercept browser back button
- Intercept GuardedLink clicks
- Show confirmation dialog if dirty
- Allow navigation if user confirms

## Components to Create/Update

### New Components
1. **AssignmentBuilderPage** (`src/components/features/academics/components/pages/AssignmentBuilderPage.tsx`)
   - Main page component
   - Manages state for assignment, questions, attachments
   - Handles routing and navigation
   - Integrates dirty state management
   - Status: ✅ Created (skeleton with header)

2. **QuestionsOutline** (`src/components/features/academics/components/curriculum/QuestionsOutline.tsx`)
   - Left sidebar component
   - Lists questions with metadata
   - Handles selection
   - Reorder functionality
   - Status: ⏳ To be created

3. **QuestionEditorInline** (`src/components/features/academics/components/curriculum/QuestionEditorInline.tsx`)
   - Center panel component
   - Inline question editor (not drawer)
   - Reuse logic from QuestionDrawer but render inline
   - Status: ⏳ To be created

4. **AssignmentSettingsPanel** (`src/components/features/academics/components/curriculum/AssignmentSettingsPanel.tsx`)
   - Right panel component
   - Assignment details form
   - Points summary
   - Auto-distribute button
   - Status: ⏳ To be created

5. **AssignmentAttachmentsPanel** (`src/components/features/academics/components/curriculum/AssignmentAttachmentsPanel.tsx`)
   - Right panel component (below settings)
   - Drag & drop upload
   - Add link
   - List attachments
   - Status: ⏳ To be created

### Components to Update
1. **LessonAssignments** (`src/components/features/academics/components/curriculum/LessonAssignments.tsx`)
   - Remove AssignmentDialog usage
   - Remove embedded AssignmentQuestionsBuilder
   - "Add Assignment" button navigates to `/lessons/[lessonId]/assignments/new`
   - Assignment cards navigate to `/lessons/[lessonId]/assignments/[assignmentId]`
   - Keep attachments preview in collapsed view
   - Status: ⏳ To be updated

## Translation Keys

### Already Added ✅
```json
"assignmentBuilder": {
  "backToLesson": "Back to Lesson" / "العودة إلى الدرس",
  "questions": "Questions" / "الأسئلة",
  "settings": "Settings" / "الإعدادات",
  "attachments": "Attachments" / "المرفقات",
  "addQuestion": "Add Question" / "إضافة سؤال",
  "addFirstQuestion": "Add your first question" / "إضافة أول سؤال",
  "unsaved": "Unsaved changes" / "تغييرات غير محفوظة",
  "readOnly": "Read-only" / "للعرض فقط",
  "publish": "Publish" / "نشر",
  "unpublish": "Unpublish" / "إلغاء النشر",
  "published": "Published" / "منشور",
  "draft": "Draft" / "مسودة",
  "confirmDelete": "Are you sure..." / "هل أنت متأكد...",
  "notFound": "Assignment not found" / "الواجب غير موجود",
  "questionsOutline": "Questions Outline" / "قائمة الأسئلة",
  "noQuestionsYet": "No questions yet..." / "لا توجد أسئلة بعد...",
  "assignmentDetails": "Assignment Details" / "تفاصيل الواجب",
  "pointsSummary": "Points Summary" / "ملخص الدرجات"
}
```

## Validation Rules

### Assignment Level
- `titleAr` required
- `titleEn` required
- `titleAr` ≠ `titleEn`
- `descriptionAr` ≠ `descriptionEn` (if both filled)
- `maxScore` ≥ 0
- `dueDate` optional (warn if holiday)

### Question Level
- `questionTextAr` required
- `questionTextEn` required
- `questionTextAr` ≠ `questionTextEn`
- `points` ≥ 0
- MCQ: min 2 options, at least 1 correct
- MCQ_SINGLE: exactly 1 correct
- MCQ_MULTI: at least 1 correct
- Option text: `textAr` ≠ `textEn`
- No duplicate options (case-insensitive, normalized)

### Publish Validation
- Sum of question points MUST equal `maxScore`
- If mismatch: block publish, show error, suggest auto-distribute

## Read-Only Mode

### When `termStatus === "closed"`
- Show "Read-only" chip in header
- Disable all edit/add/delete/publish/upload actions
- Hide action buttons
- Allow viewing only

## Mobile Responsiveness

### < 768px (Mobile)
- Single column layout
- Tabs for Questions / Settings / Attachments
- Questions outline opens in drawer (button in header)
- Question editor full-width
- Settings and Attachments in tabs

### 768px - 1024px (Tablet)
- 2-column layout: Editor + Settings/Attachments
- Questions outline in drawer

### > 1024px (Desktop)
- Full 3-column layout

## Implementation Steps

### Phase 1: Basic Routing & Navigation ✅
- [x] Create route files
- [x] Create AssignmentBuilderPage skeleton
- [x] Add translation keys
- [ ] Update LessonAssignments to navigate instead of dialog

### Phase 2: Builder Page Layout
- [ ] Implement sticky header with actions
- [ ] Create 3-column layout structure
- [ ] Add responsive breakpoints
- [ ] Implement mobile tabs

### Phase 3: Questions Outline
- [ ] Create QuestionsOutline component
- [ ] List questions with metadata
- [ ] Handle selection
- [ ] Add reorder functionality
- [ ] "+ Add Question" button

### Phase 4: Inline Question Editor
- [ ] Create QuestionEditorInline component
- [ ] Reuse logic from QuestionDrawer
- [ ] Render inline (not drawer)
- [ ] Handle save/cancel
- [ ] Empty state when no question selected

### Phase 5: Settings Panel
- [ ] Create AssignmentSettingsPanel component
- [ ] Bilingual title/description fields
- [ ] Due date picker
- [ ] Max score input
- [ ] Points summary bar
- [ ] Auto-distribute button
- [ ] Validation

### Phase 6: Attachments Panel
- [ ] Create AssignmentAttachmentsPanel component
- [ ] Drag & drop upload
- [ ] Add link functionality
- [ ] List attachments
- [ ] Delete attachments

### Phase 7: Dirty State & Navigation Guard
- [ ] Integrate useDirtyKey hook
- [ ] Mark dirty on all edits
- [ ] Clear dirty on save/delete
- [ ] Test navigation guard

### Phase 8: Publish Flow
- [ ] Validate points match
- [ ] Block publish if mismatch
- [ ] Toggle publish state
- [ ] Update UI

### Phase 9: Testing & Polish
- [ ] Test create flow
- [ ] Test edit flow
- [ ] Test delete flow
- [ ] Test publish flow
- [ ] Test read-only mode
- [ ] Test mobile layout
- [ ] Test RTL (Arabic)
- [ ] Test navigation guard

## API Calls (Reuse Existing)

All existing service functions will be reused:
- `fetchLessonAssignments(lessonId)`
- `createAssignment(lessonId, payload)`
- `updateAssignment(assignmentId, payload)`
- `deleteAssignment(assignmentId)`
- `fetchAssignmentQuestions(assignmentId)`
- `createAssignmentQuestion(assignmentId, payload)`
- `updateAssignmentQuestion(questionId, payload)`
- `deleteAssignmentQuestion(questionId)`
- `reorderAssignmentQuestions(assignmentId, orderedIds)`
- `bulkUpdateQuestionPoints(assignmentId, updates)`
- `fetchAssignmentAttachments(assignmentId)`
- `uploadAssignmentAttachmentFile(assignmentId, file)`
- `createAssignmentAttachmentLink(assignmentId, payload)`
- `deleteAssignmentAttachment(attachmentId)`

## Benefits of This Approach

1. **Focused Experience**: Full-page builder eliminates distractions
2. **Better Organization**: Clear separation of questions, settings, attachments
3. **Easier Navigation**: Direct URLs for assignments
4. **Improved Mobile UX**: Tabs instead of cramped embedded view
5. **Scalability**: Easier to add features (e.g., question bank, templates)
6. **Familiar Pattern**: Similar to Google Forms, Typeform, etc.
7. **Better State Management**: Dedicated page simplifies state
8. **Unsaved Changes Protection**: Global guard prevents data loss

## Next Steps

1. Complete Phase 1 by updating LessonAssignments navigation
2. Implement Phase 2 (layout structure)
3. Continue through phases sequentially
4. Test thoroughly at each phase
5. Document any API changes needed

## Notes

- No new dependencies required
- Reuse all existing components where possible
- Maintain backward compatibility with existing data
- Keep existing business logic intact
- Focus on UX improvement, not logic changes
