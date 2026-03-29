"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import MainLoader from "@/components/ui/loaders/MainLoader";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ValidationErrors } from "@/features/academics/curriculum/types/types";
import { calculatePointsSummary } from "@/features/academics/curriculum/utils/points";
import { validateQuestion } from "@/features/academics/curriculum/utils/validation";
import AssessmentQuestionBuilderHeader from "../components/AssessmentQuestionBuilderHeader";
import AssessmentQuestionDesktopLayout from "../components/AssessmentQuestionDesktopLayout";
import AssessmentQuestionMobileLayout from "../components/AssessmentQuestionMobileLayout";
import {
  bulkUpdateAssessmentQuestionPoints,
  createAssessmentQuestion,
  createAssessmentWithQuestions,
  deleteAssessmentQuestion,
  fetchAssessmentById,
  fetchAssessmentQuestions,
  reorderAssessmentQuestions,
  updateAssessment,
  updateAssessmentQuestion,
} from "../services/gradesAssessmentsService";
import type { Assessment, AssessmentDeliveryMode, AssessmentQuestion, AssessmentType } from "../types";

interface AssessmentQuestionsPageProps {
  assessmentId?: string;
  mode?: "create" | "edit";
}

function validateAssessmentDraft(
  assessment: Assessment,
  questions: AssessmentQuestion[],
  tValidation: (key: string) => string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const general: string[] = [];

  if (!assessment.titleAr.trim()) {
    errors.titleAr = tValidation("required_ar");
  }
  if (!assessment.title.trim()) {
    errors.titleEn = tValidation("required_en");
  }
  if (assessment.maxScore <= 0) {
    errors.maxScore = tValidation("invalid_max_score");
  }
  if (questions.length === 0) {
    general.push(tValidation("at_least_one_question"));
  }

  const questionErrors: Record<string, ReturnType<typeof validateQuestion>> = {};
  questions.forEach((question) => {
    const nextErrors = validateQuestion(question as AssignmentQuestion, tValidation);
    if (Object.keys(nextErrors).length > 0) {
      questionErrors[question.id] = nextErrors;
    }
  });

  if (Object.keys(questionErrors).length > 0) {
    errors.questions = questionErrors;
  }
  if (general.length > 0) {
    errors.general = general;
  }

  return errors;
}

export default function AssessmentQuestionsPage({
  assessmentId,
  mode = "edit",
}: AssessmentQuestionsPageProps) {
  const t = useTranslations("academics.grades.questions");
  const tGrades = useTranslations("academics.grades");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"), { noSsr: true, defaultMatches: false });
  const { showError, showSuccess } = useToast();

  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentDraft, setAssessmentDraft] = useState<Assessment | null>(null);
  const [lastSavedAssessment, setLastSavedAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState<AssessmentQuestion | null>(null);
  const [lastSavedQuestion, setLastSavedQuestion] = useState<AssessmentQuestion | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);
  const [isQuestionSaving, setIsQuestionSaving] = useState(false);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<string | null>(null);
  const [tempQuestionCounter, setTempQuestionCounter] = useState(0);
  const scopeTypeParam = (searchParams.get("scopeType") as Assessment["scopeType"]) || "school";
  const scopeIdParam = searchParams.get("scopeId") || "";
  const subjectIdParam = searchParams.get("subjectId") || "";
  const typeParam = (searchParams.get("type") as AssessmentType) || "QUIZ";
  const titleParam = searchParams.get("title") || "";
  const titleArParam = searchParams.get("titleAr") || "";
  const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const weightParam = Number(searchParams.get("weight") || "15");
  const maxScoreParam = Number(searchParams.get("maxScore") || "20");
  const deliveryModeParam =
    (searchParams.get("deliveryMode") as AssessmentDeliveryMode) || "QUESTION_BASED";

  const isReadOnly = termStatus === "closed";
  const isCreateMode = mode === "create";

  useEffect(() => {
    const initialize = async () => {
      const years = await fetchAcademicYears();
      const urlYear = searchParams.get("year");
      const urlTerm = searchParams.get("term");
      const year = years.find((item) => item.id === urlYear) || years[0];
      if (!year) {
        setIsLoading(false);
        return;
      }

      const yearTerms = await fetchTermsByYear(year.id);
      const term = yearTerms.find((item) => item.id === urlTerm) || yearTerms.find((item) => item.status === "open") || yearTerms[0];
      if (!term) {
        setIsLoading(false);
        return;
      }

      setAcademicYearId(year.id);
      setTermId(term.id);
      setTerms(yearTerms);
      setTermStatus(term.status);

      const params = new URLSearchParams(searchParams.toString());
      params.set("year", year.id);
      params.set("term", term.id);
      router.replace(`?${params.toString()}`, { scroll: false });
      setIsLoading(false);
    };

    void initialize();
  }, [router, searchParams]);

  const refresh = useCallback(async () => {
    if (!academicYearId || !termId || !assessmentId) {
      return;
    }

    setIsDataLoading(true);
    try {
      const [nextAssessment, nextQuestions] = await Promise.all([
        fetchAssessmentById(academicYearId, termId, assessmentId),
        fetchAssessmentQuestions(academicYearId, termId, assessmentId),
      ]);
      setAssessment(nextAssessment);
      setAssessmentDraft(nextAssessment);
      setLastSavedAssessment(nextAssessment);
      setQuestions(nextQuestions);
      setSelectedQuestionId((current) =>
        current && nextQuestions.some((question) => question.id === current)
          ? current
          : nextQuestions[0]?.id || null,
      );
    } catch {
      showError(tCommon("error_loading"));
    } finally {
      setIsDataLoading(false);
    }
  }, [academicYearId, assessmentId, showError, tCommon, termId]);

  useEffect(() => {
    if (isCreateMode) {
      if (!termId || assessmentDraft) {
        return;
      }

      const baseAssessment: Assessment = {
        id: "draft-assessment",
        termId,
        scopeType: scopeTypeParam,
        scopeId: scopeIdParam,
        subjectId: subjectIdParam,
        title: titleParam,
        titleAr: titleArParam,
        type: typeParam,
        deliveryMode: "QUESTION_BASED",
        date: dateParam,
        weight: Number.isFinite(weightParam) && weightParam > 0 ? weightParam : 15,
        maxScore: Number.isFinite(maxScoreParam) && maxScoreParam > 0 ? maxScoreParam : 20,
        approvalStatus: "draft",
        isLocked: false,
      };
      setAssessment(baseAssessment);
      setAssessmentDraft(baseAssessment);
      setLastSavedAssessment(baseAssessment);
      setQuestions([]);
      setSelectedQuestionId(null);
      setIsDataLoading(false);
      return;
    }

    void refresh();
  }, [
    assessmentDraft,
    dateParam,
    deliveryModeParam,
    isCreateMode,
    maxScoreParam,
    refresh,
    scopeIdParam,
    scopeTypeParam,
    subjectIdParam,
    termId,
    titleArParam,
    titleParam,
    typeParam,
    weightParam,
  ]);

  useEffect(() => {
    if (!isCreateMode || !termId) {
      return;
    }
    setAssessment((current) =>
      current
        ? {
            ...current,
            termId,
            scopeType: scopeTypeParam || current.scopeType,
            scopeId: scopeIdParam || current.scopeId,
            subjectId: subjectIdParam || current.subjectId,
          }
        : current,
    );
    setAssessmentDraft((current) =>
      current
        ? {
            ...current,
            termId,
            scopeType: scopeTypeParam || current.scopeType,
            scopeId: scopeIdParam || current.scopeId,
            subjectId: subjectIdParam || current.subjectId,
          }
        : current,
    );
  }, [isCreateMode, scopeIdParam, scopeTypeParam, subjectIdParam, termId]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!selectedQuestionId) {
      setQuestionDraft(null);
      setLastSavedQuestion(null);
      return;
    }
    const selectedQuestion = questions.find((question) => question.id === selectedQuestionId) || null;
    setQuestionDraft(selectedQuestion);
    setLastSavedQuestion(selectedQuestion);
  }, [selectedQuestionId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!selectedQuestionId) {
      return;
    }
    const selectedQuestion = questions.find((question) => question.id === selectedQuestionId) || null;
    if (!selectedQuestion) {
      setQuestionDraft(null);
      setLastSavedQuestion(null);
      return;
    }
    setQuestionDraft((current) =>
      current && current.id === selectedQuestion.id ? current : selectedQuestion,
    );
    setLastSavedQuestion((current) =>
      current && current.id === selectedQuestion.id ? current : selectedQuestion,
    );
  }, [questions, selectedQuestionId]);

  const pointsSummary = useMemo(
    () => calculatePointsSummary(assessmentDraft?.maxScore || 0, questions as AssignmentQuestion[]),
    [assessmentDraft?.maxScore, questions],
  );

  useEffect(() => {
    if (!assessmentDraft) return;
    setValidationErrors(validateAssessmentDraft(assessmentDraft, questions, tValidation));
  }, [assessmentDraft, questions, tValidation]);

  const isAssessmentDirty = useMemo(() => {
    if (!assessmentDraft || !lastSavedAssessment) return false;
    return JSON.stringify(assessmentDraft) !== JSON.stringify(lastSavedAssessment);
  }, [assessmentDraft, lastSavedAssessment]);

  const isQuestionDirty = useMemo(() => {
    if (!questionDraft || !lastSavedQuestion) return false;
    return JSON.stringify(questionDraft) !== JSON.stringify(lastSavedQuestion);
  }, [questionDraft, lastSavedQuestion]);

  const canSaveAssessment = useMemo(() => {
    if (isCreateMode) {
      return Boolean(assessmentDraft?.title.trim() || assessmentDraft?.titleAr.trim() || questions.length > 0);
    }
    return isAssessmentDirty;
  }, [assessmentDraft, isAssessmentDirty, isCreateMode, questions.length]);

  const handleAcademicYearChange = async (yearId: string) => {
    const nextTerms = await fetchTermsByYear(yearId);
    const nextTerm = nextTerms.find((item) => item.status === "open") || nextTerms[0];
    if (!nextTerm) return;
    setAcademicYearId(yearId);
    setTerms(nextTerms);
    setTermId(nextTerm.id);
    setTermStatus(nextTerm.status);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", yearId);
    params.set("term", nextTerm.id);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleTermChange = (nextTermId: string) => {
    const nextTerm = terms.find((item) => item.id === nextTermId);
    if (!nextTerm) return;
    setTermId(nextTermId);
    setTermStatus(nextTerm.status);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", academicYearId);
    params.set("term", nextTermId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const params = searchParams.toString();
    const path = isCreateMode
      ? `/${locale}/grades/assessments/new`
      : `/${locale}/grades/assessments`;
    router.push(params ? `${path}?${params}` : path);
  };

  const handleSaveAssessment = async () => {
    if (!assessmentDraft || (!isCreateMode && !assessment) || (!isCreateMode && !isAssessmentDirty)) return;
    const nextValidationErrors = validateAssessmentDraft(assessmentDraft, questions, tValidation);
    setValidationErrors(nextValidationErrors);
    if (
      Object.keys(nextValidationErrors).length > 0 ||
      (nextValidationErrors.general && nextValidationErrors.general.length > 0)
    ) {
      showError(tValidation("fix_errors_before_save"));
      return;
    }
    try {
      setIsAssignmentSaving(true);
      if (isCreateMode) {
        const createdAssessment = await createAssessmentWithQuestions(academicYearId, {
          assessment: {
            termId,
            scopeType: assessmentDraft.scopeType,
            scopeId: assessmentDraft.scopeId,
            subjectId: assessmentDraft.subjectId,
            title: assessmentDraft.title,
            titleAr: assessmentDraft.titleAr,
            type: assessmentDraft.type as "QUIZ" | "MONTH_EXAM" | "MIDTERM" | "TERM_EXAM",
            deliveryMode: "QUESTION_BASED",
            date: assessmentDraft.date,
            weight: assessmentDraft.weight,
            maxScore: assessmentDraft.maxScore,
          },
          questions: questions.map((question) => ({
            questionTextAr: question.questionTextAr,
            questionTextEn: question.questionTextEn,
            questionType: question.questionType,
            points: question.points,
            options: question.options,
            correctAnswer: question.correctAnswer,
            sampleAnswerAr: question.sampleAnswerAr,
            sampleAnswerEn: question.sampleAnswerEn,
          })),
        });

        showSuccess(tGrades("messages.assessmentCreated"));
        const params = searchParams.toString();
        const path = `/${locale}/grades/assessments/${createdAssessment.id}/questions`;
        router.replace(params ? `${path}?${params}` : path);
        return;
      }

      const nextAssessment = await updateAssessment(academicYearId, termId, assessment!.id, {
        termId,
        scopeType: assessmentDraft.scopeType,
        scopeId: assessmentDraft.scopeId,
        subjectId: assessment!.subjectId,
        title: assessmentDraft.title,
        titleAr: assessmentDraft.titleAr,
        type: assessment!.type as "QUIZ" | "MONTH_EXAM" | "MIDTERM" | "TERM_EXAM",
        deliveryMode: assessment!.deliveryMode,
        date: assessmentDraft.date,
        weight: assessment!.weight,
        maxScore: assessmentDraft.maxScore,
      });
      setAssessment(nextAssessment);
      setAssessmentDraft(nextAssessment);
      setLastSavedAssessment(nextAssessment);
      showSuccess(tCommon("save_success"));
    } catch (error) {
      showError(tGrades(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsAssignmentSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (isCreateMode) {
      const nextIndex = tempQuestionCounter + 1;
      setTempQuestionCounter(nextIndex);
      const tempId = `temp-question-${nextIndex}`;
      const nextQuestion: AssessmentQuestion = {
        id: tempId,
        assessmentId: "draft-assessment",
        assignmentId: "draft-assessment",
        createdAt: new Date().toISOString(),
        order: questions.length + 1,
        questionTextAr: "",
        questionTextEn: "",
        questionType: "MCQ_SINGLE",
        points: 0,
        options: [
          { id: `opt-${nextIndex}-1`, textAr: "", textEn: "", isCorrect: true, order: 1 },
          { id: `opt-${nextIndex}-2`, textAr: "", textEn: "", isCorrect: false, order: 2 },
        ],
      };
      setQuestions((current) => [...current, nextQuestion]);
      setSelectedQuestionId(tempId);
      setQuestionDraft(nextQuestion);
      setLastSavedQuestion(nextQuestion);
      return;
    }
    try {
      const nextQuestion = await createAssessmentQuestion(academicYearId, termId, assessmentId!, {
        questionTextAr: "",
        questionTextEn: "",
        questionType: "MCQ_SINGLE",
        points: 0,
        options: [
          { id: `opt-${Date.now()}-1`, textAr: "", textEn: "", isCorrect: true, order: 1 },
          { id: `opt-${Date.now()}-2`, textAr: "", textEn: "", isCorrect: false, order: 2 },
        ],
      });
      await refresh();
      setSelectedQuestionId(nextQuestion.id);
    } catch (error) {
      showError(tGrades(`errors.${error instanceof Error ? error.message : "generic"}`));
    }
  };

  const handleUpdateQuestionDraft = (questionId: string, updates: Partial<AssignmentQuestion>) => {
    if (!questionDraft || questionDraft.id !== questionId) return;
    const nextQuestion = { ...questionDraft, ...updates };
    setQuestionDraft(nextQuestion);
    setQuestions((current) => current.map((question) => (question.id === questionId ? { ...question, ...updates } : question)));
  };

  const handleSaveQuestion = async () => {
    if (!questionDraft || !isQuestionDirty) return;
    const errors = validateQuestion(questionDraft as AssignmentQuestion, tValidation);
    if (Object.keys(errors).length > 0) {
      setValidationErrors((current) => ({
        ...current,
        questions: {
          ...(current.questions || {}),
          [questionDraft.id]: errors,
        },
      }));
      showError(tValidation("fix_errors_before_save"));
      return;
    }

    try {
      if (isCreateMode) {
        setQuestions((current) => current.map((question) => (question.id === questionDraft.id ? questionDraft : question)));
        setLastSavedQuestion(questionDraft);
        showSuccess(tCommon("save_success"));
        return;
      }
      setIsQuestionSaving(true);
      const saved = await updateAssessmentQuestion(academicYearId, termId, questionDraft.id, {
        questionTextAr: questionDraft.questionTextAr,
        questionTextEn: questionDraft.questionTextEn,
        questionType: questionDraft.questionType,
        points: questionDraft.points,
        options: questionDraft.options,
        correctAnswer: questionDraft.correctAnswer,
        sampleAnswerAr: questionDraft.sampleAnswerAr,
        sampleAnswerEn: questionDraft.sampleAnswerEn,
      });
      setQuestions((current) => current.map((question) => (question.id === saved.id ? saved : question)));
      setQuestionDraft(saved);
      setLastSavedQuestion(saved);
      const nextAssessment = await fetchAssessmentById(academicYearId, termId, assessmentId!);
      if (nextAssessment) {
        setAssessment(nextAssessment);
        setAssessmentDraft(nextAssessment);
        setLastSavedAssessment(nextAssessment);
      }
      showSuccess(tCommon("save_success"));
    } catch (error) {
      showError(tGrades(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (isCreateMode) {
      setQuestions((current) =>
        current
          .filter((question) => question.id !== questionId)
          .map((question, index) => ({ ...question, order: index + 1 })),
      );
      setSelectedQuestionId((current) => (current === questionId ? null : current));
      showSuccess(t("messages.deleted"));
      return;
    }
    try {
      await deleteAssessmentQuestion(academicYearId, termId, questionId);
      await refresh();
      showSuccess(t("messages.deleted"));
    } catch (error) {
      showError(tGrades(`errors.${error instanceof Error ? error.message : "generic"}`));
    }
  };

  const handleMoveQuestion = async (questionId: string, direction: "up" | "down") => {
    const index = questions.findIndex((question) => question.id === questionId);
    if ((direction === "up" && index === 0) || (direction === "down" && index === questions.length - 1)) {
      return;
    }
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...questions];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    if (isCreateMode) {
      setQuestions(reordered.map((question, orderIndex) => ({ ...question, order: orderIndex + 1 })));
      return;
    }
    await reorderAssessmentQuestions(academicYearId, termId, assessmentId!, reordered.map((question) => question.id));
    setQuestions(reordered.map((question, orderIndex) => ({ ...question, order: orderIndex + 1 })));
  };

  const handleAutoDistributePoints = async () => {
    const maxScore = assessmentDraft?.maxScore || 0;
    const questionCount = questions.length;
    if (maxScore <= 0 || questionCount === 0) return;

    const base = Math.floor(maxScore / questionCount);
    const remainder = maxScore % questionCount;
    const updates = questions.map((question, index) => ({
      questionId: question.id,
      points: index < remainder ? base + 1 : base,
    }));
    if (isCreateMode) {
      setQuestions((current) =>
        current.map((question) => {
          const nextUpdate = updates.find((item) => item.questionId === question.id);
          return nextUpdate ? { ...question, points: nextUpdate.points } : question;
        }),
      );
      setAssessmentDraft((current) => (current ? { ...current, maxScore } : current));
      showSuccess(t("messages.pointsUpdated"));
      return;
    }
    await bulkUpdateAssessmentQuestionPoints(academicYearId, termId, assessmentId!, updates);
    await refresh();
    showSuccess(t("messages.pointsUpdated"));
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><MainLoader /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      {assessment && (
        <AssessmentQuestionBuilderHeader
          assessment={assessmentDraft || assessment}
          isReadOnly={isReadOnly}
          isAssessmentDirty={isAssessmentDirty}
          isQuestionDirty={isQuestionDirty}
          isAssignmentSaving={isAssignmentSaving}
          isQuestionSaving={isQuestionSaving}
          onBack={handleBack}
          saveLabel={isCreateMode ? tGrades("actions.createAssessment") : undefined}
          canSaveAssessment={canSaveAssessment}
          onSaveAssessment={() => void handleSaveAssessment()}
        />
      )}

      {!assessment ? (
        <div className="p-6">
          <div className="rounded-xl border p-6 text-sm" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-secondary)" }}>
            {isCreateMode ? tGrades("emptyState.selectFilters") : t("notFound")}
          </div>
        </div>
      ) : !isCreateMode && assessment.deliveryMode !== "QUESTION_BASED" ? (
        <div className="p-6">
          <div
            className="rounded-xl border p-6 text-sm"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--surface-color)",
              color: "var(--text-secondary)",
            }}
          >
            {t("notQuestionBased")}
          </div>
        </div>
      ) : isDataLoading && questions.length === 0 ? (
        <div className="flex h-[calc(100vh-73px)] items-center justify-center"><MainLoader /></div>
      ) : isMobile ? (
        <AssessmentQuestionMobileLayout
          questions={questions as AssignmentQuestion[]}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={(questionDraft ||
            questions.find((question) => question.id === selectedQuestionId)) as AssignmentQuestion | undefined}
          assessment={assessmentDraft || assessment}
          isReadOnly={isReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          isQuestionDirty={isQuestionDirty}
          isQuestionSaving={isQuestionSaving}
          onSelectQuestion={setSelectedQuestionId}
          onAddQuestion={() => void handleAddQuestion()}
          onUpdateQuestion={handleUpdateQuestionDraft}
          onDeleteQuestion={(questionId) => setConfirmDeleteQuestionId(questionId)}
          onMoveQuestion={(questionId, direction) => void handleMoveQuestion(questionId, direction)}
          onUpdateAssessment={(updates) => setAssessmentDraft((current) => (current ? { ...current, ...updates } : current))}
          onAutoDistributePoints={() => void handleAutoDistributePoints()}
          onSaveQuestion={handleSaveQuestion}
        />
      ) : (
        <AssessmentQuestionDesktopLayout
          questions={questions as AssignmentQuestion[]}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={(questionDraft ||
            questions.find((question) => question.id === selectedQuestionId)) as AssignmentQuestion | undefined}
          assessment={assessmentDraft || assessment}
          isReadOnly={isReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          isQuestionDirty={isQuestionDirty}
          isQuestionSaving={isQuestionSaving}
          onSelectQuestion={setSelectedQuestionId}
          onAddQuestion={() => void handleAddQuestion()}
          onUpdateQuestion={handleUpdateQuestionDraft}
          onDeleteQuestion={(questionId) => setConfirmDeleteQuestionId(questionId)}
          onMoveQuestion={(questionId, direction) => void handleMoveQuestion(questionId, direction)}
          onUpdateAssessment={(updates) => setAssessmentDraft((current) => (current ? { ...current, ...updates } : current))}
          onAutoDistributePoints={() => void handleAutoDistributePoints()}
          onSaveQuestion={handleSaveQuestion}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteQuestionId}
        onClose={() => setConfirmDeleteQuestionId(null)}
        onConfirm={() => {
          if (!confirmDeleteQuestionId) return;
          void handleDeleteQuestion(confirmDeleteQuestionId).then(() => setConfirmDeleteQuestionId(null));
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("deleteCancel")}
        severity="danger"
      />
    </div>
  );
}
