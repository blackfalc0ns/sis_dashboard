"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  FileQuestion,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import AssignmentSummaryBar from "./AssignmentSummaryBar";
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
  const t = useTranslations("academics.curriculum.assignments");
  const tQuestions = useTranslations("academics.curriculum.questions");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    const originalPoints = questions.map(q => ({ id: q.id, points: q.points }));

    try {
      const distributed = distributePoints(
        pointsSummary.maxScore,
        questions.map(q => ({ id: q.id, points: q.points, order: q.order }))
      );

      const updatedQuestions = questions.map(q => {
        const newPoints = distributed.find(d => d.id === q.id);
        return newPoints ? { ...q, points: newPoints.points } : q;
      });
      setQuestions(updatedQuestions);

      await bulkUpdateQuestionPoints(
        assignment.id,
        distributed.map(d => ({ questionId: d.id, points: d.points }))
      );

      showSnackbar(tSuccess("pointsUpdated"), "success");
      setShowAutoDistributeDialog(false);
      onQuestionsChange?.();
    } catch (error) {
      console.error("Failed to distribute points:", error);
      
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
      {/* Compact Summary Bar */}
      <AssignmentSummaryBar
        maxScore={pointsSummary.maxScore}
        totalPoints={pointsSummary.totalPoints}
        difference={pointsSummary.difference}
        isMatch={pointsSummary.isMatch}
        canAutoDistribute={canAutoDistribute}
        onAutoDistribute={() => setShowAutoDistributeDialog(true)}
        isReadOnly={isReadOnly}
      />

      {/* Sticky Add Question Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{tQuestions("title")}</h3>
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
              {tQuestions("add_question")}
            </Button>
          )}
        </div>
      </div>

      {/* Questions List or Empty State */}
      {questions.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FileQuestion className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {t("noQuestionsTitle")}
          </h4>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            {t("noQuestionsBody")}
          </p>
          {!isReadOnly && (
            <Button
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionDialog(true);
              }}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("addFirstQuestion")}
            </Button>
          )}
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
                      {tQuestions(`question_types.${question.questionType}`)}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {question.points} {tQuestions("points")}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2">
                    {getDisplayText(question)}
                  </p>

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
                        label: tQuestions("edit_question"),
                        value: "edit",
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                          setEditingQuestion(question);
                          setShowQuestionDialog(true);
                        },
                      },
                      {
                        label: tQuestions("delete_question"),
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setQuestionToDelete(null);
        }}
        onConfirm={handleDeleteQuestion}
        title={tQuestions("delete_question")}
        description={tQuestions("delete_question_confirm")}
        confirmLabel={tQuestions("delete_question")}
        cancelLabel="Cancel"
        severity="danger"
      />

      <ConfirmDialog
        isOpen={showAutoDistributeDialog}
        onClose={() => setShowAutoDistributeDialog(false)}
        onConfirm={handleAutoDistribute}
        title={tQuestions("confirm_auto_distribute_title")}
        description={tQuestions("confirm_auto_distribute_body")}
        confirmLabel={tQuestions("auto_distribute")}
        cancelLabel="Cancel"
        loading={isDistributing}
        severity="warning"
      />

      {snackbar && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
            snackbar.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white z-50`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
