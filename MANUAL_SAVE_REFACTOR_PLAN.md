# Assignment Builder: Manual Save Refactor Plan

## Overview
Remove all auto-save functionality and implement explicit manual save with proper dirty state tracking and confirmation dialogs.

## Current State Analysis

### Auto-Save Implementation
1. **useAutoSave hook** - Provides debounced auto-save with status tracking
2. **AssignmentBuilderPage** - Uses two auto-save instances:
   - `assignmentAutoSave` - For assignment metadata
   - `questionAutoSave` - For question edits
3. **QuestionEditor** - Has internal debounced save with setTimeout
4. **Mutations** - All API calls happen through useAssignmentMutations

### Problems to Solve
1. Remove all auto-save hooks and debounced saves
2. Implement local draft state management
3. Add manual "Save Assignment" and "Save Question" buttons
4. Add confirmation dialog when switching questions with unsaved changes
5. Integrate with global dirty tracking
6. Show clear save status indicators

## Implementation Steps

### Step 1: Add Translation Keys
Add to both `en.json` and `ar.json`:
```json
{
  "common": {
    "saveQuestion": "Save question" / "حفظ السؤال",
    "saveAssignment": "Save assignment" / "حفظ الواجب",
    "saving": "Saving…" / "جارٍ الحفظ…",
    "saved": "Saved" / "تم الحفظ",
    "unsaved": "Unsaved" / "غير محفوظ",
    "discard": "Discard" / "تجاهل",
    "saveAndSwitch": "Save & switch" / "حفظ والمتابعة",
    "discardAndSwitch": "Discard & switch" / "تجاهل والمتابعة",
    "unsavedChanges": "Unsaved changes" / "تغييرات غير محفوظة",
    "unsavedChangesMessage": "Save changes before switching?" / "حفظ التغييرات قبل المتابعة؟"
  }
}
```

### Step 2: Remove Auto-Save Hook
- Keep the file for reference but mark as deprecated
- Remove all imports and usage from AssignmentBuilderPage

### Step 3: Refactor AssignmentBuilderPage

#### A. Add Draft State Management
```typescript
// Assignment draft state
const [assignmentDraft, setAssignmentDraft] = useState<Assignment | null>(null);
const [lastSavedAssignment, setLastSavedAssignment] = useState<Assignment | null>(null);
const [isAssignmentDirty, setIsAssignmentDirty] = useState(false);
const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);

// Question draft state
const [questionDraft, setQuestionDraft] = useState<AssignmentQuestion | null>(null);
const [lastSavedQuestion, setLastSavedQuestion] = useState<AssignmentQuestion | null>(null);
const [isQuestionDirty, setIsQuestionDirty] = useState(false);
const [isQuestionSaving, setIsQuestionSaving] = useState(false);

// Confirmation dialog for switching questions
const [switchQuestionDialog, setSwitchQuestionDialog] = useState<{
  isOpen: boolean;
  targetQuestionId: string | null;
}>({ isOpen: false, targetQuestionId: null });
```

#### B. Initialize Drafts from Fetched Data
```typescript
useEffect(() => {
  if (assignment) {
    setAssignmentDraft(assignment);
    setLastSavedAssignment(assignment);
    setIsAssignmentDirty(false);
  }
}, [assignment?.id]); // Only reset when assignment ID changes

useEffect(() => {
  if (selectedQuestionId) {
    const question = questions.find(q => q.id === selectedQuestionId);
    if (question) {
      setQuestionDraft(question);
      setLastSavedQuestion(question);
      setIsQuestionDirty(false);
    }
  }
}, [selectedQuestionId]); // Reset when switching questions
```

#### C. Compute Dirty States
```typescript
useEffect(() => {
  if (assignmentDraft && lastSavedAssignment) {
    const isDirty = JSON.stringify(assignmentDraft) !== JSON.stringify(lastSavedAssignment);
    setIsAssignmentDirty(isDirty);
  }
}, [assignmentDraft, lastSavedAssignment]);

useEffect(() => {
  if (questionDraft && lastSavedQuestion) {
    const isDirty = JSON.stringify(questionDraft) !== JSON.stringify(lastSavedQuestion);
    setIsQuestionDirty(isDirty);
  }
}, [questionDraft, lastSavedQuestion]);

// Update global dirty tracking
useEffect(() => {
  if (isAssignmentDirty || isQuestionDirty) {
    markDirty();
  } else {
    clearDirty();
  }
}, [isAssignmentDirty, isQuestionDirty, markDirty, clearDirty]);
```

#### D. Manual Save Handlers
```typescript
const handleSaveAssignment = async () => {
  if (!assignmentDraft || !isAssignmentDirty) return;
  
  setIsAssignmentSaving(true);
  try {
    await saveAssignment(assignmentDraft);
    setLastSavedAssignment(assignmentDraft);
    setIsAssignmentDirty(false);
    showSuccess(tCommon("save_success"));
  } catch (error) {
    showError(tCommon("save_failed"));
  } finally {
    setIsAssignmentSaving(false);
  }
};

const handleSaveQuestion = async () => {
  if (!questionDraft || !isQuestionDirty) return;
  
  // Validate before saving
  const errors = validateQuestion(questionDraft, tValidation);
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return;
  }
  
  setIsQuestionSaving(true);
  try {
    await updateQuestion(questionDraft.id, questionDraft);
    setLastSavedQuestion(questionDraft);
    setIsQuestionDirty(false);
    showSuccess(tCommon("save_success"));
  } catch (error) {
    showError(tCommon("save_failed"));
  } finally {
    setIsQuestionSaving(false);
  }
};
```

#### E. Question Switching with Confirmation
```typescript
const handleSelectQuestion = (questionId: string) => {
  if (isQuestionDirty) {
    // Show confirmation dialog
    setSwitchQuestionDialog({
      isOpen: true,
      targetQuestionId: questionId,
    });
  } else {
    // Switch directly
    setSelectedQuestionId(questionId);
  }
};

const handleSaveAndSwitch = async () => {
  await handleSaveQuestion();
  if (!isQuestionDirty && switchQuestionDialog.targetQuestionId) {
    setSelectedQuestionId(switchQuestionDialog.targetQuestionId);
    setSwitchQuestionDialog({ isOpen: false, targetQuestionId: null });
  }
};

const handleDiscardAndSwitch = () => {
  if (switchQuestionDialog.targetQuestionId) {
    setSelectedQuestionId(switchQuestionDialog.targetQuestionId);
    setSwitchQuestionDialog({ isOpen: false, targetQuestionId: null });
  }
};
```

### Step 4: Refactor QuestionEditor

#### Remove All Auto-Save Logic
- Remove `saveTimeoutRef` and `debouncedSave`
- Remove all `setTimeout` calls
- Remove all `onBlur` handlers that trigger saves
- Keep local state for form fields
- Add `onDirtyChange` callback prop

#### Update to Controlled Component
```typescript
interface QuestionEditorProps {
  question: AssignmentQuestion;
  onChange: (updates: Partial<AssignmentQuestion>) => void; // Immediate local update
  onDirtyChange: (isDirty: boolean) => void;
  isReadOnly: boolean;
  validationErrors?: ValidationErrors;
}

// In component:
const handleQuestionTextChange = (value: { ar: string; en: string }) => {
  onChange({
    questionTextAr: value.ar,
    questionTextEn: value.en,
  });
  onDirtyChange(true);
};

const handlePointsChange = (points: number) => {
  onChange({ points });
  onDirtyChange(true);
};

// etc for all fields
```

### Step 5: Update BuilderHeader

#### Add Save Status Indicators
```typescript
// Show status based on dirty state
{!isReadOnly && (
  <div className="flex items-center gap-2">
    {isAssignmentSaving || isQuestionSaving ? (
      <span className="text-sm text-blue-600 flex items-center gap-1">
        <Loader2 className="w-4 h-4 animate-spin" />
        {tCommon("saving")}
      </span>
    ) : (isAssignmentDirty || isQuestionDirty) ? (
      <span className="text-sm text-amber-600">
        {tCommon("unsaved")}
      </span>
    ) : (
      <span className="text-sm text-green-600 flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4" />
        {tCommon("saved")}
      </span>
    )}
  </div>
)}
```

#### Update Save Button
```typescript
<Button
  onClick={handleSaveAssignment}
  variant="primary"
  size="sm"
  leftIcon={<Save className="w-4 h-4" />}
  disabled={isReadOnly || !isAssignmentDirty || isAssignmentSaving}
>
  {isAssignmentSaving ? tCommon("saving") : tCommon("save")}
</Button>
```

### Step 6: Add Save Question Button to Layouts

#### In DesktopLayout
Add "Save Question" button in the question editor section header:
```typescript
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold">{t("questionEditor")}</h3>
  {!isReadOnly && selectedQuestion && (
    <Button
      onClick={onSaveQuestion}
      variant="primary"
      size="sm"
      leftIcon={<Save className="w-4 h-4" />}
      disabled={!isQuestionDirty || isQuestionSaving}
    >
      {isQuestionSaving ? tCommon("saving") : tCommon("saveQuestion")}
    </Button>
  )}
</div>
```

#### In MobileLayout
Similar placement in mobile view

### Step 7: Update Reorder Logic
Make reorder changes part of dirty state:
- Track original question order
- Mark dirty when order changes
- Only persist on explicit save or when user confirms

### Step 8: Testing Checklist
- [ ] Edit assignment title → no API call until Save Assignment
- [ ] Edit question text → no API call until Save Question
- [ ] Switch questions with unsaved changes → confirmation dialog appears
- [ ] Save & Switch → persists and navigates
- [ ] Discard & Switch → discards and navigates
- [ ] Leave page with unsaved → global guard triggers
- [ ] Publish button disabled when dirty
- [ ] Status indicators show correct state
- [ ] RTL layout works correctly
- [ ] Mobile layout works correctly

## Files to Modify

1. `src/messages/en.json` - Add translation keys
2. `src/messages/ar.json` - Add translation keys
3. `src/features/academics/assignments/builder/pages/AssignmentBuilderPage.tsx` - Main refactor
4. `src/components/features/academics/components/curriculum/QuestionEditor.tsx` - Remove auto-save
5. `src/features/academics/assignments/builder/components/BuilderHeader.tsx` - Update UI
6. `src/features/academics/assignments/builder/components/DesktopLayout.tsx` - Add Save Question button
7. `src/features/academics/assignments/builder/components/MobileLayout.tsx` - Add Save Question button
8. `src/features/academics/assignments/builder/hooks/useAutoSave.ts` - Mark as deprecated (optional)

## Migration Notes

### Breaking Changes
- Auto-save is completely removed
- Users must explicitly save changes
- Switching questions requires confirmation if unsaved

### Benefits
- Clear user control over when data is saved
- No unexpected API calls
- Better performance (fewer API calls)
- Clearer UX with explicit save states
- Prevents accidental data loss with confirmation dialogs

### Risks
- Users might forget to save
- More clicks required
- Need good visual indicators to remind users to save

### Mitigations
- Clear "Unsaved" indicators
- Disable navigation when dirty (global guard)
- Confirmation dialogs before losing work
- Save button prominently placed
- Keyboard shortcuts (optional future enhancement)
