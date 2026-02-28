# Question Answer Validation Implementation

## Overview
Added comprehensive validation for question answers in the Assignment Builder, with real-time inline error display for MCQ options.

## Validation Rules

### MCQ Options (Single & Multiple Choice)
1. **Required Fields**: Both Arabic and English text required for each option
2. **AR ≠ EN**: Arabic and English text must be different
3. **Minimum Options**: At least 2 options required
4. **Correct Answer Selection**:
   - MCQ Single: Exactly one option must be marked correct
   - MCQ Multiple: At least one option must be marked correct

### TRUE/FALSE Questions
- Correct answer must be selected (True or False)

### SHORT_ANSWER & ESSAY Questions
- No answer validation (manual grading)
- Sample answers are optional

## Implementation Details

### 1. Enhanced Validation Logic (`validation.ts`)

#### `validateQuestion` Function
Added validation for:
- Empty option text (AR or EN)
- AR == EN in option text
- Correct answer selection

```typescript
// Validate each option has text
const emptyOptions = question.options.filter(
  (o) => !o.textAr?.trim() || !o.textEn?.trim()
);
if (emptyOptions.length > 0) {
  errors.options = t("all_options_required");
}

// Validate AR != EN for each option
const sameTextOptions = question.options.filter(
  (o) => o.textAr?.trim() && o.textEn?.trim() && 
         o.textAr.trim().toLowerCase() === o.textEn.trim().toLowerCase()
);
if (sameTextOptions.length > 0) {
  errors.options = t("option_ar_en_must_differ");
}
```

#### `validateForPublish` Function
Added same validations for publish-time checks with detailed error messages per question.

### 2. QuestionEditor Component

#### Per-Option Validation
Added `validateOption` function that validates each option individually:

```typescript
const validateOption = (option: QuestionOption): OptionErrors => {
  const errors: OptionErrors = {};
  
  if (!option.textAr?.trim()) {
    errors.ar = tValidation("required_ar");
  }
  
  if (!option.textEn?.trim()) {
    errors.en = tValidation("required_en");
  }
  
  // Check if AR == EN
  if (option.textAr?.trim() && option.textEn?.trim()) {
    if (option.textAr.trim().toLowerCase() === option.textEn.trim().toLowerCase()) {
      errors.ar = tValidation("arEnMustDiffer");
      errors.en = tValidation("arEnMustDiffer");
    }
  }
  
  return errors;
};
```

#### Real-Time Error Display
- Validation runs on every render
- Errors passed to `SortableOptionRow` component
- Inline error messages shown below each input field
- Red border on invalid inputs (handled by Input component)

### 3. Translation Keys

#### English (`en.json`)
```json
{
  "all_options_required": "All options must have both Arabic and English text",
  "option_ar_en_must_differ": "Option Arabic and English text must be different"
}
```

#### Arabic (`ar.json`)
```json
{
  "all_options_required": "يجب أن تحتوي جميع الاختيارات على نص بالعربي والإنجليزي",
  "option_ar_en_must_differ": "يجب أن يكون نص الاختيار بالعربي مختلفاً عن الإنجليزي"
}
```

## User Experience

### Visual Feedback
1. **Input Level**: Red border on invalid input fields
2. **Option Level**: Error message below each invalid input
3. **Question Level**: General error message for options/correct answer issues
4. **Card Level**: Red border on question card in sidebar when validation errors exist
   - Selected with errors: Solid red border (`border-red-500`) with red background
   - Not selected with errors: Light red border (`border-red-300`) with subtle red background
   - Valid questions: Normal gray/primary borders
5. **Assignment Level**: Validation errors prevent publishing

### Validation Timing
- **Real-time**: As user types (visual feedback only)
- **On Save**: Validation runs but doesn't block save (allows drafts)
- **On Publish**: Strict validation blocks publishing if errors exist

### Error Messages
- Clear, actionable messages in both languages
- Specific to the validation rule violated
- Shown inline for immediate feedback

## Files Modified

1. `src/features/academics/assignments/builder/utils/validation.ts`
   - Enhanced `validateQuestion` with option text validation
   - Enhanced `validateForPublish` with option text validation
   - Added AR != EN check for options

2. `src/components/features/academics/components/curriculum/QuestionEditor.tsx`
   - Added `validateOption` function for per-option validation
   - Pass validation errors to `SortableOptionRow`
   - Real-time validation on render

3. `src/features/academics/assignments/builder/components/QuestionOutlineItem.tsx`
   - Enhanced `isValid` function to check all validation rules
   - Added red border styling for cards with validation errors
   - Different border colors for selected/unselected invalid questions
   - Changed border width to `border-2` for better visibility

4. `src/messages/en.json`
   - Added `all_options_required` key
   - Added `option_ar_en_must_differ` key

5. `src/messages/ar.json`
   - Added `all_options_required` key (Arabic)
   - Added `option_ar_en_must_differ` key (Arabic)

## Testing Checklist

### MCQ Single Choice
- [ ] Leave option text empty (AR) - shows "required" error
- [ ] Leave option text empty (EN) - shows "required" error
- [ ] Enter same text in AR and EN - shows "must differ" error
- [ ] Select no correct answer - shows error on publish
- [ ] Select multiple correct answers - shows error on publish
- [ ] Select exactly one correct answer - no errors

### MCQ Multiple Choice
- [ ] Leave option text empty (AR) - shows "required" error
- [ ] Leave option text empty (EN) - shows "required" error
- [ ] Enter same text in AR and EN - shows "must differ" error
- [ ] Select no correct answers - shows error on publish
- [ ] Select one or more correct answers - no errors

### General
- [ ] Add only 1 option - shows "minimum 2 options" error
- [ ] Add 2+ options with valid text - no errors
- [ ] Validation errors shown in real-time as typing
- [ ] Validation errors prevent publishing
- [ ] Can save draft with validation errors
- [ ] Error messages in both AR and EN
- [ ] Question card in sidebar shows red border when has errors
- [ ] Selected question with errors shows solid red border
- [ ] Unselected question with errors shows light red border
- [ ] Valid questions show normal borders (gray or primary)

## Benefits

1. **Better UX**: Immediate feedback prevents user frustration
2. **Data Quality**: Ensures all options have proper bilingual content
3. **Consistency**: AR != EN rule maintains content quality
4. **Clear Guidance**: Specific error messages help users fix issues
5. **Flexible**: Allows saving drafts with errors, strict on publish
6. **Visual Hierarchy**: Red borders on question cards make it easy to spot problems at a glance
7. **Accessibility**: Color-coded validation states with proper ARIA attributes
