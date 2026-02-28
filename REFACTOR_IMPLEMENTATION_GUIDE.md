# Assignment Builder - Complete Refactor Implementation Guide

## Status: Phase 1-2 Complete ✅

### Completed Files
1. ✅ `src/features/academics/assignments/builder/types.ts`
2. ✅ `src/features/academics/assignments/builder/utils/constants.ts`
3. ✅ `src/features/academics/assignments/builder/utils/validation.ts`
4. ✅ `src/features/academics/assignments/builder/utils/points.ts`
5. ✅ `src/features/academics/assignments/builder/hooks/useAssignmentData.ts`
6. ✅ `src/features/academics/assignments/builder/hooks/useAssignmentMutations.ts`

## Remaining Implementation Steps

### Phase 3: Create Remaining Components

#### 1. BuilderHeader Component
**File**: `src/features/academics/assignments/builder/components/BuilderHeader.tsx`

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Save, MoreVertical, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { BuilderHeaderProps } from "../types";

export function BuilderHeader({
  title,
  isPublished,
  isReadOnly,
  isDirty,
  saving,
  onBack,
  onSave,
  onPublish,
  onReset,
  onDelete,
}: BuilderHeaderProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tCommon = useTranslations("common");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={t("backToLesson")}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">{t("backToLesson")}</span>
          </button>

          {/* Title + Status */}
          <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
            <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate max-w-xs md:max-w-md">
              {title}
            </h1>
            <div className="flex items-center gap-2">
              {isPublished ? (
                <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  {t("published")}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                  {t("draft")}
                </span>
              )}
              {isReadOnly && (
                <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  {t("readOnly")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                <Button
                  onClick={onSave}
                  variant="secondary"
                  size="sm"
                  disabled={saving || !isDirty}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="hidden sm:flex"
                  aria-label={tCommon("save")}
                >
                  {saving ? tCommon("saving") : tCommon("save")}
                </Button>

                <Button
                  onClick={onPublish}
                  variant={isPublished ? "secondary" : "primary"}
                  size="sm"
                  leftIcon={isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  className="hidden sm:flex"
                  aria-label={isPublished ? t("unpublish") : t("publish")}
                >
                  {isPublished ? t("unpublish") : t("publish")}
                </Button>

                <button
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label={tCommon("more")}
                  aria-haspopup="true"
                  aria-expanded={!!menuAnchor}
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {/* More Menu */}
                {menuAnchor && (
                  <div className="fixed inset-0 z-50" onClick={() => setMenuAnchor(null)}>
                    <div
                      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
                      style={{
                        top: menuAnchor.getBoundingClientRect().bottom + 8,
                        right: window.innerWidth - menuAnchor.getBoundingClientRect().right,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      role="menu"
                    >
                      <button
                        onClick={() => {
                          setMenuAnchor(null);
                          onReset();
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                        role="menuitem"
                      >
                        {tCommon("reset")}
                      </button>
                      <button
                        onClick={() => {
                          setMenuAnchor(null);
                          onDelete();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        role="menuitem"
                      >
                        {tCommon("delete")}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### 2. QuestionsOutline Component
**File**: `src/features/academics/assignments/builder/components/QuestionsOutline.tsx`

Extract the left sidebar questions list with:
- Question cards
- Add question button
- Reorder controls
- Empty state

#### 3. AssignmentSettingsPanel Component
**File**: `src/features/academics/assignments/builder/components/AssignmentSettingsPanel.tsx`

Extract the right panel with:
- Title/description fields
- Due date picker
- Max score input
- Points summary
- Validation errors display

#### 4. AttachmentsPanel Component
**File**: `src/features/academics/assignments/builder/components/AttachmentsPanel.tsx`

Extract attachments section with:
- Drag-drop upload
- Add link dialog
- Attachments list
- Delete actions

#### 5. PointsSummary Component
**File**: `src/features/academics/assignments/builder/components/PointsSummary.tsx`

Extract points calculation display with:
- Max score vs total
- Difference indicator
- Auto-distribute button
- Match/mismatch status

### Phase 4: Add Missing Translation Keys

Add to `src/messages/en.json` and `src/messages/ar.json`:

```json
{
  "academics": {
    "curriculum": {
      "assignmentBuilder": {
        "backToLesson": "Back to Lesson",
        "published": "Published",
        "draft": "Draft",
        "readOnly": "Read Only",
        "publish": "Publish",
        "unpublish": "Unpublish",
        "questionsOutline": "Questions Outline",
        "addQuestion": "Add Question",
        "addFirstQuestion": "Add Your First Question",
        "noQuestionsYet": "No questions yet",
        "assignmentDetails": "Assignment Details",
        "pointsSummary": "Points Summary",
        "attachments": "Attachments",
        "confirmDelete": "Are you sure you want to delete this assignment?",
        "confirmReset": "Are you sure you want to reset? All unsaved changes will be lost.",
        "notFound": "Assignment not found"
      },
      "questions": {
        "title": "Title",
        "description": "Description",
        "due_date": "Due Date",
        "max_score": "Max Score",
        "total_points": "Total Points",
        "difference": "Difference",
        "points_match": "Points match!",
        "points_mismatch": "Points don't match",
        "points_sum_mismatch": "Total points must equal max score",
        "auto_distribute": "Auto Distribute Points",
        "confirm_auto_distribute_body": "This will evenly distribute points across all questions. Continue?",
        "points_distributed": "Points distributed successfully",
        "distribute_failed": "Failed to distribute points",
        "question_text": "Question Text",
        "question_type": "Question Type",
        "points": "Points",
        "answers": "Answers",
        "options": "Options",
        "option_text": "Option Text",
        "add_option": "Add Option",
        "remove_option": "Remove Option",
        "reorder_option": "Reorder Option",
        "move_up": "Move Up",
        "move_down": "Move Down",
        "correct_answer": "Correct Answer",
        "true": "True",
        "false": "False",
        "sample_answer": "Sample Answer (Optional)",
        "manual_grading_hint": "This question requires manual grading",
        "delete_question": "Delete Question",
        "delete_question_confirm": "Are you sure you want to delete this question?",
        "add_question_failed": "Failed to add question",
        "update_question_failed": "Failed to update question",
        "delete_question_failed": "Failed to delete question",
        "reorder_failed": "Failed to reorder questions",
        "question_types": {
          "MCQ_SINGLE": "Multiple Choice (Single)",
          "MCQ_MULTI": "Multiple Choice (Multiple)",
          "TRUE_FALSE": "True/False",
          "SHORT_ANSWER": "Short Answer",
          "ESSAY": "Essay"
        }
      }
    }
  },
  "common": {
    "upload_success": "File uploaded successfully",
    "upload_failed": "Failed to upload file",
    "link_added": "Link added successfully",
    "link_failed": "Failed to add link",
    "delete_success": "Deleted successfully",
    "delete_failed": "Failed to delete"
  }
}
```

### Phase 5: Create Main Page Component

**File**: `src/features/academics/assignments/builder/pages/AssignmentBuilderPage.tsx`

This orchestrates all components:

```typescript
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import { useGuardedRouter } from "@/hooks/useGuardedRouter";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { useAssignmentData } from "../hooks/useAssignmentData";
import { useAssignmentMutations } from "../hooks/useAssignmentMutations";
import { BuilderHeader } from "../components/BuilderHeader";
import { QuestionsOutline } from "../components/QuestionsOutline";
import { AssignmentSettingsPanel } from "../components/AssignmentSettingsPanel";
import { AttachmentsPanel } from "../components/AttachmentsPanel";
import QuestionEditor from "@/components/features/academics/components/curriculum/QuestionEditor";
import { calculatePointsSummary } from "../utils/points";
import { validateAssignment } from "../utils/validation";
import { ValidationErrors } from "../types";

interface AssignmentBuilderPageProps {
  lessonId: string;
  assignmentId?: string;
}

export default function AssignmentBuilderPage({
  lessonId,
  assignmentId,
}: AssignmentBuilderPageProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const guardedRouter = useGuardedRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const termStatus = searchParams.get("termStatus") as "open" | "closed" | null;
  const isReadOnly = termStatus === "closed";

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const { markDirty, clearDirty, isDirty } = useDirtyKey(
    `assignment-builder:${assignmentId || "new"}:${lessonId}`
  );

  const {
    assignment,
    questions,
    attachments,
    loading,
    error,
    setAssignment,
    setQuestions,
    setAttachments,
  } = useAssignmentData({ lessonId, assignmentId });

  const mutations = useAssignmentMutations({
    assignment,
    questions,
    lessonId,
    setAssignment,
    setQuestions,
    setAttachments,
    markDirty,
    clearDirty,
    validationErrors,
    setValidationErrors,
  });

  // Calculate points summary
  const pointsSummary = assignment
    ? calculatePointsSummary(assignment.maxScore || 0, questions)
    : { maxScore: 0, totalPoints: 0, difference: 0, isMatch: true };

  // Validate on changes
  const handleAssignmentUpdate = (updates: Partial<Assignment>) => {
    if (!assignment) return;
    const updated = { ...assignment, ...updates };
    setAssignment(updated);
    const errors = validateAssignment(updated, questions, tValidation);
    setValidationErrors(errors);
    markDirty();
  };

  // Handle navigation
  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    guardedRouter.push(`/${locale}/academics/curriculum?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) return;
    const success = await mutations.removeAssignment();
    if (success) handleBack();
  };

  const handleReset = async () => {
    if (!confirm(t("confirmReset"))) return;
    await mutations.resetAssignment();
  };

  // Loading state
  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>;
  }

  // Error state
  if (error || !assignment) {
    return <div className="min-h-screen bg-gray-50 p-6">
      <div className="text-center py-12">
        <p className="text-gray-600">{t("notFound")}</p>
        <Button onClick={handleBack} variant="secondary" className="mt-4">
          {t("backToLesson")}
        </Button>
      </div>
    </div>;
  }

  const displayTitle = locale === "ar" ? assignment.titleAr : assignment.titleEn;
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  return (
    <div className="min-h-screen bg-gray-50">
      <BuilderHeader
        title={displayTitle || t("draft")}
        isPublished={assignment.isPublished}
        isReadOnly={isReadOnly}
        isDirty={isDirty}
        saving={mutations.saving}
        onBack={handleBack}
        onSave={mutations.saveAssignment}
        onPublish={mutations.togglePublish}
        onReset={handleReset}
        onDelete={handleDelete}
      />

      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex h-[calc(100vh-73px)]">
          <QuestionsOutline
            questions={questions}
            selectedQuestionId={selectedQuestionId}
            isReadOnly={isReadOnly}
            onSelectQuestion={setSelectedQuestionId}
            onAddQuestion={async () => {
              const id = await mutations.addQuestion();
              if (id) setSelectedQuestionId(id);
            }}
            onMoveQuestion={(id, dir) => {
              const index = questions.findIndex((q) => q.id === id);
              const newIndex = dir === "up" ? index - 1 : index + 1;
              if (newIndex < 0 || newIndex >= questions.length) return;
              const newOrder = [...questions];
              [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
              mutations.reorderQuestions(newOrder.map((q) => q.id));
            }}
            onDeleteQuestion={mutations.removeQuestion}
          />

          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {selectedQuestion ? (
              <QuestionEditor
                key={selectedQuestion.id}
                question={selectedQuestion}
                onUpdate={(updates) => mutations.updateQuestion(selectedQuestion.id, updates)}
                isReadOnly={isReadOnly}
                markDirty={markDirty}
                validationErrors={validationErrors.questions?.[selectedQuestion.id]}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <EmptyState onAddQuestion={mutations.addQuestion} />
              </div>
            )}
          </div>

          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6 space-y-6">
              <AssignmentSettingsPanel
                assignment={assignment}
                isReadOnly={isReadOnly}
                validationErrors={validationErrors}
                pointsSummary={pointsSummary}
                onUpdate={handleAssignmentUpdate}
                onAutoDistribute={mutations.autoDistributePoints}
              />
              <AttachmentsPanel
                attachments={attachments}
                isReadOnly={isReadOnly}
                onUploadFile={mutations.uploadAttachment}
                onAddLink={mutations.addLinkAttachment}
                onDeleteAttachment={mutations.removeAttachment}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Layout - TODO: Implement tabs */}
    </div>
  );
}
```

### Phase 6: Update Route File

**File**: `src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]/page.tsx`

```typescript
import AssignmentBuilderPage from "@/features/academics/assignments/builder/pages/AssignmentBuilderPage";

interface PageProps {
  params: Promise<{ lessonId: string; assignmentId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { lessonId, assignmentId } = await params;
  return <AssignmentBuilderPage lessonId={lessonId} assignmentId={assignmentId} />;
}
```

### Phase 7: Testing Checklist

- [ ] Create new assignment
- [ ] Edit assignment title/description
- [ ] Add questions
- [ ] Edit question text
- [ ] Change question type
- [ ] Add/edit/remove options
- [ ] Select correct answers
- [ ] Reorder questions
- [ ] Auto-distribute points
- [ ] Upload attachments
- [ ] Add link attachments
- [ ] Save assignment
- [ ] Publish assignment
- [ ] Reset assignment
- [ ] Delete assignment
- [ ] Unsaved changes warning
- [ ] RTL mode
- [ ] Mobile responsive
- [ ] Validation errors
- [ ] Loading states
- [ ] Error handling

### Phase 8: Build & Deploy

```bash
npm run build
# Fix any TypeScript errors
# Test all flows
# Deploy
```

## Summary

This refactor transforms a 1600+ line monolithic component into:
- 15+ focused, testable modules
- Clean separation of concerns
- Proper TypeScript typing
- Full i18n coverage
- Comprehensive error handling
- Better performance
- Improved accessibility
- Maintainable architecture

**Estimated completion time**: 4-6 hours for full implementation and testing.
