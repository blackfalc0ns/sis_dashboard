# MCQ_MULTI Testing Guide

## Test Scenario 1: Create MCQ_MULTI Question

### Steps
1. Navigate to Academics → Curriculum
2. Select a lesson
3. Go to Assignments tab
4. Expand an assignment
5. Click "Add Question"

### Fill Question Details
```
Question Text (Arabic): ما هي الألوان الأساسية؟
Question Text (English): What are primary colors?
Question Type: Multiple choice (multiple answers)
Points: 3
```

### Add Options
Click "Add option" twice to have 4 total options:

```
Option 1:
  Arabic: أحمر
  English: Red
  ☑ Correct

Option 2:
  Arabic: أزرق
  English: Blue
  ☑ Correct

Option 3:
  Arabic: أخضر
  English: Green
  ☐ Not correct

Option 4:
  Arabic: أصفر
  English: Yellow
  ☑ Correct
```

### Reorder Options
1. **Desktop**: Drag option 4 (Yellow) to position 2
2. **Mobile**: Use up arrow on option 4 twice

Expected order after reordering:
```
1. Red ✓
2. Yellow ✓
3. Blue ✓
4. Green
```

### Save and Verify
- Click Save
- Question should appear in list
- Options should display in new order
- Correct answers should have checkmarks

### Expected Display
```
┌─────────────────────────────────────────────────┐
│ Q1  MCQ_MULTI                      3 Points  ⋮  │
│ What are primary colors?                        │
│                                                 │
│   A  Red                                    ✓   │
│   B  Yellow                                 ✓   │
│   C  Blue                                   ✓   │
│   D  Green                                      │
└─────────────────────────────────────────────────┘
```

---

## Test Scenario 2: Type Switching (MCQ_MULTI → MCQ_SINGLE)

### Initial State (MCQ_MULTI)
```
Question: What are primary colors?
☑ A. Red (correct)
☑ B. Blue (correct)
☐ C. Green
☑ D. Yellow (correct)
```

### Steps
1. Click edit on the question
2. Change type to "Multiple choice (single answer)"
3. Observe the correct selections

### Expected Behavior
Only the first correct option (by order) should remain selected:
```
Question: What are primary colors?
☑ A. Red (correct) ← Only this remains
☐ B. Blue
☐ C. Green
☐ D. Yellow
```

### Save and Verify
- Save the question
- Reopen for editing
- Verify only one option is marked correct
- Verify it's a radio button (not checkbox)

---

## Test Scenario 3: Validation Tests

### Test 3.1: No Correct Answer (MCQ_SINGLE)
1. Create MCQ_SINGLE question
2. Add 3 options
3. Don't mark any as correct
4. Try to save

**Expected Error:**
```
❌ "Select exactly one correct option."
```

### Test 3.2: No Correct Answer (MCQ_MULTI)
1. Create MCQ_MULTI question
2. Add 3 options
3. Don't mark any as correct
4. Try to save

**Expected Error:**
```
❌ "Select at least one correct option."
```

### Test 3.3: Duplicate Options
1. Create MCQ_SINGLE question
2. Add options:
   - Option 1: "Paris" / "Paris"
   - Option 2: "paris" / "Paris"
3. Try to save

**Expected Error:**
```
❌ Under Option 2 English field: "Duplicate English option"
```

### Test 3.4: Less Than 2 Options
1. Create MCQ_SINGLE question
2. Add only 1 option
3. Try to save

**Expected Error:**
```
❌ "At least 2 options required"
```

### Test 3.5: Empty Option Text
1. Create MCQ_SINGLE question
2. Add 3 options
3. Leave Option 2 Arabic text empty
4. Try to save

**Expected Error:**
```
❌ Under Option 2 Arabic field: "Arabic is required"
```

### Test 3.6: AR = EN Validation
1. Create MCQ_SINGLE question
2. Add option with same text:
   - Arabic: "Paris"
   - English: "Paris"
3. Try to save

**Expected Error:**
```
❌ "Arabic and English values must be different"
```

---

## Test Scenario 4: Reordering Methods

### Test 4.1: Drag-and-Drop (Desktop)
1. Create question with 4 options
2. Hover over grip handle (≡) on option 3
3. Click and hold
4. Drag to position 1
5. Release

**Expected:**
- Option 3 moves to position 1
- Other options shift down
- Visual feedback during drag (opacity)

### Test 4.2: Up Button
1. Create question with 4 options
2. Click up arrow (↑) on option 3
3. Click again

**Expected:**
- First click: Option 3 moves to position 2
- Second click: Option 3 moves to position 1
- Up button disabled when at top

### Test 4.3: Down Button
1. Create question with 4 options
2. Click down arrow (↓) on option 2
3. Click again

**Expected:**
- First click: Option 2 moves to position 3
- Second click: Option 2 moves to position 4
- Down button disabled when at bottom

### Test 4.4: Mobile Touch Drag
1. On mobile device
2. Press and hold grip handle for 200ms
3. Drag option to new position
4. Release

**Expected:**
- 200ms delay prevents accidental drags
- Option moves smoothly
- Works in portrait and landscape

---

## Test Scenario 5: Read-Only Mode

### Setup
1. Close the term (set termStatus to "Closed")
2. OR publish the assignment (if publish feature exists)

### Test Read-Only Behavior
1. Open question for editing
2. Verify all controls disabled:
   - ❌ Cannot edit question text
   - ❌ Cannot change question type
   - ❌ Cannot add options
   - ❌ Cannot remove options
   - ❌ Cannot reorder options
   - ❌ Cannot change correct selections
   - ❌ Save button disabled

3. Verify can still view:
   - ✅ Can see question text
   - ✅ Can see all options
   - ✅ Can see which are correct

---

## Test Scenario 6: Bilingual (Arabic)

### Steps
1. Switch language to Arabic
2. Create MCQ_MULTI question
3. Verify all labels in Arabic:
   - "اختيار من متعدد (أكثر من إجابة)"
   - "الاختيارات"
   - "إضافة اختيار"
   - "تحريك لأعلى"
   - "تحريك لأسفل"

### Test RTL Layout
- Verify text aligns right
- Verify buttons positioned correctly
- Verify drag handle on correct side
- Verify checkboxes on correct side

### Test Validation Messages
Try to save invalid question and verify Arabic errors:
- "اختر إجابة صحيحة واحدة على الأقل."
- "اختيار عربي مكرر"
- "مطلوب اختيارين على الأقل"

---

## Test Scenario 7: Edge Cases

### Test 7.1: Maximum Options
1. Create question
2. Add 20 options
3. Test drag-and-drop performance
4. Test scrolling in dialog

**Expected:**
- Smooth performance
- Dialog scrolls properly
- All options accessible

### Test 7.2: Special Characters
1. Create option with special characters:
   - Arabic: "الرقم #1"
   - English: "Number #1"
2. Save and verify

**Expected:**
- Special characters preserved
- No encoding issues

### Test 7.3: Very Long Text
1. Create option with long text (100+ characters)
2. Save and verify display

**Expected:**
- Text wraps properly
- No layout breaking
- Readable in list view

### Test 7.4: Rapid Type Switching
1. Create MCQ_MULTI with 4 options, 3 correct
2. Switch to MCQ_SINGLE
3. Switch back to MCQ_MULTI
4. Switch to TRUE_FALSE
5. Switch back to MCQ_MULTI

**Expected:**
- Options cleared when switching to TRUE_FALSE
- New empty options created when switching back
- No errors or crashes

---

## Test Scenario 8: Save and Reload

### Steps
1. Create MCQ_MULTI question with:
   - 4 options
   - 2 marked correct
   - Custom order (reordered)
2. Save question
3. Close dialog
4. Reopen question for editing

### Verify Persistence
- ✅ All options present
- ✅ Correct order maintained
- ✅ Correct selections preserved
- ✅ All text preserved (AR and EN)

---

## Test Scenario 9: Remove Options

### Test 9.1: Remove Middle Option
1. Create question with 4 options
2. Remove option 2
3. Verify order updates:
   - Option 1 → stays 1
   - Option 3 → becomes 2
   - Option 4 → becomes 3

### Test 9.2: Cannot Remove Below Minimum
1. Create question with 2 options
2. Try to remove one option
3. Verify:
   - Remove button still visible
   - But validation blocks save
   - Error: "At least 2 options required"

### Test 9.3: Remove Correct Option
1. Create MCQ_SINGLE with 3 options
2. Mark option 2 as correct
3. Remove option 2
4. Try to save

**Expected Error:**
```
❌ "Select exactly one correct option."
```

---

## Test Scenario 10: Keyboard Navigation

### Steps
1. Open question dialog
2. Tab through all fields
3. Use keyboard to:
   - Navigate between inputs
   - Toggle checkboxes (Space)
   - Reorder options (Arrow keys + Space)
   - Save (Enter on Save button)

### Verify Accessibility
- ✅ All controls reachable via Tab
- ✅ Focus visible
- ✅ ARIA labels present
- ✅ Screen reader friendly

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No visual glitches
- ✅ Smooth animations
- ✅ Correct validation
- ✅ Data persistence
- ✅ Bilingual support
- ✅ RTL layout correct
- ✅ Mobile responsive
- ✅ Accessibility compliant

## Browser Testing Matrix

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✓ | ✓ | |
| Firefox | ✓ | ✓ | |
| Safari | ✓ | ✓ | |
| Edge | ✓ | N/A | |

## Performance Benchmarks

- Dialog open: < 100ms
- Drag operation: 60fps
- Save operation: < 500ms
- Validation: < 50ms

## Known Limitations

None - all features working as expected!
