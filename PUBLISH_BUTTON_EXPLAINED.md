# Publish Button - Purpose and Functionality

## Why Do We Need a Publish Button?

The Publish button is a critical feature that controls **when students can see and access the assignment**. It follows a common pattern in educational platforms (Google Classroom, Canvas, Moodle, etc.).

## The Problem It Solves

### Without Publish Button:
❌ Students see incomplete assignments  
❌ Students can submit before you're ready  
❌ You can't make changes without students seeing  
❌ No way to review before releasing  

### With Publish Button:
✅ You can prepare assignments privately  
✅ Students only see completed, reviewed assignments  
✅ You control exactly when assignments become available  
✅ You can unpublish to make changes if needed  

## Assignment States

### 1. Draft (Unpublished)
**Status:** `isPublished: false`

**Who Can See:**
- ✅ Teachers/Instructors
- ❌ Students

**What You Can Do:**
- Create and edit questions
- Add attachments
- Change settings
- Preview the assignment
- Test the assignment

**Visual Indicator:**
- Gray "Draft" chip in header
- "Publish" button available

### 2. Published
**Status:** `isPublished: true`

**Who Can See:**
- ✅ Teachers/Instructors
- ✅ Students

**What Students Can Do:**
- View the assignment
- See questions and instructions
- Download attachments
- Submit their answers
- See due date and max score

**Visual Indicator:**
- Green "Published" chip in header
- "Unpublish" button available

## Publish Validation

Before publishing, the system validates:

### 1. Points Must Match
```typescript
const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
if ((assignment.maxScore || 0) !== totalPoints) {
  alert(tQuestions("points_sum_mismatch"));
  return;
}
```

**Why?**
- Ensures grading is fair and consistent
- Max score should equal the sum of all question points
- Prevents confusion for students and teachers

**Example:**
- ❌ Max Score: 100, Question Points: 90 → Cannot publish
- ✅ Max Score: 100, Question Points: 100 → Can publish

### 2. Required Fields
The assignment must have:
- Title (Arabic and English)
- At least one question
- Valid question configuration (correct answers set)

## How It Works

### Publishing an Assignment

```typescript
const handlePublishToggle = async () => {
  if (!assignment) return;

  // Validate before publish
  if (!assignment.isPublished) {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    if ((assignment.maxScore || 0) !== totalPoints) {
      alert(tQuestions("points_sum_mismatch"));
      return;
    }
  }

  const newPublishState = !assignment.isPublished;

  try {
    await updateAssignment(assignment.id, {
      isPublished: newPublishState,
    });
    setAssignment({ ...assignment, isPublished: newPublishState });
  } catch (error) {
    console.error("Failed to toggle publish:", error);
  }
};
```

**Steps:**
1. Click "Publish" button
2. System validates points match
3. If valid, updates `isPublished` to `true`
4. Assignment becomes visible to students
5. Button changes to "Unpublish"

### Unpublishing an Assignment

**When to Unpublish:**
- Found an error in a question
- Need to change the due date
- Want to add more questions
- Need to fix point values

**What Happens:**
1. Click "Unpublish" button
2. Updates `isPublished` to `false`
3. Assignment hidden from students
4. You can make changes
5. Re-publish when ready

**Important:** If students have already submitted, you should be careful about unpublishing. Consider the impact on their submissions.

## User Interface

### Header Display

```typescript
{assignment.isPublished ? (
  <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
    {t("published")}
  </span>
) : (
  <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
    {t("draft")}
  </span>
)}
```

### Button Display

```typescript
<Button
  onClick={handlePublishToggle}
  variant={assignment.isPublished ? "secondary" : "primary"}
  size="sm"
  leftIcon={assignment.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
>
  {assignment.isPublished ? t("unpublish") : t("publish")}
</Button>
```

**Visual Feedback:**
- Draft: Primary blue button with Eye icon
- Published: Secondary gray button with EyeOff icon

## Typical Workflow

### Creating a New Assignment

1. **Create Draft**
   ```
   Click "Add Assignment" → Draft created automatically
   Status: Draft (unpublished)
   ```

2. **Build Content**
   ```
   Add questions → Edit settings → Upload attachments
   Status: Still Draft
   ```

3. **Review**
   ```
   Check all questions → Verify points → Preview
   Status: Still Draft
   ```

4. **Validate**
   ```
   Ensure max score = sum of question points
   Check all required fields
   ```

5. **Publish**
   ```
   Click "Publish" → Validation passes → Assignment published
   Status: Published
   Students can now see and submit
   ```

### Making Changes After Publishing

1. **Unpublish**
   ```
   Click "Unpublish" → Assignment hidden from students
   Status: Draft
   ```

2. **Make Changes**
   ```
   Edit questions → Update settings → Fix issues
   Status: Still Draft
   ```

3. **Re-publish**
   ```
   Click "Publish" → Validation passes → Assignment published again
   Status: Published
   ```

## Points Summary Integration

The Points Summary panel shows whether you can publish:

```typescript
{pointsMatch ? (
  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
    <CheckCircle className="w-4 h-4" />
    <span className="text-xs font-medium">{tQuestions("points_match")}</span>
  </div>
) : (
  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded">
    <AlertCircle className="w-4 h-4" />
    <span className="text-xs font-medium">{tQuestions("points_mismatch")}</span>
  </div>
)}
```

**Visual Indicators:**
- ✅ Green: Points match → Can publish
- ⚠️ Amber: Points mismatch → Cannot publish

## Auto-Distribute Points Feature

If points don't match, you can use "Auto distribute points":

```typescript
const handleAutoDistributePoints = async () => {
  if (!assignment || questions.length === 0 || !assignment.maxScore) return;

  if (!confirm(tQuestions("confirm_auto_distribute_body"))) return;

  const pointsPerQuestion = Math.floor(assignment.maxScore / questions.length);
  const remainder = assignment.maxScore % questions.length;

  const updates = questions.map((q, index) => ({
    questionId: q.id,
    points: pointsPerQuestion + (index < remainder ? 1 : 0),
  }));

  try {
    await bulkUpdateQuestionPoints(assignment.id, updates);
    setQuestions(
      questions.map((q, index) => ({
        ...q,
        points: pointsPerQuestion + (index < remainder ? 1 : 0),
      }))
    );
    markDirty();
  } catch (error) {
    console.error("Failed to auto distribute points:", error);
  }
};
```

**Example:**
- Max Score: 100
- Questions: 3
- Result: 34, 33, 33 points (distributes evenly with remainder to first questions)

## Best Practices

### Before Publishing

1. ✅ Review all questions for accuracy
2. ✅ Check that correct answers are set
3. ✅ Verify points add up to max score
4. ✅ Test the assignment yourself
5. ✅ Check due date is correct
6. ✅ Review attachments are correct
7. ✅ Verify bilingual content (AR/EN)

### After Publishing

1. ⚠️ Avoid making major changes
2. ⚠️ If changes needed, unpublish first
3. ⚠️ Communicate changes to students
4. ⚠️ Consider impact on existing submissions

### When to Unpublish

- ✅ Found an error in questions
- ✅ Need to change point values
- ✅ Want to add/remove questions
- ✅ Need to update due date significantly
- ❌ Don't unpublish just to view (you can view while published)

## Read-Only Mode

When term is closed (`termStatus === "closed"`):

```typescript
const isReadOnly = termStatus === "closed";
```

**Restrictions:**
- ❌ Cannot publish/unpublish
- ❌ Cannot edit questions
- ❌ Cannot change settings
- ✅ Can view everything

**Visual Indicator:**
- "Read-only" chip shown in header
- All buttons disabled

## Translations

### English
```json
{
  "publish": "Publish",
  "unpublish": "Unpublish",
  "published": "Published",
  "draft": "Draft",
  "points_sum_mismatch": "Question points must sum to max score."
}
```

### Arabic
```json
{
  "publish": "نشر",
  "unpublish": "إلغاء النشر",
  "published": "منشور",
  "draft": "مسودة",
  "points_sum_mismatch": "يجب أن يساوي مجموع درجات الأسئلة الدرجة النهائية."
}
```

## Summary

The Publish button is essential for:

1. **Control** - You decide when students see assignments
2. **Quality** - Review and validate before releasing
3. **Flexibility** - Make changes privately in draft mode
4. **Validation** - Ensures assignments are complete and correct
5. **Professional** - Follows industry best practices

Without it, you'd have no way to prepare assignments privately or control their release to students. It's a fundamental feature of any learning management system.
