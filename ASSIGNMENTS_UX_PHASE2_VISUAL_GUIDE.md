# Assignments UX Phase 2 - Visual Guide

## Before vs After

### BEFORE (Phase 1)
```
┌─────────────────────────────────────────────────┐
│ Summary Bar: Max 100 | Total 95 | Diff -5     │
├─────────────────────────────────────────────────┤
│ [+ Add Question]                                │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐   │
│ │ Q1 | MCQ_SINGLE | 10 pts          [⋮]  │   │
│ │ What is 2+2?                            │   │
│ │ A. 3  B. 4 ✓  C. 5  D. 6               │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Q2 | TRUE_FALSE | 5 pts           [⋮]  │   │
│ │ The sky is blue                         │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

[Modal Dialog opens on top - blocks view]
```

### AFTER (Phase 2)
```
┌─────────────────────────────────┬───────────────────────────┐
│ Summary Bar: Max 100 | Total 95│ │ Edit Question           X │
├─────────────────────────────────┤ ├───────────────────────────┤
│ [+ Add Question]                │ │ Question Text (AR)        │
├─────────────────────────────────┤ │ ┌───────────────────────┐ │
│ ┌─────────────────────────────┐ │ │ │ ما هو 2+2؟           │ │
│ │ ① MCQ_SINGLE  10 pts  ✓    │ │ │ └───────────────────────┘ │
│ │ What is 2+2?                │ │ │                           │
│ │ Ⓐ 3  Ⓑ 4 ✓  Ⓒ 5           │ │ │ Question Text (EN)        │
│ │ +1 more options             │ │ │ ┌───────────────────────┐ │
│ └─────────────────────────────┘ │ │ │ What is 2+2?         │ │
│     ↑ Click to edit             │ │ └───────────────────────┘ │
│ ┌─────────────────────────────┐ │ │                           │
│ │ ② TRUE_FALSE  5 pts  ⚠     │ │ │ Question Type             │
│ │ The sky is blue             │ │ │ [MCQ_SINGLE ▼]           │
│ │ Correct: True               │ │ │                           │
│ └─────────────────────────────┘ │ │ Points: [10]             │
│                                 │ │                           │
│ [Empty space for more]          │ │ Options:                  │
│                                 │ │ ☑ Ⓐ [3]                  │
│                                 │ │ ☑ Ⓑ [4] ← Correct        │
│                                 │ │ ☐ Ⓒ [5]                  │
│                                 │ │ [+ Add Option]           │
│                                 │ │                           │
│                                 │ ├───────────────────────────┤
│                                 │ │ [Cancel]  [Save]         │
└─────────────────────────────────┘ └───────────────────────────┘
    Question List (visible)           Drawer (slides in)
```

## Question Card Anatomy

### Enhanced Card Design
```
┌─────────────────────────────────────────────────────────┐
│  ①  MCQ_SINGLE   10 pts   ✓ Configured          [⋮]   │ ← Header
│                                                          │
│  What is the capital of France?                         │ ← Question
│                                                          │
│  Ⓐ Paris ✓                                              │ ← Options
│  Ⓑ London                                               │   Preview
│  Ⓒ Berlin                                               │
│  +2 more options                                        │
└─────────────────────────────────────────────────────────┘
   ↑ Hover: border → primary, shadow appears, menu visible
```

### Status Badges

**Configured (Green)**
```
✓ Configured
```
- MCQ has at least one correct answer selected
- TRUE_FALSE has answer set
- Shows question is ready

**Needs Correct Answer (Amber)**
```
⚠ Needs correct answer
```
- MCQ has no correct answer selected
- Question needs configuration

## Drawer Layout

### Header (Sticky)
```
┌─────────────────────────────────────────────────┐
│  Edit Question                              [X] │
└─────────────────────────────────────────────────┘
```

### Content (Scrollable)
```
┌─────────────────────────────────────────────────┐
│                                                  │
│  Question Text (AR) *                           │
│  ┌────────────────────────────────────────────┐ │
│  │ أدخل نص السؤال بالعربية                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Question Text (EN) *                           │
│  ┌────────────────────────────────────────────┐ │
│  │ Enter question text in English             │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Question Type *                                │
│  [Multiple choice (single answer)        ▼]    │
│                                                  │
│  Points *                                       │
│  [10]                                           │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  Answers *                                      │
│                                                  │
│  Options                    [+ Add Option]      │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ ≡ ○ [Option AR]                      ↑ ↓ ✕│ │
│  │     [Option EN]                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ ≡ ● [Option AR]                      ↑ ↓ ✕│ │
│  │     [Option EN]                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [Scrollable content...]                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Footer (Sticky)
```
┌─────────────────────────────────────────────────┐
│                          [Cancel]  [Save]       │
└─────────────────────────────────────────────────┘
```

## Interaction Patterns

### 1. Add Question Flow
```
User clicks [+ Add Question]
         ↓
Drawer slides in from right (empty form)
         ↓
User fills question details
         ↓
User clicks [Save]
         ↓
Drawer slides out
         ↓
New question card appears in list
```

### 2. Edit Question Flow
```
User clicks on question card
         ↓
Drawer slides in with pre-filled data
         ↓
User modifies fields
         ↓
User clicks [Save]
         ↓
Drawer slides out
         ↓
Question card updates
```

### 3. Delete Question Flow
```
User hovers over card → [⋮] appears
         ↓
User clicks [⋮] → menu opens
         ↓
User clicks "Delete question"
         ↓
Confirmation dialog appears
         ↓
User confirms
         ↓
Card removed from list
```

## Responsive Behavior

### Desktop (≥ 960px)
- Drawer width: 700px
- Opens from right (left in RTL)
- Question list remains visible
- Hover effects active

### Tablet (600-959px)
- Drawer width: 600px
- Same behavior as desktop
- Touch-friendly targets

### Mobile (< 600px)
- Drawer width: 100%
- Full-screen overlay
- Touch-optimized
- Larger tap targets

## Color Coding

### Question Number Badge
- Background: `primary/10` (light primary)
- Text: `primary` (main primary)
- Shape: Circle

### Question Type Chip
- Background: `gray-100`
- Text: `gray-700`
- Shape: Rounded pill

### Points Display
- Text: `primary` (bold)

### Status Badges
- Configured: `green-100` bg, `green-700` text
- Needs Correct: `amber-100` bg, `amber-700` text

### Option Badges
- Correct: `green-100` bg, `green-700` text, `green-300` ring
- Incorrect: `gray-100` bg, `gray-600` text

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Enter to open drawer
- Escape to close drawer
- Arrow keys in option list

### Screen Readers
- Proper ARIA labels
- Status announcements
- Form field descriptions
- Error messages read aloud

### Focus Management
- Focus moves to drawer on open
- Focus returns to trigger on close
- Visible focus indicators
- Logical tab order
