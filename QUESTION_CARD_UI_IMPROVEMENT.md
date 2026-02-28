# Question Card UI Improvement

## Overview
Improved the UI of question cards in the assignment builder to make them easier to scan, cleaner, and more professional.

## Changes Made

### 1. New QuestionCard Component
Created `src/components/features/academics/components/curriculum/QuestionCard.tsx` with:

#### Structure
- MUI Paper component with:
  - 1px divider border
  - 14px border radius
  - 12-14px padding
  - White background
  - Hover: subtle tint + shadow
  - Selected: primary tint + primary border

#### Header Row (Compact)
- **Left side (RTL: Right)**: Question chips
  - Question number chip: "Q1" / "س1" (primary background)
  - Question type chip: "Multiple choice" / "اختيار من متعدد" (outlined)
  
- **Right side (RTL: Left)**: Status and actions
  - Points chip: "5 Points" / "5 درجات" (primary background)
  - Status chip:
    - ✅ "Complete" / "مكتمل" (green) if valid
    - ⚠ "Incomplete" / "ناقص" (yellow) if invalid
  - Kebab menu (⋮) with Edit and Delete actions

#### Body
- **Title**: Question text in bold, single line with ellipsis
- **Subtitle** (optional):
  - For MCQ: "Options: X" / "عدد الخيارات: X"
  - For short answer/essay: "Manual grading" / "تصحيح يدوي"

#### Actions Menu
- Edit action with Edit2 icon
- Delete action with Trash2 icon (red)
- Delete opens ConfirmDialog

### 2. Updated AssignmentQuestionsBuilder
Updated `src/components/features/academics/components/curriculum/AssignmentQuestionsBuilder.tsx`:
- Replaced old card implementation with new QuestionCard component
- Removed inline preview of options
- Cleaner, more maintainable code
- Fixed unused import warnings

### 3. Translation Keys Added
Added to both `en.json` and `ar.json`:

```json
{
  "academics.curriculum.questions": {
    "question_label": "Q" / "س",
    "complete": "Complete" / "مكتمل",
    "incomplete": "Incomplete" / "ناقص",
    "options_count": "Options" / "عدد الخيارات",
    "manual_grading": "Manual grading" / "تصحيح يدوي"
  }
}
```

## Features

### Validation Status
- Real-time validation using `validateQuestion` utility
- Visual feedback with status chips
- Green checkmark for complete questions
- Yellow warning for incomplete questions

### RTL Support
- Full RTL layout support
- Proper icon positioning in RTL mode
- Chip icon margins adjusted for RTL

### Responsive Design
- Works on all screen sizes
- Touch-friendly on mobile
- Proper spacing and padding

### Accessibility
- Proper ARIA attributes
- Keyboard navigation support
- Clear visual hierarchy
- High contrast colors

### User Experience
- Click anywhere on card to edit (if not read-only)
- Hover effects for better feedback
- Selected state clearly visible
- Actions menu prevents accidental clicks

## Files Changed
1. `src/components/features/academics/components/curriculum/QuestionCard.tsx` (NEW)
2. `src/components/features/academics/components/curriculum/AssignmentQuestionsBuilder.tsx`
3. `src/messages/en.json`
4. `src/messages/ar.json`

## Testing Checklist
- [x] No TypeScript errors
- [x] No lint warnings
- [ ] Visual appearance matches design
- [ ] RTL layout works correctly
- [ ] Validation status displays correctly
- [ ] Kebab menu works on desktop
- [ ] Kebab menu works on mobile
- [ ] Hover states work
- [ ] Selected states work
- [ ] Edit action opens QuestionDrawer
- [ ] Delete action opens ConfirmDialog
- [ ] Subtitle shows correct text for MCQ
- [ ] Subtitle shows correct text for short answer/essay

## Next Steps
1. Test the component in the browser
2. Verify all states (hover, selected, valid, invalid)
3. Test RTL layout
4. Test on mobile devices
5. Verify accessibility with screen reader
