# Auto Distribute Points - Visual Guide

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Assignment: Homework 1                                      │
│ Due: Dec 25, 2024 | Max Score: 10                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Points Summary                                      │   │
│ │                                                     │   │
│ │ Max Score        Total Points      Difference      │   │
│ │    10               7                 +3           │   │
│ │                                                     │   │
│ │ ⚠️ Points mismatch    [Auto distribute points]    │   │
│ │                                                     │   │
│ │ ⚠️ Question points must sum to max score.         │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Questions                              [+ Add Question]    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Q1  Multiple Choice                    2 Points  ⋮  │   │
│ │ What is 2 + 2?                                      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Q2  True/False                         3 Points  ⋮  │   │
│ │ The sky is blue.                                    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Q3  Essay                              2 Points  ⋮  │   │
│ │ Explain photosynthesis.                             │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Attachments                                                 │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

## State: Points Match ✅

```
┌─────────────────────────────────────────────────────────────┐
│ Points Summary                                              │
│                                                             │
│ Max Score        Total Points      Difference              │
│    10               10                 0                    │
│                                                             │
│ ✅ Points match                                            │
└─────────────────────────────────────────────────────────────┘
```

## State: Points Mismatch ⚠️

```
┌─────────────────────────────────────────────────────────────┐
│ Points Summary                                              │
│                                                             │
│ Max Score        Total Points      Difference              │
│    10               7                 +3                    │
│                                                             │
│ ⚠️ Points mismatch    [⚡ Auto distribute points]          │
│                                                             │
│ ⚠️ Question points must sum to max score.                 │
└─────────────────────────────────────────────────────────────┘
```

## Confirmation Dialog

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Auto distribute points?                                    │
│                                                             │
│  This will update points of all questions to match         │
│  max score.                                                 │
│                                                             │
│                    [Cancel]  [Auto distribute points]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Add/Edit Question Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  Add Question                                          [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Question Text *                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ (عربي)                                              │   │
│  │ ما هو 2 + 2؟                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ (English)                                           │   │
│  │ What is 2 + 2?                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Question Type *                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Multiple Choice                              ▼      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Points *                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Cancel]  [Save]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## User Flow

### Scenario 1: Starting Fresh (All 0 Points)

**Step 1: Add Questions**
```
Q1: 0 points
Q2: 0 points
Q3: 0 points
Total: 0 | Max: 10 | Diff: +10 ⚠️
```

**Step 2: Click Auto Distribute**
```
Algorithm: Even distribution
10 ÷ 3 = 3 remainder 1
Result: [4, 3, 3]
```

**Step 3: After Distribution**
```
Q1: 4 points
Q2: 3 points
Q3: 3 points
Total: 10 | Max: 10 | Diff: 0 ✅
```

### Scenario 2: Adjusting Existing Points

**Step 1: Current State**
```
Q1: 1 point  (weight: 16.7%)
Q2: 2 points (weight: 33.3%)
Q3: 3 points (weight: 50.0%)
Total: 6 | Max: 10 | Diff: +4 ⚠️
```

**Step 2: Click Auto Distribute**
```
Algorithm: Proportional scaling
Q1: 1 × (10/6) = 1.67 → floor(1.67) = 1
Q2: 2 × (10/6) = 3.33 → floor(3.33) = 3
Q3: 3 × (10/6) = 5.00 → floor(5.00) = 5
Floor sum: 9, remainder: 1
Largest fractional: Q1 (0.67)
Result: [2, 3, 5]
```

**Step 3: After Distribution**
```
Q1: 2 points  (weight: 20%)
Q2: 3 points  (weight: 30%)
Q3: 5 points  (weight: 50%)
Total: 10 | Max: 10 | Diff: 0 ✅
```

### Scenario 3: Read-Only Mode (Term Closed)

```
┌─────────────────────────────────────────────────────────────┐
│ Points Summary                                              │
│                                                             │
│ Max Score        Total Points      Difference              │
│    10               7                 +3                    │
│                                                             │
│ ⚠️ Points mismatch    [Auto distribute points] (disabled)  │
│                                                             │
│ ⚠️ Question points must sum to max score.                 │
└─────────────────────────────────────────────────────────────┘

Questions                              [+ Add Question] (disabled)

All edit/delete buttons disabled
```

## Color Coding

- **Green (✅)**: Points match - everything is good
- **Orange (⚠️)**: Points mismatch - action needed
- **Blue**: Primary action button (Auto distribute)
- **Gray**: Disabled state (read-only mode)

## Icons Used

- ✅ `CheckCircle` - Points match
- ⚠️ `AlertCircle` - Points mismatch / warning
- ⚡ `Zap` - Auto distribute action
- ➕ `Plus` - Add question
- ⋮ `MoreVertical` - Question menu
- ✏️ `Edit2` - Edit question
- 🗑️ `Trash2` - Delete question

## Responsive Behavior

### Desktop (>768px)
- Summary grid: 3 columns (Max Score | Total | Difference)
- Questions: Full width cards
- Buttons: Full labels

### Mobile (<768px)
- Summary grid: Stacks vertically
- Questions: Compact cards
- Buttons: Icon only or shortened labels

## Accessibility

- All buttons have proper labels
- Color is not the only indicator (icons + text)
- Keyboard navigation supported
- Screen reader friendly
- Focus states visible
- Confirmation dialogs prevent accidental actions

## Animation & Feedback

1. **Button Click**: Ripple effect
2. **Dialog Open**: Fade in + scale
3. **Success**: Green snackbar (3s)
4. **Error**: Red snackbar (3s)
5. **Loading**: Button shows spinner
6. **Optimistic Update**: Immediate UI change
7. **Rollback**: Smooth transition back on error
