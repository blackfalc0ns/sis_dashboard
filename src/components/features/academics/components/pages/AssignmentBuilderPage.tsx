"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  MoreVertical,
  Eye,
  EyeOff,
  Plus,
  FileText,
  Settings as SettingsIcon,
  Paperclip,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Menu,
} from "lucide-react";
import { Drawer, useMediaQuery, useTheme, Tabs, Tab } from "@mui/material";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import DatePicker from "@/components/ui/input/DatePicker";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import AttachmentListItem from "@/components/ui/attachment-list-item/AttachmentListItem";
import { useGuardedRouter } from "@/hooks/useGuardedRouter";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { useToast } from "@/components/ui/toast/Toast";
import {
  Assignment,
  AssignmentQuestion,
  AssignmentAttachment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchAssignmentQuestions,
  createAssignmentQuestion,
  updateAssignmentQuestion,
  deleteAssignmentQuestion,
  reorderAssignmentQuestions,
  bulkUpdateQuestionPoints,
  fetchAssignmentAttachments,
  uploadAssignmentAttachmentFile,
  createAssignmentAttachmentLink,
  deleteAssignmentAttachment,
} from "@/services/academics/curriculumService";
import { validateHttpUrl, normalizeUrl } from "@/utils/validation/url";
import QuestionEditor from "../curriculum/QuestionEditor";

interface AssignmentBuilderPageProps {
  lessonId: string;
  assignmentId?: string;
}

export default function AssignmentBuilderPage({
  lessonId,
  assignmentId,
}: AssignmentBuilderPageProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tQuestions = useTranslations("academics.curriculum.questions");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tUpload = useTranslations("upload");
  const locale = useLocale();
  const router = useRouter();
  const guardedRouter = useGuardedRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError, showWarning } = useToast();

  // Track if we've already created a draft to prevent duplicates
  const hasCreatedDraft = useRef(false);

  // Get term context from URL params
  const termStatus = searchParams.get("termStatus") as "open" | "closed" | null;
  const isReadOnly = termStatus === "closed";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    titleAr?: string;
    titleEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    maxScore?: string;
    questions?: Record<string, {
      textAr?: string;
      textEn?: string;
      points?: string;
      options?: string;
      correctAnswer?: string;
    }>;
    general?: string[];
  }>({});

  // Mobile state
  const [mobileTab, setMobileTab] = useState<"questions" | "settings" | "attachments">("questions");
  const [questionsDrawerOpen, setQuestionsDrawerOpen] = useState(false);

  // Dirty state management
  const { markDirty, clearDirty, isDirty } = useDirtyKey(
    `assignment-builder:${assignmentId || "new"}:${lessonId}`
  );

  // Initialize - create draft if new
  useEffect(() => {
    const init = async () => {
      if (!assignmentId) {
        // NEW assignment - create draft immediately (only once)
        if (hasCreatedDraft.current) {
          return;
        }

        hasCreatedDraft.current = true;

        try {
          setLoading(true);
          const draft = await createAssignment(lessonId, {
            titleAr: "واجب جديد",
            titleEn: "New Assignment",
            isPublished: false,
          });

          // Replace URL with the new assignment ID
          const params = new URLSearchParams(searchParams.toString());
          const newUrl = `/${locale}/academics/curriculum/lessons/${lessonId}/assignments/${draft.id}?${params.toString()}`;

          router.replace(newUrl);

          setAssignment(draft);
          setLoading(false);
        } catch (error) {
          console.error("Failed to create draft assignment:", error);
          hasCreatedDraft.current = false;
          setLoading(false);
        }
      } else {
        // EDIT existing assignment - fetch data
        try {
          setLoading(true);
          const stored = localStorage.getItem(`lesson-assignments-${lessonId}`);
          if (stored) {
            const assignments: Assignment[] = JSON.parse(stored);
            const found = assignments.find((a) => a.id === assignmentId);
            if (found) {
              setAssignment(found);

              // Load questions
              const qs = await fetchAssignmentQuestions(assignmentId);
              setQuestions(qs);

              // Select first question if exists
              if (qs.length > 0) {
                setSelectedQuestionId(qs[0].id);
              }

              // Load attachments
              const atts = await fetchAssignmentAttachments(assignmentId);
              setAttachments(atts);
            }
          }
          setLoading(false);
        } catch (error) {
          console.error("Failed to load assignment:", error);
          setLoading(false);
        }
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, lessonId]);

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    guardedRouter.push(`/${locale}/academics/curriculum?${params.toString()}`);
  };

  const handleSave = async () => {
    if (!assignment) return;

    // Clear previous errors
    setValidationErrors({});

    // Comprehensive validation before saving
    const errors: typeof validationErrors = {};
    const generalErrors: string[] = [];

    // 1. Validate title
    if (!assignment.titleAr?.trim()) {
      errors.titleAr = tValidation("required_ar");
    }
    if (!assignment.titleEn?.trim()) {
      errors.titleEn = tValidation("required_en");
    }

    // 2. Check AR != EN for title
    if (assignment.titleAr?.trim() && assignment.titleEn?.trim()) {
      if (assignment.titleAr.trim().toLowerCase() === assignment.titleEn.trim().toLowerCase()) {
        errors.titleAr = tValidation("arEnMustDiffer");
        errors.titleEn = tValidation("arEnMustDiffer");
      }
    }

    // 3. Check AR != EN for description if both filled
    if (assignment.descriptionAr?.trim() && assignment.descriptionEn?.trim()) {
      if (assignment.descriptionAr.trim().toLowerCase() === assignment.descriptionEn.trim().toLowerCase()) {
        errors.descriptionAr = tValidation("arEnMustDiffer");
        errors.descriptionEn = tValidation("arEnMustDiffer");
      }
    }

    // 4. Validate max score
    if (!assignment.maxScore || assignment.maxScore <= 0) {
      errors.maxScore = tValidation("invalid_max_score");
    }

    // 5. Validate questions exist
    if (questions.length === 0) {
      generalErrors.push(tValidation("at_least_one_question"));
    }

    // 6. Validate each question
    const questionErrors: Record<string, any> = {};
    questions.forEach((q, index) => {
      const qErrors: any = {};
      
      // Question text required
      if (!q.questionTextAr?.trim()) {
        qErrors.textAr = tValidation("required_ar");
      }
      if (!q.questionTextEn?.trim()) {
        qErrors.textEn = tValidation("required_en");
      }

      // Points validation
      if (q.points < 0) {
        qErrors.points = tValidation("invalid_points");
      }

      // MCQ validation
      if (q.questionType === "MCQ_SINGLE" || q.questionType === "MCQ_MULTI") {
        if (!q.options || q.options.length < 2) {
          qErrors.options = tValidation("minTwoOptions");
        } else {
          // Check correct answers
          const correctCount = q.options.filter(o => o.isCorrect).length;
          if (q.questionType === "MCQ_SINGLE" && correctCount !== 1) {
            qErrors.correctAnswer = tValidation("selectCorrectSingle");
          } else if (q.questionType === "MCQ_MULTI" && correctCount < 1) {
            qErrors.correctAnswer = tValidation("selectCorrectMulti");
          }
        }
      }

      if (Object.keys(qErrors).length > 0) {
        questionErrors[q.id] = qErrors;
      }
    });

    if (Object.keys(questionErrors).length > 0) {
      errors.questions = questionErrors;
    }

    if (generalErrors.length > 0) {
      errors.general = generalErrors;
    }

    // Show validation errors
    if (Object.keys(errors).length > 0 || generalErrors.length > 0) {
      setValidationErrors(errors);
      
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }

    setSaving(true);
    try {
      await updateAssignment(assignment.id, {
        titleAr: assignment.titleAr.trim(),
        titleEn: assignment.titleEn.trim(),
        descriptionAr: assignment.descriptionAr?.trim() || undefined,
        descriptionEn: assignment.descriptionEn?.trim() || undefined,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore ?? 0,
      });
      
      // Update local state with trimmed values
      setAssignment({
        ...assignment,
        titleAr: assignment.titleAr.trim(),
        titleEn: assignment.titleEn.trim(),
        descriptionAr: assignment.descriptionAr?.trim() || undefined,
        descriptionEn: assignment.descriptionEn?.trim() || undefined,
      });
      
      clearDirty();
      setValidationErrors({});
      
      showSuccess(tCommon("save_success") || "Assignment saved successfully!");
    } catch (error) {
      console.error("Failed to save assignment:", error);
      showError(tCommon("save_failed") || "Failed to save assignment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!assignment) return;

    // Comprehensive validation before publish
    if (!assignment.isPublished) {
      const validationErrors: string[] = [];

      // 1. Validate title
      if (!assignment.titleAr?.trim()) {
        validationErrors.push(tValidation("required_ar") + " - " + tQuestions("title"));
      }
      if (!assignment.titleEn?.trim()) {
        validationErrors.push(tValidation("required_en") + " - " + tQuestions("title"));
      }

      // 2. Validate questions exist
      if (questions.length === 0) {
        validationErrors.push(tValidation("at_least_one_question"));
      }

      // 3. Validate each question
      questions.forEach((q, index) => {
        const qNum = `Q${index + 1}`;
        
        // Question text required
        if (!q.questionTextAr?.trim() || !q.questionTextEn?.trim()) {
          validationErrors.push(`${qNum}: ${tValidation("question_text_required")}`);
        }

        // MCQ validation
        if (q.questionType === "MCQ_SINGLE" || q.questionType === "MCQ_MULTI") {
          if (!q.options || q.options.length < 2) {
            validationErrors.push(`${qNum}: ${tValidation("minTwoOptions")}`);
          } else {
            const correctCount = q.options.filter(o => o.isCorrect).length;
            if (q.questionType === "MCQ_SINGLE" && correctCount !== 1) {
              validationErrors.push(`${qNum}: ${tValidation("selectCorrectSingle")}`);
            } else if (q.questionType === "MCQ_MULTI" && correctCount < 1) {
              validationErrors.push(`${qNum}: ${tValidation("selectCorrectMulti")}`);
            }
          }
        }
      });

      // 4. Validate points match
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      if ((assignment.maxScore || 0) !== totalPoints) {
        validationErrors.push(tQuestions("points_sum_mismatch"));
      }

      // Show validation errors
      if (validationErrors.length > 0) {
        showWarning(tValidation("cannot_publish") + ":\n\n" + validationErrors.join("\n"));
        return;
      }
    }

    const newPublishState = !assignment.isPublished;

    try {
      await updateAssignment(assignment.id, {
        isPublished: newPublishState,
      });
      setAssignment({ ...assignment, isPublished: newPublishState });
      
      showSuccess(newPublishState 
        ? (tCommon("publish_success") || "Assignment published successfully!")
        : (tCommon("unpublish_success") || "Assignment unpublished successfully!")
      );
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      showError(tCommon("publish_failed") || "Failed to change publish status. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;

    if (confirm(t("confirmDelete"))) {
      try {
        await deleteAssignment(assignment.id);
        clearDirty();
        handleBack();
      } catch (error) {
        console.error("Failed to delete assignment:", error);
      }
    }
  };

  const handleReset = async () => {
    if (!assignment) return;

    if (!confirm(t("confirmReset"))) return;

    try {
      setLoading(true);
      
      // Reload assignment from database
      const stored = localStorage.getItem(`lesson-assignments-${lessonId}`);
      if (stored) {
        const assignments: Assignment[] = JSON.parse(stored);
        const found = assignments.find((a) => a.id === assignmentId);
        if (found) {
          setAssignment(found);
          
          // Reload questions
          const qs = await fetchAssignmentQuestions(assignmentId!);
          setQuestions(qs);
          
          // Select first question if exists
          if (qs.length > 0) {
            setSelectedQuestionId(qs[0].id);
          } else {
            setSelectedQuestionId(null);
          }
          
          // Reload attachments
          const atts = await fetchAssignmentAttachments(assignmentId!);
          setAttachments(atts);
          
          clearDirty();
          showSuccess(tCommon("reset_success") || "Assignment reset successfully!");
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to reset assignment:", error);
      showError(tCommon("reset_failed") || "Failed to reset assignment. Please try again.");
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!assignment) return;

    try {
      const newQuestion = await createAssignmentQuestion(assignment.id, {
        questionTextAr: "سؤال جديد",
        questionTextEn: "New Question",
        questionType: "MCQ_SINGLE",
        points: 1,
        options: [
          { id: `opt-${Date.now()}-1`, textAr: "خيار 1", textEn: "Option 1", isCorrect: true, order: 1 },
          { id: `opt-${Date.now()}-2`, textAr: "خيار 2", textEn: "Option 2", isCorrect: false, order: 2 },
        ],
      });

      setQuestions([...questions, newQuestion]);
      setSelectedQuestionId(newQuestion.id);
      markDirty();
    } catch (error) {
      console.error("Failed to add question:", error);
    }
  };

  const handleUpdateQuestion = async (questionId: string, updates: Partial<AssignmentQuestion>) => {
    try {
      await updateAssignmentQuestion(questionId, updates);
      setQuestions(questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)));
      markDirty();
    } catch (error) {
      console.error("Failed to update question:", error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm(tQuestions("delete_question_confirm"))) return;

    try {
      await deleteAssignmentQuestion(questionId);
      const newQuestions = questions.filter((q) => q.id !== questionId);
      setQuestions(newQuestions);

      // Select another question
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(newQuestions.length > 0 ? newQuestions[0].id : null);
      }
      markDirty();
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  const handleMoveQuestion = async (questionId: string, direction: "up" | "down") => {
    const index = questions.findIndex((q) => q.id === questionId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];

    try {
      await reorderAssignmentQuestions(
        assignment!.id,
        newQuestions.map((q) => q.id)
      );
      setQuestions(newQuestions);
      markDirty();
    } catch (error) {
      console.error("Failed to reorder questions:", error);
    }
  };

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

  const handleUploadFile = async (file: File) => {
    if (!assignment) return;

    try {
      const newAttachment = await uploadAssignmentAttachmentFile(assignment.id, file);
      setAttachments([...attachments, newAttachment]);
      markDirty();
    } catch (error) {
      console.error("Failed to upload file:", error);
      throw error;
    }
  };

  const handleAddLink = async (title: string, url: string) => {
    if (!assignment) return;

    try {
      const newAttachment = await createAssignmentAttachmentLink(assignment.id, { title, url });
      setAttachments([...attachments, newAttachment]);
      markDirty();
    } catch (error) {
      console.error("Failed to add link:", error);
      throw error;
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAssignmentAttachment(attachmentId);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      markDirty();
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">{t("notFound")}</p>
          <Button onClick={handleBack} variant="secondary" className="mt-4">
            {t("backToLesson")}
          </Button>
        </div>
      </div>
    );
  }

  const displayTitle = locale === "ar" ? assignment.titleAr : assignment.titleEn;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const pointsDifference = (assignment.maxScore || 0) - totalPoints;
  const pointsMatch = pointsDifference === 0;

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <StickyHeader
        displayTitle={displayTitle}
        assignment={assignment}
        isReadOnly={isReadOnly}
        saving={saving}
        isDirty={isDirty}
        onBack={handleBack}
        onSave={handleSave}
        onPublishToggle={handlePublishToggle}
        onDelete={handleDelete}
        onReset={handleReset}
        t={t}
        tCommon={tCommon}
      />

      {/* Main Content */}
      {isMobile ? (
        <MobileLayout
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          questionsDrawerOpen={questionsDrawerOpen}
          setQuestionsDrawerOpen={setQuestionsDrawerOpen}
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          setSelectedQuestionId={setSelectedQuestionId}
          selectedQuestion={selectedQuestion}
          assignment={assignment}
          setAssignment={setAssignment}
          attachments={attachments}
          isReadOnly={isReadOnly}
          totalPoints={totalPoints}
          pointsDifference={pointsDifference}
          pointsMatch={pointsMatch}
          validationErrors={validationErrors}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onMoveQuestion={handleMoveQuestion}
          onAutoDistributePoints={handleAutoDistributePoints}
          onUploadFile={handleUploadFile}
          onAddLink={handleAddLink}
          onDeleteAttachment={handleDeleteAttachment}
          markDirty={markDirty}
          t={t}
          tQuestions={tQuestions}
          tCommon={tCommon}
          tValidation={tValidation}
          tUpload={tUpload}
          locale={locale}
        />
      ) : (
        <DesktopLayout
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          setSelectedQuestionId={setSelectedQuestionId}
          selectedQuestion={selectedQuestion}
          assignment={assignment}
          setAssignment={setAssignment}
          attachments={attachments}
          isReadOnly={isReadOnly}
          totalPoints={totalPoints}
          pointsDifference={pointsDifference}
          pointsMatch={pointsMatch}
          validationErrors={validationErrors}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onMoveQuestion={handleMoveQuestion}
          onAutoDistributePoints={handleAutoDistributePoints}
          onUploadFile={handleUploadFile}
          onAddLink={handleAddLink}
          onDeleteAttachment={handleDeleteAttachment}
          markDirty={markDirty}
          t={t}
          tQuestions={tQuestions}
          tCommon={tCommon}
          tValidation={tValidation}
          tUpload={tUpload}
          locale={locale}
        />
      )}
    </div>
  );
}

// ============================================
// STICKY HEADER COMPONENT
// ============================================
function StickyHeader({
  displayTitle,
  assignment,
  isReadOnly,
  saving,
  isDirty,
  onBack,
  onSave,
  onPublishToggle,
  onDelete,
  onReset,
  t,
  tCommon,
}: {
  displayTitle: string;
  assignment: Assignment;
  isReadOnly: boolean;
  saving: boolean;
  isDirty: boolean;
  onBack: () => void;
  onSave: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
  onReset: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">{t("backToLesson")}</span>
          </button>

          {/* Center: Title + Status */}
          <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
            <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate max-w-xs md:max-w-md">
              {displayTitle}
            </h1>

            {/* Status Chips */}
            <div className="flex items-center gap-2">
              {assignment.isPublished ? (
                <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                  {t("published")}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                  {t("draft")}
                </span>
              )}

              {isReadOnly && (
                <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">
                  {t("readOnly")}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
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
                >
                  {saving ? tCommon("saving") : tCommon("save")}
                </Button>

                <Button
                  onClick={onPublishToggle}
                  variant={assignment.isPublished ? "secondary" : "primary"}
                  size="sm"
                  leftIcon={
                    assignment.isPublished ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )
                  }
                  className="hidden sm:flex"
                >
                  {assignment.isPublished ? t("unpublish") : t("publish")}
                </Button>

                <button
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={tCommon("more")}
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
                    >
                      <button
                        onClick={() => {
                          setMenuAnchor(null);
                          onReset();
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                      >
                        {tCommon("reset")}
                      </button>
                      <button
                        onClick={() => {
                          setMenuAnchor(null);
                          onDelete();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
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

// ============================================
// DESKTOP LAYOUT (3-COLUMN)
// ============================================
function DesktopLayout({
  questions,
  selectedQuestionId,
  setSelectedQuestionId,
  selectedQuestion,
  assignment,
  setAssignment,
  attachments,
  isReadOnly,
  totalPoints,
  pointsDifference,
  pointsMatch,
  validationErrors,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onAutoDistributePoints,
  onUploadFile,
  onAddLink,
  onDeleteAttachment,
  markDirty,
  t,
  tQuestions,
  tCommon,
  tValidation,
  tUpload,
  locale,
}: any) {
  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Left Sidebar - Questions Outline */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">{t("questionsOutline")}</h2>
            {!isReadOnly && (
              <Button
                onClick={onAddQuestion}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t("addQuestion")}
              </Button>
            )}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t("noQuestionsYet")}</p>
            {!isReadOnly && (
              <Button
                onClick={onAddQuestion}
                variant="secondary"
                size="sm"
                className="mt-3"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t("addFirstQuestion")}
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {questions.map((q: AssignmentQuestion, index: number) => (
              <QuestionOutlineItem
                key={q.id}
                question={q}
                index={index}
                isSelected={selectedQuestionId === q.id}
                onSelect={() => setSelectedQuestionId(q.id)}
                onMoveUp={() => onMoveQuestion(q.id, "up")}
                onMoveDown={() => onMoveQuestion(q.id, "down")}
                onDelete={() => onDeleteQuestion(q.id)}
                canMoveUp={index > 0}
                canMoveDown={index < questions.length - 1}
                isReadOnly={isReadOnly}
                locale={locale}
                tQuestions={tQuestions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Center - Question Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {selectedQuestion ? (
          <QuestionEditor
            key={selectedQuestion.id}
            question={selectedQuestion}
            onChange={(updates) => onUpdateQuestion(selectedQuestion.id, updates)}
            isReadOnly={isReadOnly}
            validationErrors={validationErrors.questions?.[selectedQuestion.id]}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{t("noQuestionsYet")}</p>
              {!isReadOnly && (
                <Button
                  onClick={onAddQuestion}
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t("addFirstQuestion")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Settings + Attachments */}
      <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Assignment Settings */}
          <AssignmentSettings
            assignment={assignment}
            setAssignment={setAssignment}
            totalPoints={totalPoints}
            pointsDifference={pointsDifference}
            pointsMatch={pointsMatch}
            onAutoDistributePoints={onAutoDistributePoints}
            isReadOnly={isReadOnly}
            markDirty={markDirty}
            validationErrors={validationErrors}
            t={t}
            tQuestions={tQuestions}
            tValidation={tValidation}
          />

          {/* Attachments */}
          <AttachmentsPanel
            attachments={attachments}
            onUploadFile={onUploadFile}
            onAddLink={onAddLink}
            onDeleteAttachment={onDeleteAttachment}
            isReadOnly={isReadOnly}
            t={t}
            tUpload={tUpload}
            tCommon={tCommon}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MOBILE LAYOUT (TABS)
// ============================================
function MobileLayout({
  mobileTab,
  setMobileTab,
  questionsDrawerOpen,
  setQuestionsDrawerOpen,
  questions,
  selectedQuestionId,
  setSelectedQuestionId,
  selectedQuestion,
  assignment,
  setAssignment,
  attachments,
  isReadOnly,
  totalPoints,
  pointsDifference,
  pointsMatch,
  validationErrors,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onAutoDistributePoints,
  onUploadFile,
  onAddLink,
  onDeleteAttachment,
  markDirty,
  t,
  tQuestions,
  tCommon,
  tValidation,
  tUpload,
  locale,
}: any) {
  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <Tabs
          value={mobileTab}
          onChange={(_, newValue) => setMobileTab(newValue)}
          variant="fullWidth"
        >
          <Tab label={t("questions")} value="questions" />
          <Tab label={t("settings")} value="settings" />
          <Tab label={t("attachments")} value="attachments" />
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {mobileTab === "questions" && (
          <div className="p-4">
            {/* Questions Button */}
            <Button
              onClick={() => setQuestionsDrawerOpen(true)}
              variant="secondary"
              size="sm"
              leftIcon={<Menu className="w-4 h-4" />}
              className="mb-4"
            >
              {t("questionsOutline")} ({questions.length})
            </Button>

            {selectedQuestion ? (
              <QuestionEditor
                key={selectedQuestion.id}
                question={selectedQuestion}
                onChange={(updates) => onUpdateQuestion(selectedQuestion.id, updates)}
                isReadOnly={isReadOnly}
                validationErrors={validationErrors.questions?.[selectedQuestion.id]}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">{t("noQuestionsYet")}</p>
                {!isReadOnly && (
                  <Button
                    onClick={onAddQuestion}
                    variant="primary"
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {t("addFirstQuestion")}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {mobileTab === "settings" && (
          <div className="p-4">
            <AssignmentSettings
              assignment={assignment}
              setAssignment={setAssignment}
              totalPoints={totalPoints}
              pointsDifference={pointsDifference}
              pointsMatch={pointsMatch}
              onAutoDistributePoints={onAutoDistributePoints}
              isReadOnly={isReadOnly}
              markDirty={markDirty}
              validationErrors={validationErrors}
              t={t}
              tQuestions={tQuestions}
              tValidation={tValidation}
            />
          </div>
        )}

        {mobileTab === "attachments" && (
          <div className="p-4">
            <AttachmentsPanel
              attachments={attachments}
              onUploadFile={onUploadFile}
              onAddLink={onAddLink}
              onDeleteAttachment={onDeleteAttachment}
              isReadOnly={isReadOnly}
              t={t}
              tUpload={tUpload}
              tCommon={tCommon}
            />
          </div>
        )}
      </div>

      {/* Questions Drawer */}
      <Drawer
        anchor="left"
        open={questionsDrawerOpen}
        onClose={() => setQuestionsDrawerOpen(false)}
      >
        <div className="w-80 h-full bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">{t("questionsOutline")}</h2>
              {!isReadOnly && (
                <Button
                  onClick={() => {
                    onAddQuestion();
                    setQuestionsDrawerOpen(false);
                  }}
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t("addQuestion")}
                </Button>
              )}
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t("noQuestionsYet")}</p>
            </div>
          ) : (
            <div className="p-2">
              {questions.map((q: AssignmentQuestion, index: number) => (
                <QuestionOutlineItem
                  key={q.id}
                  question={q}
                  index={index}
                  isSelected={selectedQuestionId === q.id}
                  onSelect={() => {
                    setSelectedQuestionId(q.id);
                    setQuestionsDrawerOpen(false);
                  }}
                  onMoveUp={() => onMoveQuestion(q.id, "up")}
                  onMoveDown={() => onMoveQuestion(q.id, "down")}
                  onDelete={() => onDeleteQuestion(q.id)}
                  canMoveUp={index > 0}
                  canMoveDown={index < questions.length - 1}
                  isReadOnly={isReadOnly}
                  locale={locale}
                  tQuestions={tQuestions}
                />
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}

// ============================================
// QUESTION OUTLINE ITEM
// ============================================
function QuestionOutlineItem({
  question,
  index,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  isReadOnly,
  locale,
  tQuestions,
}: {
  question: AssignmentQuestion;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isReadOnly: boolean;
  locale: string;
  tQuestions: (key: string) => string;
}) {
  const displayText =
    locale === "ar" ? question.questionTextAr : question.questionTextEn;

  const isValid = () => {
    if (question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") {
      const hasOptions = question.options && question.options.length >= 2;
      const hasCorrect = question.options?.some((o) => o.isCorrect);
      return hasOptions && hasCorrect;
    }
    return true;
  };

  const valid = isValid();

  return (
    <div
      className={`mb-2 p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">Q{index + 1}</span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                question.questionType === "MCQ_SINGLE"
                  ? "bg-blue-100 text-blue-700"
                  : question.questionType === "MCQ_MULTI"
                  ? "bg-purple-100 text-purple-700"
                  : question.questionType === "TRUE_FALSE"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {tQuestions(`question_types.${question.questionType}`)}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {question.points} {tQuestions("points")}
            </span>
          </div>
          <p className="text-sm text-gray-900 truncate">{displayText}</p>
        </div>

        <div className="flex items-center gap-1">
          {valid ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}

          {!isReadOnly && (
            <div className="flex flex-col">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                disabled={!canMoveUp}
                className={`p-0.5 ${
                  canMoveUp
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                disabled={!canMoveDown}
                className={`p-0.5 ${
                  canMoveDown
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="mt-2 text-xs text-red-600 hover:text-red-700"
        >
          {tQuestions("delete_question")}
        </button>
      )}
    </div>
  );
}

// ============================================
// ASSIGNMENT SETTINGS PANEL
// ============================================
function AssignmentSettings({
  assignment,
  setAssignment,
  totalPoints,
  pointsDifference,
  pointsMatch,
  onAutoDistributePoints,
  isReadOnly,
  markDirty,
  validationErrors,
  t,
  tQuestions,
  tValidation,
}: any) {
  const handleTitleChange = (value: { ar: string; en: string }) => {
    setAssignment({ ...assignment, titleAr: value.ar, titleEn: value.en });
    markDirty();
  };

  const handleDescriptionChange = (value: { ar: string; en: string }) => {
    setAssignment({ ...assignment, descriptionAr: value.ar, descriptionEn: value.en });
    markDirty();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          {t("assignmentDetails")}
        </h3>

        <div className="space-y-4">
          <div>
            <BilingualTextField
              label={tQuestions("title")}
              value={{ ar: assignment.titleAr, en: assignment.titleEn }}
              onChange={handleTitleChange}
              requiredAr
              requiredEn
              disabled={isReadOnly}
              placeholder={{
                ar: "عنوان الواجب",
                en: "Assignment title",
              }}
            />
            {validationErrors?.titleAr && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.titleAr}</span>
              </div>
            )}
            {validationErrors?.titleEn && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.titleEn}</span>
              </div>
            )}
          </div>

          <div>
            <BilingualTextField
              label={tQuestions("description")}
              value={{
                ar: assignment.descriptionAr || "",
                en: assignment.descriptionEn || "",
              }}
              onChange={handleDescriptionChange}
              disabled={isReadOnly}
              placeholder={{
                ar: "وصف الواجب (اختياري)",
                en: "Assignment description (optional)",
              }}
            />
            {validationErrors?.descriptionAr && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.descriptionAr}</span>
              </div>
            )}
            {validationErrors?.descriptionEn && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.descriptionEn}</span>
              </div>
            )}
          </div>

          <DatePicker
            label={tQuestions("due_date")}
            value={assignment.dueDate || null}
            onChange={(date) => {
              setAssignment({ ...assignment, dueDate: date });
              markDirty();
            }}
            disabled={isReadOnly}
          />

          <div>
            <Input
              label={tQuestions("max_score")}
              type="number"
              value={assignment.maxScore ?? 0}
              onChange={(e) => {
                setAssignment({ ...assignment, maxScore: Number(e.target.value) });
                markDirty();
              }}
              disabled={isReadOnly}
              min={0}
              required
            />
            {validationErrors?.maxScore && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.maxScore}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* General Errors */}
      {validationErrors?.general && validationErrors.general.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-error="true">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">{tValidation("validation_failed")}</p>
              <ul className="text-xs text-red-700 space-y-1">
                {validationErrors.general.map((error: string, index: number) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Points Summary */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("pointsSummary")}</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{tQuestions("max_score")}:</span>
            <span className="font-medium">{assignment.maxScore ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{tQuestions("total_points")}:</span>
            <span className="font-medium">{totalPoints}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600">{tQuestions("difference")}:</span>
            <span
              className={`font-medium ${
                pointsMatch ? "text-green-600" : "text-red-600"
              }`}
            >
              {pointsDifference > 0 ? `+${pointsDifference}` : pointsDifference}
            </span>
          </div>

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

          {!isReadOnly && !pointsMatch && (
            <Button
              onClick={onAutoDistributePoints}
              variant="secondary"
              size="sm"
              className="w-full mt-2"
            >
              {tQuestions("auto_distribute")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ATTACHMENTS PANEL
// ============================================
function AttachmentsPanel({
  attachments,
  onUploadFile,
  onAddLink,
  onDeleteAttachment,
  isReadOnly,
  t,
  tUpload,
  tCommon,
}: any) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  const handleAddLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError("Title and URL are required");
      return;
    }

    if (!validateHttpUrl(linkUrl)) {
      setLinkError("Invalid URL");
      return;
    }

    try {
      await onAddLink(linkTitle, normalizeUrl(linkUrl));
      setShowLinkDialog(false);
      setLinkTitle("");
      setLinkUrl("");
      setLinkError("");
    } catch (error) {
      setLinkError("Failed to add link");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          {t("attachments")}
        </h3>

        {!isReadOnly && (
          <div className="mb-4">
            <DragDropUploadArea
              title={tUpload("dragHereTitle")}
              subtitle={tUpload("dragHereSubtitle")}
              onFilesSelected={(files) => {
                if (files.length > 0) {
                  onUploadFile(files[0]).catch(() => {
                    // Error handled in parent
                  });
                }
              }}
              accept="*"
              maxSizeBytes={50 * 1024 * 1024}
            />

            <Button
              onClick={() => setShowLinkDialog(true)}
              variant="secondary"
              size="sm"
              className="w-full mt-2"
            >
              {tUpload("addLink")}
            </Button>
          </div>
        )}

        {attachments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            {tUpload("noAttachments")}
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment: AssignmentAttachment) => (
              <AttachmentListItem
                key={attachment.id}
                icon={<Paperclip className="w-5 h-5" />}
                title={attachment.type === "FILE" ? attachment.fileName || "File" : attachment.title || "Link"}
                subtitle={attachment.type === "LINK" ? attachment.url : undefined}
                onClick={
                  attachment.type === "FILE"
                    ? () => window.open(attachment.url, "_blank")
                    : () => window.open(attachment.url, "_blank")
                }
                actions={
                  !isReadOnly
                    ? [
                        {
                          label: tCommon("delete"),
                          onClick: () => onDeleteAttachment(attachment.id),
                          color: "error" as const,
                        },
                      ]
                    : []
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{tUpload("addLink")}</h3>

            <div className="space-y-4">
              <Input
                label={tUpload("linkTitle")}
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Enter link title"
              />

              <Input
                label={tUpload("linkUrl")}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                error={linkError}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkTitle("");
                  setLinkUrl("");
                  setLinkError("");
                }}
                variant="secondary"
              >
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleAddLink} variant="primary">
                {tCommon("add")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
