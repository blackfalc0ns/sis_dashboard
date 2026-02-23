# TRUE_FALSE and SHORT_ANSWER Testing Guide

## Quick Test Steps

### Test 1: TRUE_FALSE Question - Basic Creation
1. Navigate to Academics → Curriculum → Select a lesson
2. Go to Learning Content → Assignments tab
3. Create or edit an assignment
4. Click "Add Question"
5. Select question type: "True/False"
6. Enter question text:
   - Arabic: "الأرض كروية الشكل"
   - English: "The Earth is round"
7. Set points: 2
8. Select correct answer: **True**
9. Click Save
10. ✅ Verify question appears in list with "True/False" type

### Test 2: TRUE_FALSE Question - False Answer
1. Add another TRUE_FALSE question
2. Enter question text:
   - Arabic: "الشمس تدور حول الأرض"
   - English: "The Sun revolves around the Earth"
3. Set points: 2
4. Select correct answer: **False**
5. Click Save
6. ✅ Verify question saved with False as correct answer

### Test 3: SHORT_ANSWER Question - No Sample Answer
1. Click "Add Question"
2. Select question type: "Short Answer"
3. Enter question text:
   - Arabic: "ما هي عاصمة المملكة العربية السعودية؟"
   - English: "What is the capital of Saudi Arabia?"
4. Set points: 5
5. Leave sample answer fields empty
6. ✅ Verify blue banner shows: "This question requires manual grading."
7. Click Save
8. ✅ Verify question saved without sample answer

### Test 4: SHORT_ANSWER Question - With Sample Answer
1. Add another SHORT_ANSWER question
2. Enter question text:
   - Arabic: "اشرح دورة الماء في الطبيعة"
   - English: "Explain the water cycle in nature"
3. Set points: 10
4. Enter sample answer:
   - Arabic: "دورة الماء تشمل التبخر والتكثف والهطول"
   - English: "The water cycle includes evaporation, condensation, and precipitation"
5. Click Save
6. ✅ Verify question saved with sample answers

### Test 5: Validation - Identical Sample Answers
1. Add SHORT_ANSWER question
2. Enter question text (bilingual, different)
3. Enter sample answer:
   - Arabic: "Same answer"
   - English: "Same answer"
4. Try to save
5. ✅ Verify error appears: "يجب أن يكون النص بالعربي مختلفاً عن النص بالإنجليزي"
6. Fix by making answers different
7. ✅ Verify saves successfully

### Test 6: Type Switching - MCQ to TRUE_FALSE
1. Add MCQ_SINGLE question with 3 options
2. Change type to "True/False"
3. ✅ Verify options disappear
4. ✅ Verify True/False radio buttons appear
5. ✅ Verify True is selected by default
6. Save and verify

### Test 7: Type Switching - SHORT_ANSWER to MCQ
1. Add SHORT_ANSWER question with sample answers
2. Change type to "Multiple choice (single answer)"
3. ✅ Verify sample answer fields disappear
4. ✅ Verify 2 empty options appear
5. Complete the MCQ setup and save

### Test 8: Edit Existing TRUE_FALSE Question
1. Click edit on a TRUE_FALSE question
2. ✅ Verify correct answer is pre-selected (True or False)
3. Change the correct answer
4. Update question text
5. Save
6. ✅ Verify changes persisted

### Test 9: Edit Existing SHORT_ANSWER Question
1. Click edit on a SHORT_ANSWER question with sample answer
2. ✅ Verify sample answers are loaded in textareas
3. Modify sample answers
4. Save
5. ✅ Verify changes persisted

### Test 10: Mixed Question Types in Assignment
1. Create an assignment with:
   - 2 MCQ_SINGLE questions (2 points each)
   - 1 MCQ_MULTI question (3 points)
   - 2 TRUE_FALSE questions (2 points each)
   - 1 SHORT_ANSWER question (5 points)
2. Set max score: 16
3. ✅ Verify points summary shows: Total = 16, Difference = 0, ✅ Points match
4. ✅ Verify all question types display correctly in list
5. ✅ Verify auto-distribute works with mixed types

### Test 11: Read-Only Mode (Term Closed)
1. Close the term (if possible in your setup)
2. Open an assignment with TRUE_FALSE and SHORT_ANSWER questions
3. Try to edit a TRUE_FALSE question
4. ✅ Verify radio buttons are disabled
5. Try to edit a SHORT_ANSWER question
6. ✅ Verify textareas are disabled
7. ✅ Verify Save button is disabled

### Test 12: RTL Support
1. Switch to Arabic locale
2. Create SHORT_ANSWER question
3. ✅ Verify Arabic textarea is RTL
4. ✅ Verify English textarea is LTR
5. ✅ Verify labels are right-aligned for Arabic
6. ✅ Verify manual grading hint displays in Arabic

## Expected Results Summary

### TRUE_FALSE Questions
- ✅ Radio buttons for True/False selection
- ✅ Default value is True
- ✅ No validation errors (always has a value)
- ✅ Saves correctAnswer field (boolean)
- ✅ Displays correctly in questions list

### SHORT_ANSWER Questions
- ✅ Blue info banner about manual grading
- ✅ Optional bilingual sample answer textareas
- ✅ 3 rows per textarea
- ✅ AR != EN validation only if both filled
- ✅ Can save without sample answer
- ✅ RTL support for Arabic textarea

### Type Switching
- ✅ MCQ → TRUE_FALSE: Options cleared, True selected
- ✅ TRUE_FALSE → MCQ: Correct answer cleared, 2 options initialized
- ✅ SHORT_ANSWER → MCQ: Sample answers cleared, 2 options initialized
- ✅ MCQ → SHORT_ANSWER: Options cleared, sample answers empty

### Integration
- ✅ Auto-distribute points works with all types
- ✅ Questions list shows all types correctly
- ✅ Reordering works with mixed types
- ✅ Delete works for all types
- ✅ Read-only mode disables all inputs

## Common Issues to Check

1. **TRUE_FALSE not saving:**
   - Check that correctAnswer field is included in save payload
   - Verify backend accepts boolean field

2. **Sample answer validation error when empty:**
   - Ensure validation only runs when both fields are filled
   - Check trim() is applied before checking

3. **Type switching loses data:**
   - This is expected behavior
   - Options cleared when switching away from MCQ
   - Sample answers cleared when switching away from SHORT_ANSWER

4. **RTL not working:**
   - Verify dir="rtl" on Arabic textarea
   - Check text-right class on Arabic labels

5. **Manual grading hint not showing:**
   - Verify translation key exists: "manual_grading_hint"
   - Check question type is exactly "SHORT_ANSWER"

## Browser Testing
Test in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Accessibility Testing
- ✅ Keyboard navigation works for radio buttons
- ✅ Tab order is logical
- ✅ Labels are associated with inputs
- ✅ Error messages are announced
- ✅ Disabled state is clear

## Performance
- ✅ Dialog opens quickly
- ✅ Type switching is instant
- ✅ Save operation completes in < 1 second
- ✅ No console errors or warnings
