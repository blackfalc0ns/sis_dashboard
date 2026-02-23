# Lesson Video & Assignments Implementation Plan

## Status: READY FOR IMPLEMENTATION

This document outlines the complete implementation plan for adding Lesson Video and Assignments features to Tab 3 (Curriculum).

---

## ✅ COMPLETED

### 1. TypeScript Types Added
**File**: `src/services/academics/curriculumService.ts`

Added interfaces:
- `LessonVideo` - for video upload/link
- `Assignment` - for homework assignments
- `AssignmentAttachment` - for assignment files/links

### 2. API Services Added
**File**: `src/services/academics/curriculumService.ts`

Added functions (mock implementation using localStorage):
- `fetchLessonVideo(lessonId)`
- `upsertLessonVideoLink(lessonId, payload)`
- `uploadLessonVideoFile(lessonId, file, payload)`
- `deleteLessonVideo(lessonId)`
- `fetchLessonAssignments(lessonId)`
- `createAssignment(lessonId, payload)`
- `updateAssignment(assignmentId, payload)`
- `deleteAssignment(assignmentId)`
- `fetchAssignmentAttachments(assignmentId)`
- `uploadAssignmentAttachmentFile(assignmentId, file, meta)`
- `createAssignmentAttachmentLink(assignmentId, payload)`
- `deleteAssignmentAttachment(attachmentId)`

---

## 📋 TODO: REMAINING IMPLEMENTATION

### Step 3: Add Translations

**Files to update**:
- `src/messages/en.json`
- `src/messages/ar.json`

**Keys to add**:

```json
{
  "academics": {
    "curriculum": {
      "lessonVideo": {
        "title": "Lesson Video",
        "upload": "Upload",
        "link": "Link",
        "videoUrl": "Video URL",
        "noVideo": "No video added yet.",
        "removeVideo": "Remove video?",
        "termClosedReadonly": "Term is closed. Video is read-only.",
        "preview": "Preview",
        "open": "Open",
        "videoTitle": "Video Title",
        "urlInvalid": "Enter a valid URL starting with http:// or https://",
        "uploadVideo": "Upload Video",
        "addVideoLink": "Add Video Link"
      },
      "assignments": {
        "title": "Assignments",
        "addAssignment": "Add Assignment",
        "editAssignment": "Edit Assignment",
        "noAssignments": "No assignments yet.",
        "termClosedReadonly": "Term is closed. Assignments are read-only.",
        "dueDate": "Due Date",
        "maxScore": "Max Score",
        "assignmentTitle": "Assignment Title",
        "description": "Description",
        "attachments": "Attachments",
        "deleteAssignment": "Delete assignment?",
        "maxScoreInvalid": "Max score must be 0 or more"
      }
    }
  }
}
```

### Step 4: Create LessonVideo Component

**New file**: `src/components/features/academics/components/curriculum/LessonVideo.tsx`

**Features**:
- Mode switch (Upload / Link) using radio buttons or tabs
- Bilingual title fields using `<BilingualTextField />`
- Upload mode: `<FileUploadButton accept="video/*" />`
- Link mode: URL input with validation
- Preview dialog with `<video>` or iframe for YouTube/Vimeo
- Delete confirmation
- Read-only mode when `isReadOnly={true}`
- Loading states during upload

**Props**:
```typescript
interface LessonVideoProps {
  lessonId: string;
  isReadOnly: boolean;
}
```

### Step 5: Create AssignmentDialog Component

**New file**: `src/components/features/academics/components/curriculum/AssignmentDialog.tsx`

**Features**:
- Bilingual title (required, AR != EN)
- Bilingual description (optional, multiline)
- Due date picker (MUI DatePicker)
- Max score (number input, >= 0)
- Save/Cancel buttons
- Validation

**Props**:
```typescript
interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: Partial<Assignment>) => Promise<void>;
  assignment?: Assignment | null;
  isReadOnly: boolean;
}
```

### Step 6: Create LessonAssignments Component

**New file**: `src/components/features/academics/components/curriculum/LessonAssignments.tsx`

**Features**:
- List of assignments with title, due date, max score
- Add button (opens AssignmentDialog)
- Edit/Delete actions per assignment
- Expandable attachments section per assignment (reuse LessonMaterials pattern)
- Empty state
- Read-only mode

**Props**:
```typescript
interface LessonAssignmentsProps {
  lessonId: string;
  isReadOnly: boolean;
}
```

### Step 7: Integrate into CurriculumEditor

**File to update**: `src/components/features/academics/components/curriculum/CurriculumEditor.tsx`

**Changes**:
1. Import new components:
```typescript
import LessonVideo from './LessonVideo';
import LessonAssignments from './LessonAssignments';
```

2. Add sections after LessonMaterials (around line 390):
```tsx
{/* Lesson Video Section - Only for existing lessons */}
{selectedNode.type === "lesson" && !isNew && (
  <LessonVideo lessonId={selectedNode.id} isReadOnly={isReadOnly} />
)}

{/* Lesson Assignments Section - Only for existing lessons */}
{selectedNode.type === "lesson" && !isNew && (
  <LessonAssignments lessonId={selectedNode.id} isReadOnly={isReadOnly} />
)}
```

---

## 🎨 UI/UX GUIDELINES

### LessonVideo Component Layout

```
┌─────────────────────────────────────────┐
│ Lesson Video                            │
├─────────────────────────────────────────┤
│ Mode: ○ Upload  ● Link                  │
│                                         │
│ Video Title (Arabic) *                  │
│ [________________]                      │
│                                         │
│ Video Title (English) *                 │
│ [________________]                      │
│                                         │
│ Video URL *                             │
│ [________________________________]      │
│                                         │
│ [Preview] [Save] [Remove]               │
└─────────────────────────────────────────┘
```

### LessonAssignments Component Layout

```
┌─────────────────────────────────────────┐
│ Assignments              [+ Add]        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Assignment 1                    [⋮] │ │
│ │ Due: 2024-03-15 | Score: 100       │ │
│ │ ▼ Attachments (2)                  │ │
│ │   📄 file1.pdf                     │ │
│ │   🔗 link1                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Assignment 2                    [⋮] │ │
│ │ Due: 2024-03-20 | Score: 50        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔒 READ-ONLY BEHAVIOR

When `isReadOnly={true}` (term status is "Closed"):

### LessonVideo:
- Disable mode switch
- Disable upload button
- Disable URL input
- Disable save/remove buttons
- Show helper text: "Term is closed. Video is read-only."
- Allow preview/open only

### LessonAssignments:
- Disable add button
- Disable edit/delete actions
- Disable attachment upload/add/delete
- Show helper text: "Term is closed. Assignments are read-only."
- Allow viewing/opening attachments only

---

## 🧪 VALIDATION RULES

### LessonVideo:
1. Title AR required
2. Title EN required
3. AR != EN (after normalization)
4. URL required (link mode)
5. URL must start with `http://` or `https://`
6. File required (upload mode)
7. File must be video/* mime type

### Assignment:
1. Title AR required
2. Title EN required
3. AR != EN (after normalization)
4. Description AR != EN (only if both provided)
5. Max score >= 0 (if provided)
6. Due date must be valid date (if provided)

---

## 📦 COMPONENT REUSE

### Existing Components to Reuse:
- `<BilingualTextField />` - for all bilingual inputs
- `<FileUploadButton />` - for video and attachment uploads
- `<Modal />` - for dialogs
- `<Button />` - for all buttons
- `<Input />` - for single-line inputs
- `<TextArea />` - for descriptions
- MUI `<DatePicker />` - for due date

### Pattern to Follow:
Look at `LessonMaterials.tsx` for:
- Attachment list rendering
- Upload/link handling
- Delete confirmation
- Empty states
- Read-only behavior

---

## 🌐 RTL SUPPORT

All components must:
- Use `useLocale()` to detect RTL
- Apply proper text alignment
- Reverse icon positions in RTL
- Use MUI's built-in RTL support

---

## 📝 IMPLEMENTATION CHECKLIST

- [x] Add TypeScript types
- [x] Add API service functions
- [ ] Add translations (en.json, ar.json)
- [ ] Create LessonVideo component
- [ ] Create AssignmentDialog component
- [ ] Create LessonAssignments component
- [ ] Integrate into CurriculumEditor
- [ ] Test upload functionality
- [ ] Test link functionality
- [ ] Test video preview
- [ ] Test assignment CRUD
- [ ] Test assignment attachments
- [ ] Test read-only mode
- [ ] Test RTL layout
- [ ] Test validation
- [ ] Update documentation

---

## 🚀 NEXT STEPS

1. Add translations to en.json and ar.json
2. Create LessonVideo.tsx component
3. Create AssignmentDialog.tsx component
4. Create LessonAssignments.tsx component
5. Integrate all into CurriculumEditor.tsx
6. Test thoroughly in both EN and AR
7. Replace mock API with real endpoints when backend is ready

---

## 📄 FILES TO CREATE/MODIFY

### New Files:
1. `src/components/features/academics/components/curriculum/LessonVideo.tsx`
2. `src/components/features/academics/components/curriculum/AssignmentDialog.tsx`
3. `src/components/features/academics/components/curriculum/LessonAssignments.tsx`

### Modified Files:
1. `src/services/academics/curriculumService.ts` ✅ DONE
2. `src/messages/en.json` - add translations
3. `src/messages/ar.json` - add translations
4. `src/components/features/academics/components/curriculum/CurriculumEditor.tsx` - integrate new components

---

**Total Estimated Implementation Time**: 6-8 hours
**Complexity**: Medium-High
**Dependencies**: None (all existing components)
