# Auto Distribute Points Feature - Implementation Complete

## Overview
Implemented an "Auto distribute points" feature for Assignment Questions Builder that automatically adjusts question points to match the assignment's maxScore while preserving relative weights.

## Feature Highlights

### Points Summary Display
- Shows Max Score (manual value from assignment)
- Shows Total Question Points (computed sum)
- Shows Difference (maxScore - sum)
- Visual status indicator:
  - ✅ Green checkmark when points match
  - ⚠️ Orange warning when points mismatch

### Auto Distribute Button
- Appears only when:
  - Assignment has at least 1 question
  - maxScore is a valid number >= 0
  - Term is not closed (respects termStatus)
- Disabled when term is closed (read-only mode)

### Distribution Algorithm
Located in `src/utils/scoring/distributePoints.ts`:

**Case 1: All questions have 0 points**
- Distributes evenly: `base = floor(maxScore / n)`
- Remainder distributed to first questions

**Case 2: Questions have existing points**
- Scales proportionally: `newPoints[i] = oldPoints[i] * (maxScore / sumOld)`
- Uses floor + remainder distribution
- Preserves relative weights
- Ensures exact sum match

**Rounding Strategy:**
1. Calculate float values
2. Floor each value
3. Calculate remainder = maxScore - sum(floors)
4. Distribute +1 to questions with largest fractional parts
5. Stable tie-breaker by question order

### Validation & Publish Rules
- Before publish: blocks if sum(points) != maxScore
- Shows inline error: "Question points must sum to max score."
- Auto distribute button is the primary CTA to fix mismatch

## Files Created

### 1. Core Algorithm
**`src/utils/scoring/distributePoints.ts`**
- Pure utility function with no dependencies
- Deterministic and well-typed
- Handles edge cases (0 maxScore, 0 questions, etc.)

### 2. UI Components
**`src/components/features/academics/components/curriculum/AssignmentQuestionsBuilder.tsx`**
- Main questions builder component
- Points summary header with status
- Auto distribute button + confirmation dialog
- Questions list with CRUD operations
- Optimistic UI updates with rollback on error

**`src/components/features/academics/components/curriculum/QuestionDialog.tsx`**
- Modal for creating/editing questions
- Bilingual text fields (AR/EN) with validation
- Question type selector
- Points input field

### 3. API Service Updates
**`src/services/academics/curriculumService.ts`**
- Added `AssignmentQuestion` interface
- Added CRUD functions for questions:
  - `fetchAssignmentQuestions()`
  - `createAssignmentQuestion()`
  - `updateAssignmentQuestion()`
  - `deleteAssignmentQuestion()`
  - `reorderAssignmentQuestions()`
- Added `bulkUpdateQuestionPoints()` for auto-distribute

### 4. Integration
**`src/components/features/academics/components/curriculum/LessonAssignments.tsx`**
- Integrated AssignmentQuestionsBuilder into expanded assignment view
- Questions appear before attachments section

## Translations Added

### English (`src/messages/en.json`)
```json
{
  "curriculum": {
    "questions": {
      "title": "Questions",
      "add_question": "Add Question",
      "edit_question": "Edit Question",
      "points": "Points",
      "summary_title": "Points Summary",
      "max_score": "Max Score",
      "total_points": "Total Question Points",
      "difference": "Difference",
      "points_match": "Points match",
      "points_mismatch": "Points mismatch",
      "auto_distribute": "Auto distribute points",
      "confirm_auto_distribute_title": "Auto distribute points?",
      "confirm_auto_distribute_body": "This will update points of all questions to match max score.",
      "points_sum_mismatch": "Question points must sum to max score."
    }
  },
  "success": {
    "pointsUpdated": "Points updated successfully"
  },
  "errors": {
    "pointsUpdateFailed": "Failed to update points"
  }
}
```

### Arabic (`src/messages/ar.json`)
```json
{
  "curriculum": {
    "questions": {
      "title": "الأسئلة",
      "add_question": "إضافة سؤال",
      "edit_question": "تعديل السؤال",
      "points": "الدرجات",
      "summary_title": "ملخص الدرجات",
      "max_score": "الدرجة النهائية",
      "total_points": "مجموع درجات الأسئلة",
      "difference": "الفرق",
      "points_match": "الدرجات متطابقة",
      "points_mismatch": "الدرجات غير متطابقة",
      "auto_distribute": "توزيع الدرجات تلقائيًا",
      "confirm_auto_distribute_title": "توزيع الدرجات تلقائيًا؟",
      "confirm_auto_distribute_body": "سيتم تعديل درجات جميع الأسئلة لتطابق الدرجة النهائية.",
      "points_sum_mismatch": "يجب أن يساوي مجموع درجات الأسئلة الدرجة النهائية."
    }
  }
}
```

## How to Use

### 1. Navigate to Assignment
1. Go to Academics → Curriculum
2. Select a lesson
3. Go to Learning Content tab → Assignments tab
4. Expand an assignment

### 2. Add Questions
1. Click "Add Question" button
2. Enter question text in both Arabic and English
3. Select question type (Multiple Choice, True/False, etc.)
4. Enter points for the question
5. Click Save

### 3. View Points Summary
The summary header shows:
- Max Score: 10 (from assignment)
- Total Question Points: 7 (sum of all questions)
- Difference: +3 (mismatch)
- Status: ⚠️ Points mismatch

### 4. Auto Distribute Points
1. Click "Auto distribute points" button
2. Confirm in dialog
3. Points are automatically adjusted:
   - If questions have points: scaled proportionally
   - If all zero: distributed evenly
4. Success message appears
5. Summary now shows: ✅ Points match

### 5. Publish Validation
- If points don't match maxScore, publish is blocked
- Error message: "Question points must sum to max score."
- Use auto distribute to fix

## Algorithm Examples

### Example 1: Even Distribution
```
maxScore = 10
questions = [
  { id: "q1", points: 0, order: 1 },
  { id: "q2", points: 0, order: 2 }
]
Result: [
  { id: "q1", points: 5 },
  { id: "q2", points: 5 }
]
```

### Example 2: Proportional Scaling
```
maxScore = 10
questions = [
  { id: "q1", points: 1, order: 1 },
  { id: "q2", points: 2, order: 2 },
  { id: "q3", points: 3, order: 3 }
]
Sum = 6
Floats: [1.67, 3.33, 5.00]
Floors: [1, 3, 5]
Floor sum = 9, remainder = 1
Result: [
  { id: "q1", points: 2 },  // +1 (largest fractional: 0.67)
  { id: "q2", points: 3 },
  { id: "q3", points: 5 }
]
```

### Example 3: Uneven Distribution
```
maxScore = 5
questions = [
  { id: "q1", points: 0, order: 1 },
  { id: "q2", points: 0, order: 2 }
]
base = 2, remainder = 1
Result: [
  { id: "q1", points: 3 },  // base + 1
  { id: "q2", points: 2 }   // base
]
```

## Read-Only Behavior (Term Closed)

When `termStatus === "Closed"`:
- ✅ Can view questions and points summary
- ❌ Cannot add/edit/delete questions
- ❌ Cannot use auto distribute
- ❌ All edit buttons disabled

## Error Handling

### Optimistic Updates with Rollback
1. User clicks auto distribute
2. UI updates immediately (optimistic)
3. API call made in background
4. On success: show success message
5. On failure:
   - Rollback to original points
   - Show error message
   - User can try again

### Validation Errors
- Question text required in both languages
- AR != EN validation enforced
- Points must be >= 0
- All validation messages in both languages

## Testing Checklist

- [ ] Add questions with various point values
- [ ] Verify points summary calculates correctly
- [ ] Click auto distribute with even distribution (all 0)
- [ ] Click auto distribute with proportional scaling
- [ ] Verify sum equals maxScore after distribution
- [ ] Test with maxScore = 0 (all points become 0)
- [ ] Test with 1 question
- [ ] Test with many questions (10+)
- [ ] Test read-only mode (term closed)
- [ ] Test error handling (simulate API failure)
- [ ] Test bilingual UI (switch to Arabic)
- [ ] Verify publish validation blocks mismatch

## Technical Notes

- No new dependencies added
- Uses existing shared components (ConfirmDialog, Button, Modal)
- Follows existing patterns (bilingual validation, term status gating)
- Mock API uses localStorage (replace with real API endpoints)
- Algorithm is deterministic and testable
- Optimistic UI updates for better UX
- Proper error handling with rollback

## Future Enhancements

If needed in the future:
- Add question reordering (drag & drop)
- Add question options editor for multiple choice
- Add correct answer marking
- Add question bank/templates
- Add bulk import from file
- Add question preview mode
- Add analytics on question difficulty
