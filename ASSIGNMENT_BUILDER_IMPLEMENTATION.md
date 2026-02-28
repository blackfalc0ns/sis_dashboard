# Assignment Builder - Google Forms-like UX Implementation

## Summary

Successfully implemented a Google Forms-like assignment builder with dedicated pages for creating and editing assignments. The implementation includes a complete UX refactor while maintaining all existing business logic and APIs.

## Routes Implemented

### 1. Create Assignment
- **Route**: `/academics/curriculum/lessons/[lessonId]/assignments/new`
- **Behavior**: Automatically creates a draft assignment and redirects to edit page
- **File**: `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/new/page.tsx`

### 2. Edit Assignment
- **Route**: `/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]`
- **Behavior**: Loads existing assignment with questions and attachments
- **File**: `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]/page.tsx`

## Key Features Implemented

### Sticky Top Header
- Back button to lesson editor
- Assignment title display with status chips (Draft/Published/Read-only)
- Action buttons: Save, Publish/Unpublish, Delete (More menu)
- Responsive design for mobile and desktop

### Desktop Layout (3-Column)

#### Left Sidebar - Questions Outline (280-320px fixed width)
- Scrollable list of questions
- Each item shows:
  - Question number (Q1, Q2, etc.)
  - Question type chip with color coding
  - Points value
  - Validity badge (✅ configured / ⚠️ needs attention)
- Click to select question
- "+ Add Question" button
- Up/Down buttons for reordering
- Delete button for each question

#### Center Panel - Question Editor
- Inline Google Forms-style editor
- Bilingual question text (AR/EN with validation)
- Question type selector (MCQ Single/Multi, True/False, Short Answer, Essay)
- Points input
- Answer configuration based on type:
  - MCQ: Drag-and-drop options with correct answer selection
  - True/False: Radio button selector
  - Short Answer: Optional sample answer (bilingual)
  - Essay: Manual grading hint
- Auto-save on blur
- Empty state with CTA when no questions exist

#### Right Panel - Settings + Attachments (384px fixed width)
- **Assignment Settings Card**:
  - Bilingual title (required, AR≠EN)
  - Bilingual description (optional, AR≠EN if both filled)
  - Due date picker
  - Max score input
- **Points Summary Card**:
  - Max score display
  - Total question points
  - Difference calculation
  - Status indicator (match/mismatch)
  - "Auto distribute points" button
  - Publish blocked if mismatch
- **Attachments Card**:
  - Drag & drop upload area
  - Add link button
  - List of attachments with delete action
  - File size limit: 50MB

### Mobile Layout (Tabs)
- Three tabs: Questions, Settings, Attachments
- Questions tab:
  - Button to open questions drawer
  - Question editor (same as desktop center panel)
- Settings tab: Assignment settings (same as desktop right panel)
- Attachments tab: Attachments panel (same as desktop right panel)
- Questions drawer:
  - Slides in from left
  - Shows questions outline
  - Click question to select and close drawer

## Components Created

### 1. AssignmentBuilderPage
**File**: `src/components/features/academics/components/pages/AssignmentBuilderPage.tsx`

Main page component with:
- State management for assignment, questions, attachments
- Draft creation flow for new assignments
- CRUD operations for questions
- File upload and link management
- Auto-distribute points logic
- Publish validation
- Dirty state tracking with global unsaved changes guard
- Responsive layout switching (desktop/mobile)

Sub-components:
- `StickyHeader`: Top navigation and actions
- `DesktopLayout`: 3-column layout for desktop
- `MobileLayout`: Tabbed layout for mobile
- `QuestionOutlineItem`: Question list item with reorder controls
- `AssignmentSettings`: Settings and points summary panel
- `AttachmentsPanel`: File upload and link management

### 2. QuestionEditor
**File**: `src/components/features/academics/components/curriculum/QuestionEditor.tsx`

Inline question editor with:
- Bilingual text fields with validation
- Question type selector
- Points input
- Dynamic answer configuration based on type
- Drag-and-drop option reordering for MCQ
- Auto-save on blur
- Read-only mode support

## Data Flow

### Services Used (No API Changes)
All existing services from `src/services/academics/curriculumService.ts`:
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

### New Assignment Flow
1. User clicks "Add Assignment" in Lesson Editor
2. Navigate to `/lessons/[lessonId]/assignments/new`
3. Page immediately creates draft assignment via API
4. Router replaces URL to `/lessons/[lessonId]/assignments/[assignmentId]`
5. User can now edit assignment details, add questions, upload attachments

### Dirty State Management
- Dirty key: `assignment-builder:${assignmentId || "new"}:${lessonId}`
- Marked dirty when:
  - Editing assignment fields (title, description, due date, max score)
  - Adding/editing/deleting/reordering questions
  - Changing question options or points
  - Uploading/deleting attachments
- Cleared on successful save
- Triggers global confirmation dialog on navigation

## Validations

### Assignment Level
- Title AR/EN required and must be different
- Description AR/EN must be different (if both filled)
- Max score must equal sum of question points before publish

### Question Level
- Question text AR/EN required and must be different
- Points must be ≥ 0
- MCQ: Minimum 2 options, each option AR/EN required and must be different
- MCQ Single: Exactly 1 correct answer required
- MCQ Multi: At least 1 correct answer required
- Short Answer: Sample answer AR/EN must be different (if both filled)

## Internationalization

### New Keys Added

#### English (`src/messages/en.json`)
```json
{
  "academics.curriculum.assignmentBuilder": {
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
  },
  "academics.curriculum.questions": {
    "description": "Description",
    "due_date": "Due Date"
  },
  "upload": {
    "addLink": "Add Link",
    "linkTitle": "Link Title",
    "linkUrl": "Link URL",
    "noAttachments": "No attachments yet"
  }
}
```

#### Arabic (`src/messages/ar.json`)
Corresponding Arabic translations added for all keys above.

## Term Status & Read-Only Mode

- Term status read from URL params (`termStatus=closed`)
- When `termStatus === "closed"`:
  - All edit/add/delete/publish/upload actions disabled
  - "Read-only" chip shown in header
  - UI elements show disabled state
  - Viewing only allowed

## Testing Checklist

### 1. Create New Assignment
- [ ] Click "Add Assignment" in Lesson Editor
- [ ] Verify redirect to builder page with new assignment ID
- [ ] Verify draft assignment created with default title
- [ ] Verify empty state shown for questions

### 2. Add Questions
- [ ] Click "Add Question" button
- [ ] Verify new question appears in outline
- [ ] Verify question editor shows in center panel
- [ ] Edit question text (AR/EN)
- [ ] Change question type
- [ ] Add/remove/reorder options (MCQ)
- [ ] Set correct answers
- [ ] Change points value
- [ ] Verify auto-save on blur

### 3. Reorder Questions
- [ ] Use Up/Down buttons in outline
- [ ] Verify question order updates
- [ ] Verify selected question remains selected

### 4. Delete Question
- [ ] Click delete on a question
- [ ] Confirm deletion
- [ ] Verify question removed from list
- [ ] Verify another question auto-selected

### 5. Assignment Settings
- [ ] Edit title (AR/EN) - verify AR≠EN validation
- [ ] Edit description (optional)
- [ ] Set due date
- [ ] Change max score
- [ ] Verify points summary updates

### 6. Auto Distribute Points
- [ ] Set max score to 100
- [ ] Add 3 questions
- [ ] Click "Auto distribute points"
- [ ] Verify points distributed evenly (34, 33, 33)
- [ ] Verify points summary shows match

### 7. Publish Validation
- [ ] Set max score to 100
- [ ] Add questions totaling 90 points
- [ ] Try to publish
- [ ] Verify error message about mismatch
- [ ] Fix points to match
- [ ] Verify publish succeeds

### 8. Attachments
- [ ] Drag and drop a file
- [ ] Verify file uploads and appears in list
- [ ] Click "Add Link"
- [ ] Enter title and URL
- [ ] Verify link appears in list
- [ ] Delete an attachment
- [ ] Verify attachment removed

### 9. Save & Navigation
- [ ] Make changes to assignment
- [ ] Click Save button
- [ ] Verify changes saved
- [ ] Try to navigate away without saving
- [ ] Verify unsaved changes dialog appears
- [ ] Confirm navigation
- [ ] Verify redirected back to curriculum page

### 10. Mobile Layout
- [ ] Open on mobile device/viewport
- [ ] Verify tabs shown (Questions/Settings/Attachments)
- [ ] Switch between tabs
- [ ] Click "Questions Outline" button
- [ ] Verify drawer opens from left
- [ ] Select a question
- [ ] Verify drawer closes and question shown

### 11. Read-Only Mode
- [ ] Open assignment with `termStatus=closed` param
- [ ] Verify "Read-only" chip shown
- [ ] Verify all edit buttons disabled
- [ ] Verify can view but not edit

## Files Changed

### New Files
1. `src/components/features/academics/components/pages/AssignmentBuilderPage.tsx` - Main builder page
2. `src/components/features/academics/components/curriculum/QuestionEditor.tsx` - Inline question editor

### Modified Files
1. `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/new/page.tsx` - New assignment route
2. `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]/page.tsx` - Edit assignment route
3. `src/components/features/academics/components/curriculum/LessonAssignments.tsx` - Updated navigation to new routes
4. `src/messages/en.json` - Added new i18n keys
5. `src/messages/ar.json` - Added Arabic translations

## Technical Notes

- Uses `@dnd-kit` for drag-and-drop functionality (already in project)
- Uses MUI components: Drawer, Tabs, Tab, useMediaQuery, useTheme
- Responsive breakpoint: `md` (768px)
- Dirty state integrated with global unsaved changes guard
- Auto-save on blur for question editor
- Key prop used for QuestionEditor to force remount on question change
- All existing business logic and APIs preserved
- No new dependencies added

## Known Limitations

- TypeScript `any` types used in some internal component props (acceptable for internal use)
- Attachment upload progress not shown (can be added later)
- No undo/redo functionality (can be added later)
- No keyboard shortcuts (can be added later)

## Future Enhancements

1. Add keyboard shortcuts (Ctrl+S to save, Ctrl+Z to undo, etc.)
2. Add undo/redo functionality
3. Add upload progress indicators
4. Add bulk question import (CSV/Excel)
5. Add question bank/templates
6. Add preview mode (student view)
7. Add duplicate question functionality
8. Add question search/filter in outline
9. Add rich text editor for question text
10. Add image upload for questions/options
