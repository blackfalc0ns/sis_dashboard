# How Questions Are Saved in Assignment Builder

## Overview

Questions in the Assignment Builder are saved **automatically** using an "auto-save on blur" approach, similar to Google Forms. There's no explicit "Save Question" button - changes are persisted as you work.

## Question Lifecycle

### 1. Creating a New Question

When you click "Add Question":

```typescript
const handleAddQuestion = async () => {
  if (!assignment) return;

  try {
    // Immediately creates the question in the database
    const newQuestion = await createAssignmentQuestion(assignment.id, {
      questionTextAr: "سؤال جديد",
      questionTextEn: "New Question",
      questionType: "MCQ_SINGLE",
      points: 1,
      options: [
        { id: `opt-${Date.now()}-1`, textAr: "خيار 1", textEn: "Option 1", isCorrect: true, order: 1 },
        { id: `opt-${Date.now()}-2`, textAr: "خيار 2", textEn: "Option 2", isCorrect: false, order: 2 },
      ],
    });

    // Adds to local state
    setQuestions([...questions, newQuestion]);
    
    // Selects the new question for editing
    setSelectedQuestionId(newQuestion.id);
    
    // Marks the assignment as having unsaved changes
    markDirty();
  } catch (error) {
    console.error("Failed to add question:", error);
  }
};
```

**Key Points:**
- Question is created in the database immediately
- Default values are set (bilingual text, MCQ_SINGLE type, 1 point, 2 options)
- Question is automatically selected for editing
- Assignment is marked as "dirty" (unsaved changes)

### 2. Editing a Question (Auto-Save)

The QuestionEditor component uses **auto-save on blur**:

```typescript
// Auto-save on blur
const handleBlur = () => {
  onUpdate({
    questionTextAr,
    questionTextEn,
    questionType,
    points,
    options: questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI" ? options : undefined,
    correctAnswer: questionType === "TRUE_FALSE" ? correctAnswer : undefined,
    sampleAnswerAr: questionType === "SHORT_ANSWER" && sampleAnswerAr.trim() ? sampleAnswerAr.trim() : undefined,
    sampleAnswerEn: questionType === "SHORT_ANSWER" && sampleAnswerEn.trim() ? sampleAnswerEn.trim() : undefined,
  });
};
```

**When Auto-Save Triggers:**
- When you finish typing in a text field and click away (blur event)
- When you change the question type
- When you add/remove/reorder options
- When you change correct answers
- When you change points

**What Gets Saved:**
- Question text (Arabic and English)
- Question type (MCQ_SINGLE, MCQ_MULTI, TRUE_FALSE, SHORT_ANSWER, ESSAY)
- Points value
- Options (for MCQ questions)
- Correct answer (for TRUE_FALSE questions)
- Sample answers (for SHORT_ANSWER questions)

### 3. Updating Question in Database

When auto-save triggers, it calls the parent's `handleUpdateQuestion`:

```typescript
const handleUpdateQuestion = async (questionId: string, updates: Partial<AssignmentQuestion>) => {
  try {
    // Updates the question in the database
    await updateAssignmentQuestion(questionId, updates);
    
    // Updates local state
    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)));
    
    // Marks assignment as having unsaved changes
    markDirty();
  } catch (error) {
    console.error("Failed to update question:", error);
  }
};
```

**Key Points:**
- Database is updated immediately
- Local state is synchronized
- Assignment remains "dirty" until you click the main "Save" button

## Specific Actions and Their Save Behavior

### Adding/Editing Options (MCQ Questions)

**Adding an Option:**
```typescript
const addOption = () => {
  const maxOrder = options.reduce((max, o) => Math.max(max, o.order), 0);
  const newOptions = [
    ...options,
    {
      id: `opt-${Date.now()}-${Math.random()}`,
      textAr: "",
      textEn: "",
      isCorrect: false,
      order: maxOrder + 1,
    },
  ];
  setOptions(newOptions);
  markDirty();
};
```
- Option is added to local state immediately
- Saved when you blur from the option text field

**Editing Option Text:**
```typescript
const updateOptionText = (id: string, ar: string, en: string) => {
  const newOptions = options.map((o) => (o.id === id ? { ...o, textAr: ar, textEn: en } : o));
  setOptions(newOptions);
  markDirty();
};
```
- Updates local state as you type
- Saved when you blur from the text field

**Changing Correct Answer:**
```typescript
const updateOptionCorrect = (id: string, checked: boolean) => {
  let newOptions;
  if (questionType === "MCQ_SINGLE") {
    // Radio behavior - only one correct
    newOptions = options.map((o) => ({ ...o, isCorrect: o.id === id ? checked : false }));
  } else {
    // Checkbox behavior - multiple correct
    newOptions = options.map((o) => (o.id === id ? { ...o, isCorrect: checked } : o));
  }
  setOptions(newOptions);
  markDirty();
  onUpdate({ options: newOptions }); // Saves immediately
};
```
- Saved immediately when you check/uncheck

**Reordering Options:**
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = options.findIndex((o) => o.id === active.id);
    const newIndex = options.findIndex((o) => o.id === over.id);

    const newOptions = arrayMove(options, oldIndex, newIndex).map((o, i) => ({ ...o, order: i + 1 }));
    setOptions(newOptions);
    markDirty();
    onUpdate({ options: newOptions }); // Saves immediately
  }
};
```
- Saved immediately after drag-and-drop

### Changing Question Type

```typescript
const handleTypeChange = (newType: AssignmentQuestion["questionType"]) => {
  const oldType = questionType;
  setQuestionType(newType);

  // Initialize options for MCQ types
  if (
    (newType === "MCQ_SINGLE" || newType === "MCQ_MULTI") &&
    oldType !== "MCQ_SINGLE" &&
    oldType !== "MCQ_MULTI"
  ) {
    if (options.length === 0) {
      setOptions([
        { id: `opt-${Date.now()}-1`, textAr: "", textEn: "", isCorrect: false, order: 1 },
        { id: `opt-${Date.now()}-2`, textAr: "", textEn: "", isCorrect: false, order: 2 },
      ]);
    }
  } else if (newType !== "MCQ_SINGLE" && newType !== "MCQ_MULTI") {
    setOptions([]);
  }

  markDirty();
  handleBlur(); // Saves immediately
};
```
- Saved immediately when you change the type
- Automatically initializes appropriate fields for the new type

### Deleting a Question

```typescript
const handleDeleteQuestion = async (questionId: string) => {
  if (!confirm(tQuestions("delete_question_confirm"))) return;

  try {
    // Deletes from database
    await deleteAssignmentQuestion(questionId);
    
    // Updates local state
    const newQuestions = questions.filter((q) => q.id !== questionId);
    setQuestions(newQuestions);

    // Selects another question
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(newQuestions.length > 0 ? newQuestions[0].id : null);
    }
    
    markDirty();
  } catch (error) {
    console.error("Failed to delete question:", error);
  }
};
```
- Requires confirmation
- Deleted from database immediately
- Local state updated
- Another question is auto-selected

### Reordering Questions

```typescript
const handleMoveQuestion = async (questionId: string, direction: "up" | "down") => {
  const index = questions.findIndex((q) => q.id === questionId);
  if (
    (direction === "up" && index === 0) ||
    (direction === "down" && index === questions.length - 1)
  ) {
    return;
  }

  const newIndex = direction === "up" ? index - 1 : index + 1;
  const newQuestions = [...questions];
  [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];

  try {
    // Saves new order to database
    await reorderAssignmentQuestions(
      assignment!.id,
      newQuestions.map((q) => q.id)
    );
    setQuestions(newQuestions);
    markDirty();
  } catch (error) {
    console.error("Failed to reorder questions:", error);
  }
};
```
- Saved immediately when you click up/down buttons

## The "Dirty" State System

### What is "Dirty" State?

The assignment is marked as "dirty" when there are unsaved changes. This is tracked using the global unsaved changes guard system.

```typescript
const { markDirty, clearDirty } = useDirtyKey(
  `assignment-builder:${assignmentId || "new"}:${lessonId}`
);
```

### When is it Marked Dirty?

- When you add a question
- When you edit a question
- When you delete a question
- When you reorder questions
- When you change assignment settings (title, description, due date, max score)
- When you upload/delete attachments

### When is it Cleared?

- When you click the main "Save" button (saves assignment metadata)
- When you successfully delete the assignment
- When you navigate away and confirm leaving

### What Does it Do?

- Shows "Unsaved changes" indicator in the UI
- Triggers confirmation dialog if you try to navigate away
- Prevents accidental data loss

## Important Notes

### Questions vs Assignment Metadata

There are two types of saves:

1. **Question Changes** (Auto-saved immediately)
   - Question text, type, points, options, correct answers
   - Saved to database as you edit
   - No explicit save button needed

2. **Assignment Metadata** (Manual save via "Save" button)
   - Assignment title, description, due date, max score
   - Requires clicking the "Save" button in the header
   - Validates before saving

### Why This Approach?

This design follows Google Forms' pattern:
- ✅ No risk of losing question edits
- ✅ Immediate feedback (changes are saved)
- ✅ Smooth editing experience (no modal dialogs)
- ✅ Clear separation between question edits and assignment settings

### Error Handling

If a save fails:
- Error is logged to console
- User can continue editing
- Changes remain in local state
- Next successful edit will retry the save

### Performance Considerations

- Auto-save only triggers on blur (not on every keystroke)
- Database updates are async (non-blocking)
- Local state updates immediately for responsive UI
- Debouncing is handled by the blur event

## Testing the Save Functionality

### Test 1: Create and Edit Question
1. Click "Add Question"
2. Verify question appears in outline
3. Edit question text
4. Click outside the text field
5. Refresh the page
6. Verify changes are persisted ✓

### Test 2: Add Options
1. Select an MCQ question
2. Click "Add option"
3. Type option text
4. Click outside
5. Refresh the page
6. Verify option is saved ✓

### Test 3: Change Correct Answer
1. Select an MCQ question
2. Click a different correct answer radio/checkbox
3. Refresh the page
4. Verify correct answer is saved ✓

### Test 4: Reorder Questions
1. Click up/down buttons on a question
2. Refresh the page
3. Verify new order is saved ✓

### Test 5: Delete Question
1. Click delete on a question
2. Confirm deletion
3. Refresh the page
4. Verify question is deleted ✓

## Summary

**Questions are saved automatically as you edit them.** There's no need to click a "Save Question" button. The only manual save required is for the assignment metadata (title, description, due date, max score) using the "Save" button in the header.

This provides a seamless, Google Forms-like editing experience where you can focus on creating content without worrying about saving.
