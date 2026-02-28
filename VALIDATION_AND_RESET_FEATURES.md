# Validation and Reset Features

## Comprehensive Validation System

### Save Button Validation

Before saving, the system validates:

#### 1. Assignment Title
- ✅ Arabic title is required
- ✅ English title is required
- ✅ Arabic and English must be different

#### 2. Assignment Description
- ✅ If both Arabic and English are filled, they must be different

#### 3. Max Score
- ✅ Must be greater than 0
- ✅ Cannot be negative

#### 4. Questions
- ✅ At least one question is required
- ✅ Each question must have Arabic and English text
- ✅ Points must be 0 or greater

#### 5. MCQ Questions
- ✅ At least 2 options required
- ✅ Each option must have Arabic and English text
- ✅ MCQ Single: Exactly 1 correct answer
- ✅ MCQ Multi: At least 1 correct answer

### Publish Button Validation

Before publishing, the system validates everything from Save, plus:

#### Additional Publish Validations
- ✅ Points must match: `sum(question points) === maxScore`
- ✅ All questions must be properly configured
- ✅ All correct answers must be set

### Validation Error Display

Errors are shown in a clear, organized format:

```
Validation failed:

- Arabic is required - Title
- Q1: At least 2 options required
- Q2: Select exactly one correct option.
- Question points must sum to max score.
```

## Reset Button

### Location
- In the "More" menu (three dots icon) in the header
- Next to the Delete button

### What It Does
1. Shows confirmation dialog
2. Reloads assignment from database
3. Reloads all questions
4. Reloads all attachments
5. Clears dirty state
6. Selects first question

### When to Use
- Accidentally made changes you want to discard
- Want to start over from last saved state
- Made errors and want to revert

### Confirmation
```
"Are you sure you want to reset this assignment? 
All unsaved changes will be lost."
```

## Implementation Details

### Save Validation Code

```typescript
const handleSave = async () => {
  if (!assignment) return;

  const validationErrors: string[] = [];

  // 1. Validate title
  if (!assignment.titleAr?.trim()) {
    validationErrors.push(tValidation("required_ar") + " - " + tQuestions("title"));
  }
  if (!assignment.titleEn?.trim()) {
    validationErrors.push(tValidation("required_en") + " - " + tQuestions("title"));
  }

  // 2. Check AR != EN for title
  if (assignment.titleAr?.trim() && assignment.titleEn?.trim()) {
    if (assignment.titleAr.trim().toLowerCase() === assignment.titleEn.trim().toLowerCase()) {
      validationErrors.push(tValidation("arEnMustDiffer") + " - " + tQuestions("title"));
    }
  }

  // 3. Validate max score
  if (!assignment.maxScore || assignment.maxScore < 0) {
    validationErrors.push(tValidation("invalid_max_score"));
  }

  // 4. Validate questions exist
  if (questions.length === 0) {
    validationErrors.push(tValidation("at_least_one_question"));
  }

  // 5. Validate each question
  questions.forEach((q, index) => {
    const qNum = `Q${index + 1}`;
    
    // Question text required
    if (!q.questionTextAr?.trim()) {
      validationErrors.push(`${qNum}: ${tValidation("required_ar")} - ${tQuestions("question_text")}`);
    }
    if (!q.questionTextEn?.trim()) {
      validationErrors.push(`${qNum}: ${tValidation("required_en")} - ${tQuestions("question_text")}`);
    }

    // Points validation
    if (q.points < 0) {
      validationErrors.push(`${qNum}: ${tValidation("invalid_points")}`);
    }

    // MCQ validation
    if (q.questionType === "MCQ_SINGLE" || q.questionType === "MCQ_MULTI") {
      if (!q.options || q.options.length < 2) {
        validationErrors.push(`${qNum}: ${tValidation("minTwoOptions")}`);
      } else {
        // Check each option
        q.options.forEach((opt, optIndex) => {
          if (!opt.textAr?.trim()) {
            validationErrors.push(`${qNum} Option ${optIndex + 1}: ${tValidation("required_ar")}`);
          }
          if (!opt.textEn?.trim()) {
            validationErrors.push(`${qNum} Option ${optIndex + 1}: ${tValidation("required_en")}`);
          }
        });

        // Check correct answers
        const correctCount = q.options.filter(o => o.isCorrect).length;
        if (q.questionType === "MCQ_SINGLE" && correctCount !== 1) {
          validationErrors.push(`${qNum}: ${tValidation("selectCorrectSingle")}`);
        } else if (q.questionType === "MCQ_MULTI" && correctCount < 1) {
          validationErrors.push(`${qNum}: ${tValidation("selectCorrectMulti")}`);
        }
      }
    }
  });

  // Show validation errors
  if (validationErrors.length > 0) {
    alert(tValidation("validation_failed") + ":\n\n" + validationErrors.join("\n"));
    return;
  }

  // Proceed with save...
};
```

### Publish Validation Code

```typescript
const handlePublishToggle = async () => {
  if (!assignment) return;

  if (!assignment.isPublished) {
    const validationErrors: string[] = [];

    // All save validations...
    // Plus:

    // Points must match
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    if ((assignment.maxScore || 0) !== totalPoints) {
      validationErrors.push(tQuestions("points_sum_mismatch"));
    }

    if (validationErrors.length > 0) {
      alert(tValidation("cannot_publish") + ":\n\n" + validationErrors.join("\n"));
      return;
    }
  }

  // Proceed with publish...
};
```

### Reset Code

```typescript
const handleReset = async () => {
  if (!assignment) return;

  if (!confirm(t("confirmReset"))) return;

  try {
    setLoading(true);
    
    // Reload assignment from database
    const stored = localStorage.getItem(`lesson-assignments-${lessonId}`);
    if (stored) {
      const assignments: Assignment[] = JSON.parse(stored);
      const found = assignments.find((a) => a.id === assignmentId);
      if (found) {
        setAssignment(found);
        
        // Reload questions
        const qs = await fetchAssignmentQuestions(assignmentId!);
        setQuestions(qs);
        
        // Select first question if exists
        if (qs.length > 0) {
          setSelectedQuestionId(qs[0].id);
        } else {
          setSelectedQuestionId(null);
        }
        
        // Reload attachments
        const atts = await fetchAssignmentAttachments(assignmentId!);
        setAttachments(atts);
        
        clearDirty();
        alert(tCommon("reset_success") || "Assignment reset successfully!");
      }
    }
    setLoading(false);
  } catch (error) {
    console.error("Failed to reset assignment:", error);
    alert(tCommon("reset_failed") || "Failed to reset assignment. Please try again.");
    setLoading(false);
  }
};
```

## Translation Keys Added

### English
```json
{
  "common": {
    "save_success": "Saved successfully!",
    "reset": "Reset",
    "reset_success": "Reset successfully!",
    "reset_failed": "Failed to reset. Please try again.",
    "publish_success": "Published successfully!",
    "unpublish_success": "Unpublished successfully!",
    "publish_failed": "Failed to change publish status. Please try again.",
    "more": "More"
  },
  "assignmentBuilder": {
    "confirmReset": "Are you sure you want to reset this assignment? All unsaved changes will be lost."
  },
  "validation": {
    "at_least_one_question": "At least one question is required",
    "question_text_required": "Question text is required",
    "invalid_max_score": "Max score must be greater than 0",
    "invalid_points": "Points must be 0 or greater",
    "validation_failed": "Validation failed",
    "cannot_publish": "Cannot publish assignment"
  }
}
```

### Arabic
```json
{
  "common": {
    "save_success": "تم الحفظ بنجاح!",
    "reset": "إعادة تعيين",
    "reset_success": "تمت إعادة التعيين بنجاح!",
    "reset_failed": "فشلت إعادة التعيين. يرجى المحاولة مرة أخرى.",
    "publish_success": "تم النشر بنجاح!",
    "unpublish_success": "تم إلغاء النشر بنجاح!",
    "publish_failed": "فشل تغيير حالة النشر. يرجى المحاولة مرة أخرى.",
    "more": "المزيد"
  },
  "assignmentBuilder": {
    "confirmReset": "هل أنت متأكد من إعادة تعيين هذا الواجب؟ سيتم فقدان جميع التغييرات غير المحفوظة."
  },
  "validation": {
    "at_least_one_question": "مطلوب سؤال واحد على الأقل",
    "question_text_required": "نص السؤال مطلوب",
    "invalid_max_score": "يجب أن تكون الدرجة النهائية أكبر من 0",
    "invalid_points": "يجب أن تكون الدرجات 0 أو أكثر",
    "validation_failed": "فشل التحقق من الصحة",
    "cannot_publish": "لا يمكن نشر الواجب"
  }
}
```

## User Experience

### Save Flow
1. Click "Save" button
2. System validates all fields
3. If errors: Show alert with list of errors
4. If valid: Save and show success message

### Publish Flow
1. Click "Publish" button
2. System validates all fields + points match
3. If errors: Show alert with list of errors
4. If valid: Publish and show success message

### Reset Flow
1. Click "More" menu (three dots)
2. Click "Reset"
3. Confirm in dialog
4. System reloads from database
5. Show success message

## Benefits

### Validation Benefits
- ✅ Prevents incomplete assignments
- ✅ Ensures data quality
- ✅ Clear error messages
- ✅ Guides users to fix issues
- ✅ Prevents publishing invalid assignments

### Reset Benefits
- ✅ Easy way to discard changes
- ✅ No need to refresh page
- ✅ Reloads clean data from database
- ✅ Confirmation prevents accidents
- ✅ Clears dirty state

## Summary

The validation system ensures:
1. All required fields are filled
2. Bilingual content is properly different
3. Questions are properly configured
4. Points add up correctly before publishing

The reset button provides:
1. Quick way to discard unsaved changes
2. Reload from last saved state
3. Clean slate without page refresh
4. Safety confirmation dialog
