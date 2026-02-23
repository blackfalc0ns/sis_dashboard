"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import {
  Assignment,
  AssignmentQuestion,
  fetchAssignmentQuestions,
  createAssignmentQuestion,
  updateAssignmentQuestion,
  deleteAssignmentQuestion,
  bulkUpdateQuestionPoints,
} from "@/services/academics/curriculumService";
import { distributePoints } from "@/utils/scoring/distributePoints";
import QuestionDialog from "./QuestionDialog";

interface AssignmentQuestionsBuilderProps {
  assignment: Assignment;
  isReadOnly: boolean;
  onQuestionsChange?: () => void;
}

export default function AssignmentQuestionsBuilder({
  assignment,
  isReadOnly,
  onQuestionsChange,
}: AssignmentQuestionsBuilderProps) {
  const t = useTranslations("academics.curriculum.questions");
  const tSuccess = useTranslations("success");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssignmentQuestion | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<AssignmentQuestion | null>(null);
  const [showAutoDistributeDialog, setShowAutoDistributeDialog] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );

  useEffect(() => {
    loadQuestions();
  }, [assignment.id]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await fetchAssignmentQuestions(assignment.id);
      setQuestions(data);
    } catch (error) {
      console.error("Failed to load questions:", error);
      showSnackbar(tErrors("load_failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate points summary
  const pointsSummary = useMemo(() => {
    const maxScore = assignment.maxScore ?? 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const difference = maxScore - totalPoints;
    const isMatch = difference === 0;

    return {
      maxScore,
      totalPoints,
      difference,
      isMatch,
    };
  }, [assignment.maxScore, questions]);

  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

  const handleSaveQuestion = async (data: Partial<AssignmentQuestion>) => {
    try {
      if (editingQuestion) {
        await updateAssignmentQuestion(editingQuestion.id, data);
      } else {
        await createAssignmentQuestion(assignment.id, data as Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt" | "order">);
      }
      await loadQuestions();
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      onQuestionsChange?.();
    } catch (error) {
      console.error("Failed to save question:", error);
      throw error;
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      await deleteAssignmentQuestion(questionToDelete.id);
      await loadQuestions();
      setShowDeleteDialog(false);
      setQuestionToDelete(null);
      onQuestionsChange?.();
    } catch (error) {
      console.error("Failed to delete question:", error);
      showSnackbar(tErrors("delete_failed"), "error");
    }
  };

  const handleAutoDistribute = async () => {
    if (questions.length === 0 || pointsSummary.maxScore === undefined) return;

    setIsDistributing(true);
    
    // Store original points for rollback
    const originalPoints = questions.map(q => ({ id: q.id, points: q.points }));

    try {
      // Calculate new distribution
      const distributed = distributePoints(
        pointsSummary.maxScore,
        questions.map(q => ({ id: q.id, points: q.points, order: q.order }))
      );

      // Update UI optimistically
      const updatedQuestions = questions.map(q => {
        const newPoints = distributed.find(d => d.id === q.id);
        return newPoints ? { ...q, points: newPoints.points } : q;
      });
      setQuestions(updatedQuestions);

      // Persist to backend
      await bulkUpdateQuestionPoints(
        assignment.id,
        distributed.map(d => ({ questionId: d.id, points: d.points }))
      );

      showSnackbar(tSuccess("pointsUpdated"), "success");
      setShowAutoDistributeDialog(false);
      onQuestionsChange?.();
    } catch (error) {
      console.error("Failed to distribute points:", error);
      
      // Rollback on error
      const rolledBack = questions.map(q => {
        const original = originalPoints.find(o => o.id === q.id);
        return original ? { ...q, points: original.points } : q;
      });
      setQuestions(rolledBack);
      
      showSnackbar(tErrors("pointsUpdateFailed"), "error");
    } finally {
      setIsDistributing(false);
    }
  };

  const getDisplayText = (question: AssignmentQuestion) => {
    return locale === "ar"
      ? question.questionTextAr || question.questionTextEn
      : question.questionTextEn || question.questionTextAr;
  };

  const canAutoDistribute =
    !isReadOnly &&
    questions.length > 0 &&
    pointsSummary.maxScore !== undefined &&
    pointsSummary.maxScore >= 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Points Summary Header */}
      <div className="bg-gray-50 border border-border rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-3">{t("summary_title")}</h4>
        
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">{t("max_score")}</div>
            <div className="text-lg font-semibold">
              {pointsSummary.maxScore ?? "—"}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">{t("total_points")}</div>
            <div className="text-lg font-semibold">
              {pointsSummary.totalPoints}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">{t("difference")}</div>
            <div className={`text-lg font-semibold ${
              pointsSummary.isMatch ? "text-green-600" : "text-orange-600"
            }`}>
              {pointsSummary.difference > 0 ? "+" : ""}{pointsSummary.difference}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pointsSummary.isMatch ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">{t("points_match")}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-600">{t("points_mismatch")}</span>
              </>
            )}
          </div>

          {/* Auto Distribute Button */}
          {canAutoDistribute && !pointsSummary.isMatch && (
            <Button
              onClick={() => setShowAutoDistributeDialog(true)}
              variant="primary"
              size="sm"
              leftIcon={<Zap className="w-4 h-4" />}
            >
              {t("auto_distribute")}
            </Button>
          )}
        </div>

        {/* Mismatch Warning */}
        {!pointsSummary.isMatch && questions.length > 0 && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {t("points_sum_mismatch")}
          </div>
        )}
      </div>

      {/* Add Question Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t("title")}</h3>
        {!isReadOnly && (
          <Button
            onClick={() => {
              setEditingQuestion(null);
              setShowQuestionDialog(true);
            }}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("add_question")}
          </Button>
        )}
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{t("no_questions")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="border border-border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Q{index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {t(`question_types.${question.questionType}`)}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {question.points} {t("points")}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2">
                    {getDisplayText(question)}
                  </p>

                  {/* Show options for MCQ questions */}
                  {(question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") && 
                   question.options && question.options.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1">
                      {question.options
                        .sort((a, b) => a.order - b.order)
                        .map((option, optIndex) => {
                          const optionText = locale === "ar" 
                            ? option.textAr || option.textEn 
                            : option.textEn || option.textAr;
                          return (
                            <div key={option.id} className="flex items-center gap-2 text-sm">
                              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                                option.isCorrect 
                                  ? "bg-green-100 text-green-700 font-semibold" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className={option.isCorrect ? "font-medium" : ""}>
                                {optionText}
                              </span>
                              {option.isCorrect && (
                                <span className="text-xs text-green-600">✓</span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {!isReadOnly && (
                  <DropdownMenu
                    trigger={
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    }
                    items={[
                      {
                        label: t("edit_question"),
                        value: "edit",
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                          setEditingQuestion(question);
                          setShowQuestionDialog(true);
                        },
                      },
                      {
                        label: t("delete_question"),
                        value: "delete",
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: () => {
                          setQuestionToDelete(question);
                          setShowDeleteDialog(true);
                        },
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Dialog */}
      {showQuestionDialog && (
        <QuestionDialog
          isOpen={showQuestionDialog}
          onClose={() => {
            setShowQuestionDialog(false);
            setEditingQuestion(null);
          }}
          onSave={handleSaveQuestion}
          question={editingQuestion}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setQuestionToDelete(null);
        }}
        onConfirm={handleDeleteQuestion}
        title={t("delete_question")}
        description={t("delete_question_confirm")}
        confirmLabel={t("delete_question")}
        cancelLabel="Cancel"
        severity="danger"
      />

      {/* Auto Distribute Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showAutoDistributeDialog}
        onClose={() => setShowAutoDistributeDialog(false)}
        onConfirm={handleAutoDistribute}
        title={t("confirm_auto_distribute_title")}
        description={t("confirm_auto_distribute_body")}
        confirmLabel={t("auto_distribute")}
        cancelLabel="Cancel"
        loading={isDistributing}
        severity="warning"
      />

      {/* Snackbar */}
      {snackbar && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
            snackbar.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
