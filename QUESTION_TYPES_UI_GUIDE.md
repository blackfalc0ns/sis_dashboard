# Question Types UI Guide

## Visual Reference for All Question Types

### Common Fields (All Types)
```
┌─────────────────────────────────────────────────────────┐
│ Add Question / Edit Question                      [X]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Question Text (عربي) *                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ أدخل نص السؤال بالعربية                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Question Text (English) *                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Enter question text in English                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Question Type *                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Select type ▼]                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Points *                                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1                                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [TYPE-SPECIFIC CONTENT BELOW]                           │
```

---

## 1. MCQ_SINGLE (Multiple Choice - Single Answer)

```
┌─────────────────────────────────────────────────────────┐
│ Answers *                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Options                              [+ Add option]     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ≡  ○  ┌───────────────────────────────┐  ↑ ↓  🗑   │ │
│ │       │ الخيار الأول (عربي)          │             │ │
│ │       └───────────────────────────────┘             │ │
│ │       ┌───────────────────────────────┐             │ │
│ │       │ First option (English)        │             │ │
│ │       └───────────────────────────────┘             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ≡  ●  ┌───────────────────────────────┐  ↑ ↓  🗑   │ │
│ │       │ الخيار الثاني (عربي)         │             │ │
│ │       └───────────────────────────────┘             │ │
│ │       ┌───────────────────────────────┐             │ │
│ │       │ Second option (English)       │             │ │
│ │       └───────────────────────────────┘             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ℹ Correct answer: Select exactly one correct option.   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save]           │
└─────────────────────────────────────────────────────────┘

Legend:
≡  = Drag handle
○  = Radio button (unselected)
●  = Radio button (selected)
↑↓ = Move up/down buttons
🗑  = Delete button
```

---

## 2. MCQ_MULTI (Multiple Choice - Multiple Answers)

```
┌─────────────────────────────────────────────────────────┐
│ Answers *                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Options                              [+ Add option]     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ≡  ☑  ┌───────────────────────────────┐  ↑ ↓  🗑   │ │
│ │       │ الخيار الأول (عربي)          │             │ │
│ │       └───────────────────────────────┘             │ │
│ │       ┌───────────────────────────────┐             │ │
│ │       │ First option (English)        │             │ │
│ │       └───────────────────────────────┘             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ≡  ☑  ┌───────────────────────────────┐  ↑ ↓  🗑   │ │
│ │       │ الخيار الثاني (عربي)         │             │ │
│ │       └───────────────────────────────┘             │ │
│ │       ┌───────────────────────────────┐             │ │
│ │       │ Second option (English)       │             │ │
│ │       └───────────────────────────────┘             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ≡  ☐  ┌───────────────────────────────┐  ↑ ↓  🗑   │ │
│ │       │ الخيار الثالث (عربي)         │             │ │
│ │       └───────────────────────────────┘             │ │
│ │       ┌───────────────────────────────┐             │ │
│ │       │ Third option (English)        │             │ │
│ │       └───────────────────────────────┘             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ℹ Correct answer: Select at least one correct option.  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save]           │
└─────────────────────────────────────────────────────────┘

Legend:
☑  = Checkbox (checked)
☐  = Checkbox (unchecked)
```

---

## 3. TRUE_FALSE

```
┌─────────────────────────────────────────────────────────┐
│ Answers *                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Correct answer                                          │
│                                                         │
│  ●  True          ○  False                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save]           │
└─────────────────────────────────────────────────────────┘

Features:
- Simple radio button selection
- Two options: True or False
- Default: True is selected
- No additional configuration needed
- Clean, minimal interface
```

---

## 4. SHORT_ANSWER

```
┌─────────────────────────────────────────────────────────┐
│ Answers *                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ℹ This question requires manual grading.           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Sample answer (optional)                                │
│                                                         │
│ Sample answer (optional) (عربي)                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ إجابة نموذجية (اختياري)                            │ │
│ │                                                     │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Sample answer (optional) (English)                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Sample answer (optional)                            │ │
│ │                                                     │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save]           │
└─────────────────────────────────────────────────────────┘

Features:
- Blue info banner about manual grading
- Optional bilingual sample answer
- 3 rows per textarea
- RTL support for Arabic
- Can save without sample answer
- AR != EN validation only if both filled
```

---

## Question Type Dropdown

```
┌─────────────────────────────────────────────────────────┐
│ Question Type *                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Multiple choice (single answer)              ▼     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Multiple choice (single answer)                    │ │
│ │ Multiple choice (multiple answers)                 │ │
│ │ True/False                                         │ │
│ │ Short Answer                                       │ │
│ │ Essay                                              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Questions List View

```
┌─────────────────────────────────────────────────────────────────┐
│ Questions (5)                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. What is the capital of Saudi Arabia?                    │ │
│ │    Type: Multiple choice (single answer)  |  Points: 2     │ │
│ │    Options: A) Riyadh ✓  B) Jeddah  C) Dammam  D) Mecca   │ │
│ │                                          [Edit]  [Delete]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 2. Select all renewable energy sources                     │ │
│ │    Type: Multiple choice (multiple answers)  |  Points: 3  │ │
│ │    Options: A) Solar ✓  B) Wind ✓  C) Coal  D) Hydro ✓   │ │
│ │                                          [Edit]  [Delete]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 3. The Earth is round                                      │ │
│ │    Type: True/False  |  Points: 2                          │ │
│ │    Correct Answer: True                                    │ │
│ │                                          [Edit]  [Delete]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 4. Explain the water cycle in nature                       │ │
│ │    Type: Short Answer  |  Points: 10                       │ │
│ │    Manual grading required                                 │ │
│ │                                          [Edit]  [Delete]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 5. The Sun revolves around the Earth                       │ │
│ │    Type: True/False  |  Points: 2                          │ │
│ │    Correct Answer: False                                   │ │
│ │                                          [Edit]  [Delete]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                              [+ Add Question]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Points Summary (with mixed types)

```
┌─────────────────────────────────────────────────────────┐
│ Points Summary                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Max Score:           19 points                         │
│  Total Question Points: 19 points                       │
│  Difference:          0 points                          │
│                                                         │
│  Status: ✅ Points match                                │
│                                                         │
│  [Auto distribute points]  (disabled when matched)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Read-Only Mode (Term Closed)

```
┌─────────────────────────────────────────────────────────┐
│ Edit Question                                      [X]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Question Text (عربي) *                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ الأرض كروية الشكل                    [DISABLED]    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Question Text (English) *                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ The Earth is round                   [DISABLED]    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Question Type *                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ True/False                           [DISABLED]    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Points *                                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2                                    [DISABLED]    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Answers *                                               │
│ Correct answer                                          │
│  ●  True  [DISABLED]    ○  False  [DISABLED]            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    [Cancel]  [Save - DISABLED]          │
└─────────────────────────────────────────────────────────┘

Features:
- All inputs grayed out and disabled
- Radio buttons/checkboxes disabled
- Drag handles hidden
- Add/Remove buttons hidden
- Save button disabled
- UI remains viewable for reference
```

---

## Mobile View (Responsive)

```
┌───────────────────────────┐
│ Add Question         [X]  │
├───────────────────────────┤
│                           │
│ Question Text (عربي) *    │
│ ┌───────────────────────┐ │
│ │ أدخل نص السؤال       │ │
│ └───────────────────────┘ │
│                           │
│ Question Text (English) * │
│ ┌───────────────────────┐ │
│ │ Enter question text  │ │
│ └───────────────────────┘ │
│                           │
│ Question Type *           │
│ ┌───────────────────────┐ │
│ │ True/False        ▼  │ │
│ └───────────────────────┘ │
│                           │
│ Points *                  │
│ ┌───────────────────────┐ │
│ │ 2                    │ │
│ └───────────────────────┘ │
│                           │
│ Answers *                 │
│ Correct answer            │
│                           │
│  ●  True                  │
│  ○  False                 │
│                           │
├───────────────────────────┤
│ [Cancel]        [Save]    │
└───────────────────────────┘

Features:
- Stacked layout
- Touch-friendly buttons
- Scrollable content
- No horizontal scroll
- Up/Down buttons visible
```

---

## Color Coding

### Status Colors
- ✅ Green: Success, points match, correct answer
- ⚠️ Orange: Warning, points mismatch
- ❌ Red: Error, validation failed
- ℹ️ Blue: Information, hints

### UI Elements
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)
- Info: Blue (#3B82F6)
- Disabled: Gray (#9CA3AF)

---

## Accessibility Features

### Keyboard Navigation
- Tab: Move between fields
- Arrow keys: Navigate radio buttons
- Space: Toggle checkboxes
- Enter: Submit form
- Escape: Close dialog

### Screen Reader Support
- Labels associated with inputs
- Error messages announced
- Button purposes clear
- Disabled states indicated

### Visual Indicators
- Focus ring on active element
- Error border (red) + icon
- Disabled opacity (60%)
- Required asterisk (*)

---

## Summary

Each question type has a distinct, purpose-built interface:
- **MCQ**: Rich options editor with drag-and-drop
- **TRUE_FALSE**: Simple radio button selection
- **SHORT_ANSWER**: Optional sample answer with hint

All types share:
- Consistent header (question text, type, points)
- Bilingual support
- RTL compatibility
- Validation feedback
- Read-only mode
- Mobile responsiveness
