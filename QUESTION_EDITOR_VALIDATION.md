# Question Editor Validation Implementation

## Overview
Added validation to the QuestionEditor component to validate question data before saving. The validation provides immediate feedback to users while still allowing draft saves.

## Validation Rules

### Question Text
- At least one language (Arabic or English) must have content
- Shows error if both fields are empty
- Allows partial draft (only one language filled)

### Points
- Must be 0 or greater
- Negative values show error
- Empty/undefined is allowed for draft state

### MCQ Questions (Single/Multiple Choice)
- Minimum 2 options required
- At least one option must have text (Arabic or English)
- For MCQ_SINGLE: Exactly one correct option must be selected
- For MCQ_MULTI: At least one correct option must be selected

### TRUE_FALSE Questions
- No additional validation (correct answer defaults to true)

### SHORT_ANSWER & ESSAY Questions
- Sample answers are optional
- No additional validation required

## Implementation Details

### Local Validation State
Added `localValidationErrors` state to track validation errors that occur during editing:
```typescript
const [localValidationErrors, setLocalValidationErrors] = useState<{
  textAr?: string;
  textEn?: string;
  points?: string;
  options?: string;
  correctAnswer?: string;
}>({});
```

### Validation Function
Created `validateBeforeSave()` function that:
1. Validates all question fields
2. Updates local validation errors for display
3. Returns boolean indicating if save should proceed
4. Allows saves even with validation errors (for draft state)
5. Only blocks save if there's absolutely no content

### Error Display
- Merged prop validation errors (from parent) with local validation errors
- Shows inline error messages below each field
- Uses AlertCircle icon for visual feedback
- Red text color for error messages

### Save Behavior
- Validation runs before every save (debounced and onBlur)
- Draft saves are allowed even with validation errors
- Only blocks save if question is completely empty
- Provides immediate feedback to users

## Translation Keys Added

### English (en.json)
```json
"option_text_required": "At least one option must have text"
```

### Arabic (ar.json)
```json
"option_text_required": "يجب أن يحتوي اختيار واحد على الأقل على نص"
```

## Files Modified

1. `src/components/features/academics/components/curriculum/QuestionEditor.tsx`
   - Added `localValidationErrors` state
   - Created `validateBeforeSave()` function
   - Updated `saveQuestion()` to call validation
   - Merged local and prop validation errors in display
   - Added validation for question text, points, options, and correct answers

2. `src/messages/en.json`
   - Added `option_text_required` translation key

3. `src/messages/ar.json`
   - Added `option_text_required` translation key

## User Experience

### During Editing
- Users see validation errors as they type
- Errors appear inline below the relevant field
- Red text and icon indicate validation issues

### During Save
- Validation runs automatically before save
- Draft saves are allowed (partial data is OK)
- Only completely empty questions are blocked
- Users get immediate feedback on what needs to be fixed

### For Publishing
- Parent component validation (from `validateForPublish`) still applies
- Stricter validation prevents publishing incomplete assignments
- Local validation provides early feedback during editing

## Benefits

1. **Immediate Feedback**: Users see validation errors as they edit
2. **Draft-Friendly**: Allows saving partial/incomplete questions
3. **Clear Guidance**: Specific error messages tell users what's wrong
4. **Prevents Data Loss**: Validation doesn't block auto-save for drafts
5. **Publish Safety**: Stricter validation prevents publishing invalid assignments

## Testing Checklist

### Question Text Validation
- [ ] Empty question text shows error for both languages
- [ ] Filling one language clears that error
- [ ] Can save with only one language filled (draft)

### Points Validation
- [ ] Negative points show error
- [ ] Zero points are allowed
- [ ] Positive points are allowed
- [ ] Can save without points (draft)

### MCQ Validation
- [ ] Less than 2 options shows error
- [ ] Empty options show error
- [ ] MCQ_SINGLE with 0 correct shows error
- [ ] MCQ_SINGLE with 2+ correct shows error
- [ ] MCQ_MULTI with 0 correct shows error
- [ ] Can save partial MCQ (draft)

### Error Display
- [ ] Errors appear inline below fields
- [ ] Errors have red text and icon
- [ ] Errors clear when fixed
- [ ] Multiple errors can show simultaneously

### Save Behavior
- [ ] Validation runs on debounced save
- [ ] Validation runs on blur
- [ ] Draft saves work with validation errors
- [ ] Completely empty questions don't save
- [ ] Valid questions save successfully
