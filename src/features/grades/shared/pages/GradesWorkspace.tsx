"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { Column } from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import MainLoader from "@/components/ui/loaders/MainLoader";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchAssessmentSubmissionReview,
  fetchGradesFiltersData,
  fetchGradeItemDetail,
  saveAssessmentSubmissionCorrection,
  updateGradeItem,
} from "../../gradebook/services/gradesGradebookService";
import {
  approveAssessment,
  bulkUpdateAssessmentGrades,
  deleteAssessment,
  fetchAssessmentRoster,
  lockAssessment,
  publishAssessment,
  updateAssessment,
} from "../../assessments/services/gradesAssessmentsService";
import {
  fetchAssessments,
  fetchOverviewGradebook,
  fetchScopeGradeRule,
} from "../../overview/services/gradesOverviewService";
import type { Assessment } from "../../overview/types";
import type { CreateAssessmentPayload, ExamScopeType, GradeItemStatus, GradebookStudentRow, ScopeEntityOption } from "../../shared/types";
import GradesFiltersPanel from "../components/GradesFiltersPanel";
import GradesAnalyticsSection from "../../analytics/components/GradesAnalyticsSection";
import GradesOverviewSection from "../../overview/components/GradesOverviewSection";
import GradesAssessmentsSection from "../../assessments/components/GradesAssessmentsSection";
import GradesGradebookSection from "../../gradebook/components/GradesGradebookSection";
import CreateAssessmentDialog from "../../assessments/components/CreateAssessmentDialog";
import EditGradeDialog from "../../gradebook/components/EditGradeDialog";
import ReviewAssessmentSubmissionDialog from "../../gradebook/components/ReviewAssessmentSubmissionDialog";
import BulkGradeEntryDialog from "../../assessments/components/BulkGradeEntryDialog";
import { fetchGradesAnalytics } from "../../analytics/services/gradesAnalyticsService";
import type { GradesAnalyticsReport } from "../../analytics/types";
import type { AssessmentSubmissionReview } from "../../shared/types";

interface GradesWorkspaceProps {
  view: "overview" | "assessments" | "gradebook";
}

type GradebookTableRow = GradebookStudentRow & Record<string, unknown>;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function GradesWorkspace({ view }: GradesWorkspaceProps) {
  const t = useTranslations("academics.grades");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();

  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isSavingSubmissionCorrection, setIsSavingSubmissionCorrection] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [assessmentActionId, setAssessmentActionId] = useState<string | null>(null);
  const [assessmentActionType, setAssessmentActionType] = useState<"publish" | "approve" | "lock" | "bulk" | "delete" | null>(null);

  const [scopeTypes, setScopeTypes] = useState<ExamScopeType[]>([]);
  const [scopeEntitiesByType, setScopeEntitiesByType] = useState<Record<ExamScopeType, ScopeEntityOption[]>>({
    school: [],
    stage: [],
    grade: [],
    section: [],
    classroom: [],
  });
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; nameAr: string; nameEn: string }>>([]);
  const [selectedScopeType, setSelectedScopeType] = useState<ExamScopeType>("school");
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [rows, setRows] = useState<GradebookStudentRow[]>([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalAssessments: 0,
    classAverage: 0,
    highestAverage: 0,
    lowestAverage: 0,
    completionRate: 0,
  });
  const [trend, setTrend] = useState<Array<{ label: string; average: number }>>([]);
  const [gradeRule, setGradeRule] = useState<{ passMark: number } | null>(null);
  const [analyticsReport, setAnalyticsReport] = useState<GradesAnalyticsReport>({
    kpis: { classAverage: 0, passRate: 0, completionRate: 0, failingStudents: 0 },
    distribution: [],
    assessmentPerformance: [],
    topStudents: [],
    lowestStudents: [],
  });

  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [editGradeState, setEditGradeState] = useState<{ assessment: Assessment; row: GradebookStudentRow; comment?: string } | null>(null);
  const [submissionReviewState, setSubmissionReviewState] = useState<AssessmentSubmissionReview | null>(null);
  const [bulkEntryState, setBulkEntryState] = useState<{
    assessment: Assessment;
    rows: Array<{ studentId: string; studentNameEn: string; studentNameAr: string; classroomName?: string; score: number | null; status: GradeItemStatus; comment?: string }>;
  } | null>(null);

  const isReadOnly = termStatus === "closed";
  const filtersHydratedRef = useRef(false);
  const showSubjectFilter = true;

  const replaceQuery = useCallback((nextParams: URLSearchParams) => {
    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;
    router.replace(nextQuery ? `?${nextQuery}` : `/${locale}/grades`, { scroll: false });
  }, [locale, router, searchParams]);

  const availableScopeEntities = useMemo(
    () => scopeEntitiesByType[selectedScopeType] || [],
    [scopeEntitiesByType, selectedScopeType],
  );

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
      setTermStatus(term.status);
      setTerms(yearTerms);
      const params = new URLSearchParams(searchParams.toString());
      params.set("year", year.id);
      params.set("term", term.id);
      replaceQuery(params);
      setIsLoading(false);
    };

    void initialize();
  }, [replaceQuery, searchParams]);

  useEffect(() => {
    const loadFilters = async () => {
      if (!academicYearId || !termId) return;
      setIsDataLoading(true);
      try {
        const data = await fetchGradesFiltersData(academicYearId, termId);
        setScopeTypes(data.scopeTypes);
        setScopeEntitiesByType(data.scopeEntities);
        setSubjects(data.subjects);

        const urlScopeType = (searchParams.get("scopeType") as ExamScopeType) || data.scopeTypes[0] || "school";
        const nextScopeType = data.scopeTypes.includes(urlScopeType) ? urlScopeType : data.scopeTypes[0] || "school";
        const availableEntities = data.scopeEntities[nextScopeType] || [];
        const urlScopeId = searchParams.get("scopeId") || "";
        const nextScopeId = availableEntities.some((entity) => entity.id === urlScopeId)
          ? urlScopeId
          : availableEntities[0]?.id || "";
        const urlSubjectId = searchParams.get("subjectId") || "";
        const nextSubjectId = data.subjects.some((subject) => subject.id === urlSubjectId)
          ? urlSubjectId
          : data.subjects[0]?.id || "";

        setSelectedScopeType(nextScopeType);
        setSelectedScopeId(nextScopeId);
        setSelectedSubjectId(nextSubjectId);
        filtersHydratedRef.current = true;
      } catch {
        showError(tCommon("error_loading"));
      } finally {
        setIsDataLoading(false);
      }
    };

    void loadFilters();
  }, [academicYearId, searchParams, showError, tCommon, termId]);

  useEffect(() => {
    if (!filtersHydratedRef.current || !academicYearId || !termId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("year", academicYearId);
    params.set("term", termId);
    params.set("scopeType", selectedScopeType);
    if (selectedScopeId) params.set("scopeId", selectedScopeId);
    else params.delete("scopeId");
    if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
    else params.delete("subjectId");
    replaceQuery(params);
  }, [academicYearId, replaceQuery, searchParams, selectedScopeId, selectedScopeType, selectedSubjectId, termId]);

  const refreshGradebook = useCallback(async () => {
    if (!academicYearId || !termId || !selectedScopeId || !selectedSubjectId) {
      setAssessments([]);
      setRows([]);
      setTrend([]);
      return;
    }

    setIsDataLoading(true);
    try {
      if (view === "assessments") {
        const scopedAssessments = await fetchAssessments(academicYearId, termId, {
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
        });
        setAssessments(scopedAssessments);
        setRows([]);
        setSummary({ totalStudents: 0, totalAssessments: 0, classAverage: 0, highestAverage: 0, lowestAverage: 0, completionRate: 0 });
        setTrend([]);
        setGradeRule(null);
        setAnalyticsReport({ kpis: { classAverage: 0, passRate: 0, completionRate: 0, failingStudents: 0 }, distribution: [], assessmentPerformance: [], topStudents: [], lowestStudents: [] });
        return;
      }

      const filters = {
        scopeType: selectedScopeType,
        scopeId: selectedScopeId,
        subjectId: selectedSubjectId,
      };

      const [gradebook, scopedAssessments, rule, analytics] = await Promise.all([
        fetchOverviewGradebook(academicYearId, termId, filters),
        fetchAssessments(academicYearId, termId, filters),
        fetchScopeGradeRule(academicYearId, termId, selectedScopeType, selectedScopeId),
        fetchGradesAnalytics(academicYearId, termId, filters),
      ]);

      setAssessments(scopedAssessments);
      setRows(gradebook.rows);
      setSummary(gradebook.summary);
      setTrend(gradebook.trend.map((point) => ({ label: point.label, average: point.average })));
      setGradeRule(rule ? { passMark: rule.passMark } : null);
      setAnalyticsReport(analytics);
    } catch {
      showError(tCommon("error_loading"));
    } finally {
      setIsDataLoading(false);
    }
  }, [academicYearId, selectedScopeId, selectedScopeType, selectedSubjectId, showError, tCommon, termId, view]);

  useEffect(() => {
    void refreshGradebook();
  }, [refreshGradebook]);

  const handleAcademicYearChange = async (yearId: string) => {
    const yearTerms = await fetchTermsByYear(yearId);
    const selectedTerm = yearTerms.find((item) => item.status === "open") || yearTerms[0];
    if (!selectedTerm) return;
    setAcademicYearId(yearId);
    setTerms(yearTerms);
    setTermId(selectedTerm.id);
    setTermStatus(selectedTerm.status);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", yearId);
    params.set("term", selectedTerm.id);
    replaceQuery(params);
  };

  const handleTermChange = (nextTermId: string) => {
    const selectedTerm = terms.find((item) => item.id === nextTermId);
    if (!selectedTerm) return;
    setTermId(nextTermId);
    setTermStatus(selectedTerm.status);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", academicYearId);
    params.set("term", nextTermId);
    replaceQuery(params);
  };

  const openEditGradeDialog = useCallback(async (assessment: Assessment, row: GradebookStudentRow) => {
    if (assessment.deliveryMode === "QUESTION_BASED") {
      try {
        const review = await fetchAssessmentSubmissionReview(
          academicYearId,
          termId,
          assessment.id,
          row.studentId,
        );
        setSubmissionReviewState(review);
      } catch (error) {
        showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
      }
      return;
    }

    const detail = await fetchGradeItemDetail(academicYearId, termId, assessment.id, row.studentId);
    setEditGradeState({ assessment, row, comment: detail?.comment });
  }, [academicYearId, showError, t, termId]);

  const handleSaveAssessment = async (payload: CreateAssessmentPayload) => {
    try {
      setIsCreatingAssessment(true);
      await updateAssessment(academicYearId, termId, editingAssessment!.id, payload);
      setEditingAssessment(null);
      await refreshGradebook();
      showSuccess(t("messages.assessmentUpdated"));
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    try {
      setAssessmentActionId(assessmentToDelete.id);
      setAssessmentActionType("delete");
      await deleteAssessment(academicYearId, termId, assessmentToDelete.id);
      setAssessmentToDelete(null);
      await refreshGradebook();
      showSuccess(t("messages.assessmentDeleted"));
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setAssessmentActionId(null);
      setAssessmentActionType(null);
    }
  };

  const handleSaveGrade = async (payload: { score: number | null; status: GradeItemStatus; comment?: string }) => {
    if (!editGradeState) return;
    try {
      setIsSavingGrade(true);
      await updateGradeItem(academicYearId, termId, {
        assessmentId: editGradeState.assessment.id,
        studentId: editGradeState.row.studentId,
        score: payload.score,
        status: payload.status,
        comment: payload.comment,
      });
      setEditGradeState(null);
      await refreshGradebook();
      showSuccess(t("messages.gradeSaved"));
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleSaveSubmissionCorrection = async (
    answers: Array<{ answerId: string; awardedPoints: number | null; teacherComment?: string }>,
  ) => {
    if (!submissionReviewState) return;
    try {
      setIsSavingSubmissionCorrection(true);
      await saveAssessmentSubmissionCorrection(
        academicYearId,
        termId,
        submissionReviewState.assessment.id,
        submissionReviewState.submission.studentId,
        answers,
      );
      setSubmissionReviewState(null);
      await refreshGradebook();
      showSuccess(t("messages.questionsCorrected"));
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsSavingSubmissionCorrection(false);
    }
  };

  const openBulkEntryDialog = async (assessment: Assessment) => {
    try {
      setAssessmentActionId(assessment.id);
      setAssessmentActionType("bulk");
      setIsBulkLoading(true);
      const roster = await fetchAssessmentRoster(academicYearId, termId, assessment.id);
      setBulkEntryState({ assessment, rows: roster });
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsBulkLoading(false);
      setAssessmentActionId(null);
      setAssessmentActionType(null);
    }
  };

  const handleBulkSave = async (items: Array<{ studentId: string; score: number | null; status: GradeItemStatus; comment?: string }>) => {
    if (!bulkEntryState) return;
    try {
      setIsBulkSaving(true);
      await bulkUpdateAssessmentGrades(academicYearId, termId, bulkEntryState.assessment.id, items);
      setBulkEntryState(null);
      await refreshGradebook();
      showSuccess(t("messages.bulkGradesSaved"));
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleAssessmentAction = async (assessmentId: string, type: "publish" | "approve" | "lock") => {
    try {
      setAssessmentActionId(assessmentId);
      setAssessmentActionType(type);
      if (type === "publish") await publishAssessment(academicYearId, termId, assessmentId);
      if (type === "approve") await approveAssessment(academicYearId, termId, assessmentId);
      if (type === "lock") await lockAssessment(academicYearId, termId, assessmentId);
      await refreshGradebook();
      showSuccess(t(`messages.assessment${type === "publish" ? "Published" : type === "approve" ? "Approved" : "Locked"}`));
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setAssessmentActionId(null);
      setAssessmentActionType(null);
    }
  };

  const gradebookColumns = useMemo<Column<GradebookTableRow>[]>(() => {
    const baseColumns = [
      {
        key: "studentName",
        label: t("table.student"),
        render: (_value: unknown, row: GradebookStudentRow) => (
          <div className="font-medium" style={{ color: "var(--text-primary)" }}>
            {locale === "ar" ? row.studentNameAr : row.studentNameEn}
          </div>
        ),
      },
      {
        key: "classroomName",
        label: t("table.classroom"),
        render: (_value: unknown, row: GradebookStudentRow) => row.classroomName || t("table.notAssigned"),
      },
    ];

    const assessmentColumns = assessments.map((assessment) => ({
      key: assessment.id,
      label: locale === "ar" ? assessment.titleAr : assessment.title,
      sortable: false,
      render: (_value: unknown, row: GradebookStudentRow) => {
        const score = row.scoresByAssessmentId[assessment.id];
        const status = row.statusByAssessmentId[assessment.id];
        let label = t("table.pending");
        if (status === "absent") label = t("table.absent");
        else if (status === "entered" && score != null) label = `${score}/${assessment.maxScore}`;

        return (
          <button
            type="button"
            onClick={() => void openEditGradeDialog(assessment, row)}
            disabled={assessment.isLocked || isReadOnly}
            className="rounded-md border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          >
            {label}
          </button>
        );
      },
    }));

    return [
      ...baseColumns,
      ...assessmentColumns,
      {
        key: "average",
        label: t("table.average"),
        render: (value: unknown) => <span className="font-semibold">{formatPercent(Number(value || 0))}</span>,
      },
      {
        key: "completion",
        label: t("table.completion"),
        render: (_value: unknown, row: GradebookStudentRow) => `${row.completedItems}/${row.totalItems}`,
      },
    ];
  }, [assessments, isReadOnly, locale, openEditGradeDialog, t]);

  const tableRows: GradebookTableRow[] = rows.map((row) => ({
    ...row,
    studentName: locale === "ar" ? row.studentNameAr : row.studentNameEn,
    completion: row.completedItems,
    ...Object.fromEntries(assessments.map((assessment) => [assessment.id, row.scoresByAssessmentId[assessment.id]])),
  }));

  const selectedScopeEntity = availableScopeEntities.find((entity) => entity.id === selectedScopeId);
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId);
  const selectedContextText =
    selectedScopeEntity && selectedSubject
      ? t("filters.activeContext", {
          subject: locale === "ar" ? selectedSubject.nameAr : selectedSubject.nameEn,
          scope: locale === "ar" ? selectedScopeEntity.nameAr : selectedScopeEntity.nameEn,
        })
      : selectedScopeEntity
        ? locale === "ar" ? selectedScopeEntity.nameAr : selectedScopeEntity.nameEn
        : null;

  const visibleAssessments = view === "overview" ? assessments.slice(0, 6) : assessments;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><MainLoader /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--surface-secondary)" }}>
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      <div className="space-y-6 p-6">
        <GradesFiltersPanel
          scopeTypes={scopeTypes}
          scopeEntities={availableScopeEntities}
          subjects={subjects}
          selectedScopeType={selectedScopeType}
          selectedScopeId={selectedScopeId}
          selectedSubjectId={selectedSubjectId}
          onScopeTypeChange={(scopeType) => {
            setSelectedScopeType(scopeType);
            setSelectedScopeId((scopeEntitiesByType[scopeType] || [])[0]?.id || "");
          }}
          onScopeIdChange={setSelectedScopeId}
          onSubjectChange={setSelectedSubjectId}
          selectedContextText={selectedContextText}
          isReadOnly={isReadOnly}
          showSubjectFilter={showSubjectFilter}
          onCreateAssessment={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("year", academicYearId);
            params.set("term", termId);
            params.set("scopeType", selectedScopeType);
            params.set("scopeId", selectedScopeId);
            params.set("subjectId", selectedSubjectId);
            router.push(`/${locale}/grades/assessments/new?${params.toString()}`);
          }}
        />

        {view === "overview" && (
          <>
            <GradesOverviewSection
              summary={summary}
              trend={trend}
              gradeRule={gradeRule}
              assessments={visibleAssessments}
              isReadOnly={isReadOnly}
              isBulkLoading={isBulkLoading}
              assessmentActionId={assessmentActionId}
              assessmentActionType={assessmentActionType}
              onBulkEntry={(assessment) => void openBulkEntryDialog(assessment)}
              onPublish={(assessmentId) => void handleAssessmentAction(assessmentId, "publish")}
              onApprove={(assessmentId) => void handleAssessmentAction(assessmentId, "approve")}
              onLock={(assessmentId) => void handleAssessmentAction(assessmentId, "lock")}
              onEdit={setEditingAssessment}
              onManageQuestions={(assessment) => {
                const params = searchParams.toString();
                const path = `/${locale}/grades/assessments/${assessment.id}/questions`;
                router.push(params ? `${path}?${params}` : path);
              }}
            />
            <GradesAnalyticsSection isLoading={isDataLoading} report={analyticsReport} />
          </>
        )}

        {view === "assessments" && (
          <GradesAssessmentsSection
            assessments={visibleAssessments}
            isReadOnly={isReadOnly}
            isBulkLoading={isBulkLoading}
            assessmentActionId={assessmentActionId}
            assessmentActionType={assessmentActionType}
            onBulkEntry={(assessment) => void openBulkEntryDialog(assessment)}
            onPublish={(assessmentId) => void handleAssessmentAction(assessmentId, "publish")}
            onApprove={(assessmentId) => void handleAssessmentAction(assessmentId, "approve")}
            onLock={(assessmentId) => void handleAssessmentAction(assessmentId, "lock")}
            onEdit={setEditingAssessment}
            onDelete={setAssessmentToDelete}
            onManageQuestions={(assessment) => {
              const params = searchParams.toString();
              const path = `/${locale}/grades/assessments/${assessment.id}/questions`;
              router.push(params ? `${path}?${params}` : path);
            }}
          />
        )}

        {view === "gradebook" && <GradesGradebookSection isLoading={isDataLoading} rows={tableRows} columns={gradebookColumns} />}
      </div>

      <CreateAssessmentDialog
        key={editingAssessment ? `edit-assessment-${editingAssessment.id}` : "edit-assessment-closed"}
        isOpen={!!editingAssessment}
        onClose={() => setEditingAssessment(null)}
        onSubmit={handleSaveAssessment}
        termId={termId}
        scopeTypes={scopeTypes}
        scopeEntitiesByType={scopeEntitiesByType}
        subjects={subjects}
        selectedScopeType={selectedScopeType}
        selectedScopeId={selectedScopeId}
        selectedSubjectId={selectedSubjectId}
        isSubmitting={isCreatingAssessment}
        mode="edit"
        initialAssessment={editingAssessment}
      />

      <EditGradeDialog
        key={editGradeState ? `${editGradeState.assessment.id}-${editGradeState.row.studentId}` : "edit-grade-closed"}
        isOpen={!!editGradeState}
        onClose={() => setEditGradeState(null)}
        onSubmit={handleSaveGrade}
        assessment={editGradeState?.assessment || null}
        studentName={editGradeState ? (locale === "ar" ? editGradeState.row.studentNameAr : editGradeState.row.studentNameEn) : ""}
        initialScore={editGradeState ? editGradeState.row.scoresByAssessmentId[editGradeState.assessment.id] : null}
        initialStatus={editGradeState ? editGradeState.row.statusByAssessmentId[editGradeState.assessment.id] : "missing"}
        initialComment={editGradeState?.comment}
        isSubmitting={isSavingGrade}
      />

      <ReviewAssessmentSubmissionDialog
        key={
          submissionReviewState
            ? `${submissionReviewState.assessment.id}-${submissionReviewState.submission.studentId}`
            : "review-submission-closed"
        }
        isOpen={!!submissionReviewState}
        onClose={() => setSubmissionReviewState(null)}
        review={submissionReviewState}
        onSubmit={handleSaveSubmissionCorrection}
        isSubmitting={isSavingSubmissionCorrection}
      />

      <BulkGradeEntryDialog
        key={bulkEntryState ? `${bulkEntryState.assessment.id}-${bulkEntryState.rows.length}` : "bulk-grade-entry-closed"}
        isOpen={!!bulkEntryState}
        onClose={() => setBulkEntryState(null)}
        onSubmit={handleBulkSave}
        assessment={bulkEntryState?.assessment || null}
        rows={bulkEntryState?.rows || []}
        isSubmitting={isBulkSaving}
      />

      <ConfirmDialog
        isOpen={!!assessmentToDelete}
        onClose={() => setAssessmentToDelete(null)}
        onConfirm={() => void handleDeleteAssessment()}
        title={t("dialogs.deleteAssessment.title")}
        description={t("dialogs.deleteAssessment.description", {
          assessment: assessmentToDelete ? (locale === "ar" ? assessmentToDelete.titleAr : assessmentToDelete.title) : "",
        })}
        confirmLabel={t("dialogs.deleteAssessment.confirm")}
        cancelLabel={t("dialogs.deleteAssessment.cancel")}
        loading={assessmentActionType === "delete" && !!assessmentActionId}
        severity="danger"
      />
    </div>
  );
}
