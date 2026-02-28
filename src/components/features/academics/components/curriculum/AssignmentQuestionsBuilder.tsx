"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileQuestion,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
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
import QuestionDrawer from "./QuestionDrawer";
import QuestionCard from "./QuestionCard";

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
        <div className="space-y-3">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isSelected={false}
              isReadOnly={isReadOnly}
              onClick={() => {
                if (!isReadOnly) {
                  setEditingQuestion(question);
                  setShowQuestionDialog(true);
                }
              }}
              onEdit={() => {
                setEditingQuestion(question);
                setShowQuestionDialog(true);
              }}
              onDelete={() => {
                setQuestionToDelete(question);
                setShowDeleteDialog(true);
              }}
            />
          ))}
        </div>
      )}

      {showQuestionDialog && (
        <QuestionDrawer
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
