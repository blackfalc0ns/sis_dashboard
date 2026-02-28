# Assignment Builder - Testing Guide

## Quick Start
Navigate to: `/[lang]/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]`

## Test Scenarios

### 1. Create New Assignment
**Steps:**
1. Navigate to any lesson
2. Click "Add Assignment" button
3. **Expected:** Draft assignment created with localized title ("واجب جديد" / "New Assignment")
4. **Expected:** URL updates with new assignment ID
5. **Expected:** Empty state shows "Add your first question"

**Pass Criteria:**
- ✅ Draft created successfully
- ✅ URL contains assignment ID
- ✅ Title is localized
- ✅ No console errors

---

### 2. Edit Assignment Metadata
**Steps:**
1. Edit title in Arabic
2. Edit title in English
3. **Expected:** Validation error if AR == EN
4. Edit description (optional)
5. Select due date
6. Set max score to 100
7. Click "Save"
8. **Expected:** Success toast
9. **Expected:** "Unsaved changes" chip disappears

**Pass Criteria:**
- ✅ Bilingual validation works (AR != EN)
- ✅ Save succeeds
- ✅ Dirty state clears after save
- ✅ No console errors

---

### 3. Add Questions
**Steps:**
1. Click "Add Question" button (in outline or center)
2. **Expected:** New question appears in outline
3. **Expected:** Question editor opens
4. Edit question text (AR/EN)
5. Change question type to MCQ_MULTI
6. Set points to 10
7. **Expected:** Outline updates immediately
8. **Expected:** "Unsaved changes" chip appears

**Pass Criteria:**
- ✅ Question added to outline
- ✅ Editor shows correct question
- ✅ Type change works
- ✅ Points update works
- ✅ Dirty state marked

---

### 4. MCQ Single Answer Validation
**Steps:**
1. Add question with type MCQ_SINGLE
2. **Expected:** 2 default options
3. Select option 1 as correct
4. Try to select option 2 as correct
5. **Expected:** Only 1 option can be correct
6. Try to delete option 1
7. **Expected:** Cannot delete below 2 options
8. Add option 3
9. Reorder options using up/down arrows
10. **Expected:** Order updates in outline

**Pass Criteria:**
- ✅ Only 1 correct answer allowed
- ✅ Cannot delete below 2 options
- ✅ Reorder works
- ✅ Validation shows error if no correct answer

---

### 5. MCQ Multiple Answers Validation
**Steps:**
1. Add question with type MCQ_MULTI
2. Select options 1 and 2 as correct
3. **Expected:** Multiple selections allowed
4. Deselect all options
5. **Expected:** Validation error "Select at least 1 correct answer"
6. Select option 1 again
7. **Expected:** Validation error clears

**Pass Criteria:**
- ✅ Multiple correct answers allowed
- ✅ Validation requires ≥1 correct
- ✅ Error shows/clears correctly

---

### 6. Points Auto-Distribute
**Steps:**
1. Set max score to 100
2. Add 5 questions
3. Go to Settings panel
4. **Expected:** Points summary shows mismatch
5. Click "Auto distribute points"
6. **Expected:** Confirmation dialog
7. Confirm
8. **Expected:** Each question gets 20 points
9. **Expected:** Points summary shows "Points match"

**Test Edge Case:**
1. Set max score to 101
2. Add 5 questions
3. Auto distribute
4. **Expected:** 4 questions get 20 points, 1 gets 21 points

**Pass Criteria:**
- ✅ Points distributed evenly
- ✅ Remainder handled correctly
- ✅ Summary updates immediately
- ✅ Dirty state marked

---

### 7. Reorder Questions
**Steps:**
1. Add 3 questions
2. Select question 2
3. Click up arrow
4. **Expected:** Question 2 moves to position 1
5. **Expected:** Outline updates immediately
6. Try to move question 1 up
7. **Expected:** Button disabled (already at top)
8. Try to move question 3 down
9. **Expected:** Button disabled (already at bottom)

**Pass Criteria:**
- ✅ Reorder works correctly
- ✅ Outline updates
- ✅ Boundary checks work
- ✅ Selected question stays selected

---

### 8. Delete Question
**Steps:**
1. Add 2 questions
2. Select question 1
3. Click delete button
4. **Expected:** Confirmation dialog
5. Confirm
6. **Expected:** Question removed from outline
7. **Expected:** Question 2 auto-selected
8. Delete last question
9. **Expected:** Empty state shows

**Pass Criteria:**
- ✅ Confirmation dialog appears
- ✅ Question deleted
- ✅ Next question auto-selected
- ✅ Empty state shows when no questions

---

### 9. Upload File Attachment
**Steps:**
1. Go to Attachments panel
2. Drag and drop a PDF file
3. **Expected:** File uploads
4. **Expected:** File appears in list
5. Try to upload file > 50MB
6. **Expected:** Error message
7. Click on attachment
8. **Expected:** Opens in new tab

**Pass Criteria:**
- ✅ Drag-drop works
- ✅ File size validation works
- ✅ File appears in list
- ✅ Click opens file

---

### 10. Add Link Attachment
**Steps:**
1. Click "Add Link" button
2. **Expected:** Dialog opens
3. Enter title: "Google"
4. Enter URL: "google.com"
5. **Expected:** Validation error "Invalid URL"
6. Change URL to: "https://google.com"
7. Click "Add"
8. **Expected:** Link added to list
9. Click on link
10. **Expected:** Opens in new tab

**Pass Criteria:**
- ✅ Dialog opens
- ✅ URL validation works
- ✅ Link added successfully
- ✅ Click opens link

---

### 11. Delete Attachment
**Steps:**
1. Add file or link attachment
2. Click delete action
3. **Expected:** Attachment removed from list
4. **Expected:** Success toast

**Pass Criteria:**
- ✅ Attachment deleted
- ✅ List updates immediately

---

### 12. Publish Assignment
**Steps:**
1. Create assignment with:
   - Title (AR/EN)
   - 2 questions with correct answers
   - Points matching max score
2. Click "Publish" button
3. **Expected:** Success toast
4. **Expected:** Status chip changes to "Published"

**Test Validation:**
1. Create assignment without questions
2. Try to publish
3. **Expected:** Warning dialog with errors
4. Add questions but don't set correct answers
5. Try to publish
6. **Expected:** Warning dialog with validation errors

**Pass Criteria:**
- ✅ Publish succeeds when valid
- ✅ Publish blocked when invalid
- ✅ Validation errors shown clearly
- ✅ Status updates correctly

---

### 13. Unpublish Assignment
**Steps:**
1. Publish an assignment
2. Click "Unpublish" button
3. **Expected:** Success toast
4. **Expected:** Status chip changes to "Draft"

**Pass Criteria:**
- ✅ Unpublish succeeds
- ✅ Status updates correctly

---

### 14. Unsaved Changes Guard
**Steps:**
1. Edit assignment title
2. **Expected:** "Unsaved changes" chip appears
3. Click "Back to Lesson"
4. **Expected:** Unsaved changes dialog
5. Click "Stay"
6. **Expected:** Stays on page
7. Click "Back to Lesson" again
8. Click "Leave"
9. **Expected:** Navigates away

**Test After Save:**
1. Edit title
2. Click "Save"
3. **Expected:** Dirty state clears
4. Click "Back to Lesson"
5. **Expected:** No dialog, navigates immediately

**Pass Criteria:**
- ✅ Dialog shows when dirty
- ✅ "Stay" keeps on page
- ✅ "Leave" navigates away
- ✅ No dialog after save

---

### 15. Reset Assignment
**Steps:**
1. Edit assignment title
2. Add a question
3. Click "More" menu → "Reset"
4. **Expected:** Confirmation dialog
5. Confirm
6. **Expected:** All changes reverted
7. **Expected:** Success toast
8. **Expected:** Dirty state cleared

**Pass Criteria:**
- ✅ Confirmation dialog appears
- ✅ Changes reverted
- ✅ Dirty state cleared

---

### 16. Delete Assignment
**Steps:**
1. Click "More" menu → "Delete"
2. **Expected:** Confirmation dialog
3. Confirm
4. **Expected:** Assignment deleted
5. **Expected:** Navigates back to lesson

**Pass Criteria:**
- ✅ Confirmation dialog appears
- ✅ Assignment deleted
- ✅ Navigates back

---

### 17. Read-Only Mode (Closed Term)
**Steps:**
1. Navigate to assignment with `?termStatus=closed`
2. **Expected:** "Read-only" chip in header
3. **Expected:** All edit buttons disabled
4. **Expected:** Cannot add questions
5. **Expected:** Cannot edit fields
6. **Expected:** Cannot upload attachments

**Pass Criteria:**
- ✅ Read-only indicator shows
- ✅ All edits disabled
- ✅ No errors when clicking disabled buttons

---

### 18. Mobile Layout
**Steps:**
1. Resize browser to mobile width (< 768px)
2. **Expected:** Tabs appear (Questions, Settings, Attachments)
3. Click "Questions" tab
4. Click "Questions Outline" button
5. **Expected:** Drawer opens from left
6. Select a question
7. **Expected:** Drawer closes, question editor shows
8. Switch to "Settings" tab
9. **Expected:** Settings panel shows
10. Switch to "Attachments" tab
11. **Expected:** Attachments panel shows

**Pass Criteria:**
- ✅ Tabs work correctly
- ✅ Drawer opens/closes
- ✅ All panels accessible
- ✅ No layout issues

---

### 19. RTL Mode (Arabic)
**Steps:**
1. Switch locale to Arabic
2. **Expected:** All text in Arabic
3. **Expected:** Layout mirrors (RTL)
4. **Expected:** Icons align to right
5. Edit assignment
6. **Expected:** All functionality works
7. Switch back to English
8. **Expected:** Layout returns to LTR

**Pass Criteria:**
- ✅ Text fully translated
- ✅ Layout mirrors correctly
- ✅ Icons positioned correctly
- ✅ No layout breaks

---

### 20. Keyboard Navigation
**Steps:**
1. Tab through questions outline
2. **Expected:** Focus visible on each item
3. Press Enter on a question
4. **Expected:** Question selected
5. Tab to "Add Question" button
6. Press Enter
7. **Expected:** New question added
8. Tab through form fields
9. **Expected:** All fields accessible

**Pass Criteria:**
- ✅ Tab order logical
- ✅ Focus visible
- ✅ Enter/Space work on buttons
- ✅ All interactive elements accessible

---

## Performance Tests

### 21. Large Assignment (50 Questions)
**Steps:**
1. Create assignment
2. Add 50 questions
3. **Expected:** Outline scrolls smoothly
4. Switch between questions
5. **Expected:** No lag
6. Auto-distribute points
7. **Expected:** Completes quickly

**Pass Criteria:**
- ✅ Smooth scrolling
- ✅ Fast question switching
- ✅ No performance issues

---

## Edge Cases

### 22. Empty States
- ✅ No questions: Shows "Add your first question"
- ✅ No attachments: Shows "No attachments yet"
- ✅ No description: Optional field works

### 23. Validation Edge Cases
- ✅ Title AR == EN: Shows error
- ✅ Description AR == EN: Shows error
- ✅ Max score = 0: Shows error
- ✅ Negative points: Shows error
- ✅ Points mismatch: Blocks publish

### 24. Network Errors
- ✅ Save fails: Shows error toast
- ✅ Upload fails: Shows error toast
- ✅ Delete fails: Shows error toast

---

## Browser Compatibility
Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Accessibility Checklist
- ✅ All buttons have aria-labels
- ✅ Keyboard navigation works
- ✅ Focus visible
- ✅ Screen reader friendly
- ✅ Color contrast sufficient
- ✅ Error messages announced

---

## Summary
Total test scenarios: 24
Critical flows: 20
Edge cases: 4

All tests should pass with no console errors or warnings.
