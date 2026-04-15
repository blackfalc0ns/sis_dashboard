"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { Column } from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
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
  getAssessmentTypeLabelKey,
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
import GradesGlobalExportModal from "../components/export/GradesGlobalExportModal";
import {
  exportGradesData,
  formatGradesExportDate,
  generateGradesExportFilename,
  type ExportColumn,
  type GradesExportFormat,
} from "../utils/gradesExport";
import { useGradesYearTermLayoutContext } from "@/features/grades/hooks/GradesYearTermLayoutContext";

interface GradesWorkspaceProps {
  view: "overview" | "assessments" | "gradebook";
}

type GradebookTableRow = GradebookStudentRow & Record<string, unknown>;
type GradesOverviewExportDataset =
  | "summary"
  | "assessments"
  | "analytics_distribution"
  | "analytics_assessments"
  | "analytics_students";
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function GradesWorkspace({ view }: GradesWorkspaceProps) {
  const t = useTranslations("academics.grades");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const {
    academicYearId,
    termId,
    termStatus,
    selectedAcademicYear,
    selectedTerm,
    isInitializing,
  } = useGradesYearTermLayoutContext();
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedOverviewExportDataset, setSelectedOverviewExportDataset] =
    useState<GradesOverviewExportDataset>("summary");
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
  const getLocalizedText = useCallback(
    (valueAr: string | undefined, valueEn: string | undefined) =>
      locale === "ar" ? valueAr || valueEn || "" : valueEn || valueAr || "",
    [locale],
  );

  const getLocalizedAssessmentTitle = useCallback(
    (assessment: Assessment) =>
      locale === "ar"
        ? assessment.titleAr || assessment.title
        : assessment.title || assessment.titleAr,
    [locale],
  );

  const getStatusLabel = useCallback(
    (status: GradeItemStatus) => {
      if (status === "absent") return t("table.absent");
      if (status === "entered") return t("dialogs.editGrade.statuses.entered");
      return t("table.pending");
    },
    [t],
  );

  const getApprovalStatusLabel = useCallback(
    (status: Assessment["approvalStatus"]) => {
      if (status === "approved") return t("actions.approve");
      if (status === "published") return t("actions.publish");
      return tCommon("unsaved");
    },
    [t, tCommon],
  );

  const getDeliveryModeLabel = useCallback(
    (deliveryMode: Assessment["deliveryMode"]) =>
      deliveryMode === "QUESTION_BASED"
        ? t("dialogs.createAssessment.deliveryModes.questionBased")
        : t("dialogs.createAssessment.deliveryModes.scoreOnly"),
    [t],
  );

  const getScopeTypeEnglishLabel = useCallback((scopeType: ExamScopeType) => {
    const labels: Record<ExamScopeType, string> = {
      school: "Whole School",
      stage: "Stage",
      grade: "Grade",
      section: "Section",
      classroom: "Classroom",
    };
    return labels[scopeType];
  }, []);

  const getCurrentViewEnglishLabel = useCallback(() => {
    const labels: Record<GradesWorkspaceProps["view"], string> = {
      overview: "Overview",
      assessments: "Assessments",
      gradebook: "Gradebook",
    };
    return labels[view];
  }, [view]);

  const getCurrentViewLocalizedLabel = useCallback(
    () => t(`tabs.${view}`),
    [t, view],
  );

  const getOverviewDatasetLocalizedLabel = useCallback(
    (dataset: GradesOverviewExportDataset) => t(`export.datasets.${dataset}.label`),
    [t],
  );

  const getOverviewDatasetLocalizedDescription = useCallback(
    (dataset: GradesOverviewExportDataset) =>
      t(`export.datasets.${dataset}.description`),
    [t],
  );

  const getOverviewDatasetEnglishLabel = useCallback(
    (dataset: GradesOverviewExportDataset) => {
      const labels: Record<GradesOverviewExportDataset, string> = {
        summary: "Summary",
        assessments: "Assessments",
        analytics_distribution: "Analytics Distribution",
        analytics_assessments: "Assessment Analytics",
        analytics_students: "Student Analytics",
      };
      return labels[dataset];
    },
    [],
  );

  const localizedMetadata = useMemo(
    () => ({
      yearName: getLocalizedText(
        selectedAcademicYear?.nameAr,
        selectedAcademicYear?.nameEn || selectedAcademicYear?.name,
      ),
      termName: getLocalizedText(
        selectedTerm?.nameAr,
        selectedTerm?.nameEn || selectedTerm?.name,
      ),
      scopeTypeName: t(`filters.scopeTypes.${selectedScopeType}`),
      scopeName: selectedScopeEntity
        ? getLocalizedText(selectedScopeEntity.nameAr, selectedScopeEntity.nameEn)
        : "",
      subjectName: selectedSubject
        ? getLocalizedText(selectedSubject.nameAr, selectedSubject.nameEn)
        : "",
      viewName: getCurrentViewLocalizedLabel(),
      exportDate: formatGradesExportDate(locale),
    }),
    [
      getCurrentViewLocalizedLabel,
      getLocalizedText,
      locale,
      selectedAcademicYear,
      selectedScopeEntity,
      selectedScopeType,
      selectedSubject,
      selectedTerm,
      t,
    ],
  );

  const englishMetadata = useMemo(
    () => ({
      yearName: selectedAcademicYear?.nameEn || selectedAcademicYear?.name || "",
      termName: selectedTerm?.nameEn || selectedTerm?.name || "",
      scopeTypeName: getScopeTypeEnglishLabel(selectedScopeType),
      scopeName: selectedScopeEntity?.nameEn || "",
      subjectName: selectedSubject?.nameEn || "",
      viewName: getCurrentViewEnglishLabel(),
      exportDate: formatGradesExportDate("en"),
    }),
    [
      getCurrentViewEnglishLabel,
      getScopeTypeEnglishLabel,
      selectedAcademicYear,
      selectedScopeEntity,
      selectedScopeType,
      selectedSubject,
      selectedTerm,
    ],
  );

  const overviewDatasetOptions = useMemo(
    () => [
      {
        value: "summary",
        label: getOverviewDatasetLocalizedLabel("summary"),
        description: getOverviewDatasetLocalizedDescription("summary"),
      },
      {
        value: "assessments",
        label: getOverviewDatasetLocalizedLabel("assessments"),
        description: getOverviewDatasetLocalizedDescription("assessments"),
      },
      {
        value: "analytics_distribution",
        label: getOverviewDatasetLocalizedLabel("analytics_distribution"),
        description: getOverviewDatasetLocalizedDescription("analytics_distribution"),
      },
      {
        value: "analytics_assessments",
        label: getOverviewDatasetLocalizedLabel("analytics_assessments"),
        description: getOverviewDatasetLocalizedDescription("analytics_assessments"),
      },
      {
        value: "analytics_students",
        label: getOverviewDatasetLocalizedLabel("analytics_students"),
        description: getOverviewDatasetLocalizedDescription("analytics_students"),
      },
    ],
    [
      getOverviewDatasetLocalizedDescription,
      getOverviewDatasetLocalizedLabel,
    ],
  );

  const buildOverviewSummaryExport = useCallback(() => {
    const rowsForExport = [
      { metric: t("kpis.students"), value: summary.totalStudents },
      { metric: t("kpis.assessments"), value: summary.totalAssessments },
      { metric: t("kpis.classAverage"), value: formatPercent(summary.classAverage) },
      { metric: t("kpis.completionRate"), value: formatPercent(summary.completionRate) },
      { metric: t("summaryPanel.highest"), value: formatPercent(summary.highestAverage) },
      { metric: t("summaryPanel.lowest"), value: formatPercent(summary.lowestAverage) },
      { metric: t("summaryPanel.passMark"), value: `${gradeRule?.passMark ?? 50}%` },
      ...trend.map((point) => ({
        metric: `${t("trend.average")} - ${point.label}`,
        value: formatPercent(point.average),
      })),
    ];

    return {
      title: getOverviewDatasetLocalizedLabel("summary"),
      filename: generateGradesExportFilename(
        "grades-overview-summary",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "metric", label: t("export.columns.metric") },
        { key: "value", label: t("export.columns.value") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Overview Summary",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("summary"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "summary",
        },
        summary: {
          ...summary,
          passMark: gradeRule?.passMark ?? 50,
        },
        trend,
      },
      count:
        trend.length > 0 || assessments.length > 0 || rows.length > 0
          ? rowsForExport.length
          : 0,
    };
  }, [
    academicYearId,
    assessments.length,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    gradeRule?.passMark,
    rows.length,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    summary,
    t,
    termId,
    trend,
    view,
  ]);

  const buildAssessmentsRows = useCallback(
    (sourceAssessments: Assessment[]) =>
      sourceAssessments.map((assessment) => ({
        id: assessment.id,
        title: getLocalizedAssessmentTitle(assessment),
        titleEn: assessment.title,
        titleAr: assessment.titleAr,
        type: t(`assessmentTypes.${getAssessmentTypeLabelKey(assessment.type)}`),
        deliveryMode: getDeliveryModeLabel(assessment.deliveryMode),
        date: assessment.date,
        weight: `${assessment.weight}%`,
        maxScore: assessment.maxScore,
        approvalStatus: getApprovalStatusLabel(assessment.approvalStatus),
        locked: assessment.isLocked ? tCommon("yes") : tCommon("no"),
        scopeType: t(`filters.scopeTypes.${assessment.scopeType}`),
        scopeId: assessment.scopeId,
        sectionId: assessment.sectionId || "",
        classroomId: assessment.classroomId || "",
        subjectId: assessment.subjectId,
        termId: assessment.termId,
      })),
    [
      getApprovalStatusLabel,
      getDeliveryModeLabel,
      getLocalizedAssessmentTitle,
      t,
      tCommon,
    ],
  );

  const buildAssessmentsJsonRows = useCallback(
    (sourceAssessments: Assessment[]) =>
      sourceAssessments.map((assessment) => ({
        id: assessment.id,
        titleEn: assessment.title,
        titleAr: assessment.titleAr,
        type: assessment.type,
        deliveryMode: assessment.deliveryMode,
        date: assessment.date,
        weight: assessment.weight,
        maxScore: assessment.maxScore,
        scopeType: assessment.scopeType,
        scopeId: assessment.scopeId,
        sectionId: assessment.sectionId || null,
        classroomId: assessment.classroomId || null,
        approvalStatus: assessment.approvalStatus,
        isLocked: assessment.isLocked,
        subjectId: assessment.subjectId,
        termId: assessment.termId,
      })),
    [],
  );

  const buildOverviewAssessmentsExport = useCallback(() => {
    const rowsForExport = buildAssessmentsRows(visibleAssessments);
    return {
      title: getOverviewDatasetLocalizedLabel("assessments"),
      filename: generateGradesExportFilename(
        "grades-overview-assessments",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "id", label: t("export.columns.assessmentId") },
        { key: "title", label: t("export.columns.title") },
        { key: "titleEn", label: t("export.columns.titleEn") },
        { key: "titleAr", label: t("export.columns.titleAr") },
        { key: "type", label: t("export.columns.type") },
        { key: "deliveryMode", label: t("export.columns.deliveryMode") },
        { key: "date", label: t("export.columns.date") },
        { key: "weight", label: t("export.columns.weight") },
        { key: "maxScore", label: t("export.columns.maxScore") },
        { key: "approvalStatus", label: t("export.columns.approvalStatus") },
        { key: "locked", label: t("export.columns.locked") },
        { key: "scopeType", label: t("export.columns.scopeType") },
        { key: "scopeId", label: t("export.columns.scopeId") },
        { key: "sectionId", label: t("export.columns.sectionId") },
        { key: "classroomId", label: t("export.columns.classroomId") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Overview Assessments",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("assessments"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "assessments",
        },
        assessments: buildAssessmentsJsonRows(visibleAssessments),
      },
      count: visibleAssessments.length,
    };
  }, [
    academicYearId,
    buildAssessmentsJsonRows,
    buildAssessmentsRows,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
    visibleAssessments,
  ]);

  const buildOverviewDistributionExport = useCallback(() => {
    const rowsForExport = analyticsReport.distribution.map((item) => ({
      label: item.label,
      count: item.count,
    }));

    return {
      title: getOverviewDatasetLocalizedLabel("analytics_distribution"),
      filename: generateGradesExportFilename(
        "grades-overview-distribution",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "label", label: t("export.columns.band") },
        { key: "count", label: t("export.columns.count") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Analytics Distribution",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("analytics_distribution"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "analytics_distribution",
        },
        distribution: analyticsReport.distribution,
      },
      count: analyticsReport.distribution.some((item) => item.count > 0)
        ? rowsForExport.length
        : 0,
    };
  }, [
    academicYearId,
    analyticsReport.distribution,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const buildOverviewAssessmentAnalyticsExport = useCallback(() => {
    const rowsForExport = analyticsReport.assessmentPerformance.map((item) => ({
      assessmentId: item.assessmentId,
      label: item.label,
      average: formatPercent(item.average),
      enteredCount: item.enteredCount,
      maxScore: item.maxScore,
    }));

    return {
      title: getOverviewDatasetLocalizedLabel("analytics_assessments"),
      filename: generateGradesExportFilename(
        "grades-overview-assessment-analytics",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "assessmentId", label: t("export.columns.assessmentId") },
        { key: "label", label: t("export.columns.title") },
        { key: "average", label: t("export.columns.average") },
        { key: "enteredCount", label: t("export.columns.enteredCount") },
        { key: "maxScore", label: t("export.columns.maxScore") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Assessment Analytics",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("analytics_assessments"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "analytics_assessments",
        },
        assessments: analyticsReport.assessmentPerformance,
      },
      count: analyticsReport.assessmentPerformance.length,
    };
  }, [
    academicYearId,
    analyticsReport.assessmentPerformance,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const buildOverviewStudentAnalyticsExport = useCallback(() => {
    const studentRows = [
      ...analyticsReport.topStudents.map((item) => ({
        group: t("export.groups.top"),
        ...item,
      })),
      ...analyticsReport.lowestStudents.map((item) => ({
        group: t("export.groups.lowest"),
        ...item,
      })),
    ];

    const rowsForExport = studentRows.map((item) => ({
      group: item.group,
      studentId: item.studentId,
      studentName: locale === "ar" ? item.studentNameAr : item.studentNameEn,
      studentNameEn: item.studentNameEn,
      studentNameAr: item.studentNameAr,
      classroomName: item.classroomName || t("table.notAssigned"),
      average: formatPercent(item.average),
      completionRate: formatPercent(item.completionRate),
      completedItems: item.completedItems,
      totalItems: item.totalItems,
      status: item.status,
    }));

    return {
      title: getOverviewDatasetLocalizedLabel("analytics_students"),
      filename: generateGradesExportFilename(
        "grades-overview-student-analytics",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "group", label: t("export.columns.group") },
        { key: "studentId", label: t("export.columns.studentId") },
        { key: "studentName", label: t("export.columns.studentName") },
        { key: "studentNameEn", label: t("export.columns.studentNameEn") },
        { key: "studentNameAr", label: t("export.columns.studentNameAr") },
        { key: "classroomName", label: t("table.classroom") },
        { key: "average", label: t("export.columns.average") },
        { key: "completionRate", label: t("analytics.table.completionRate") },
        { key: "completedItems", label: t("export.columns.completedItems") },
        { key: "totalItems", label: t("export.columns.totalItems") },
        { key: "status", label: t("export.columns.status") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Student Analytics",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("analytics_students"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "analytics_students",
        },
        students: [
          ...analyticsReport.topStudents.map((item) => ({
            group: "top",
            ...item,
          })),
          ...analyticsReport.lowestStudents.map((item) => ({
            group: "lowest",
            ...item,
          })),
        ],
      },
      count: studentRows.length,
    };
  }, [
    academicYearId,
    analyticsReport.lowestStudents,
    analyticsReport.topStudents,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    locale,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const buildAssessmentsViewExport = useCallback(() => {
    const rowsForExport = buildAssessmentsRows(assessments);

    return {
      title: t("export.datasets.assessmentsView.label"),
      filename: generateGradesExportFilename(
        "grades-assessments",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "id", label: t("export.columns.assessmentId") },
        { key: "title", label: t("export.columns.title") },
        { key: "titleEn", label: t("export.columns.titleEn") },
        { key: "titleAr", label: t("export.columns.titleAr") },
        { key: "type", label: t("export.columns.type") },
        { key: "deliveryMode", label: t("export.columns.deliveryMode") },
        { key: "date", label: t("export.columns.date") },
        { key: "weight", label: t("export.columns.weight") },
        { key: "maxScore", label: t("export.columns.maxScore") },
        { key: "approvalStatus", label: t("export.columns.approvalStatus") },
        { key: "locked", label: t("export.columns.locked") },
        { key: "scopeType", label: t("export.columns.scopeType") },
        { key: "scopeId", label: t("export.columns.scopeId") },
        { key: "sectionId", label: t("export.columns.sectionId") },
        { key: "classroomId", label: t("export.columns.classroomId") },
        { key: "subjectId", label: t("export.columns.subjectId") },
        { key: "termId", label: t("export.columns.termId") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Assessments",
        metadata: englishMetadata,
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
        },
        assessments: buildAssessmentsJsonRows(assessments),
      },
      count: rowsForExport.length,
    };
  }, [
    academicYearId,
    assessments,
    buildAssessmentsJsonRows,
    buildAssessmentsRows,
    englishMetadata,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const buildGradebookViewExport = useCallback(() => {
    const dynamicColumns = assessments.map((assessment) => ({
      key: `assessment_${assessment.id}`,
      label: getLocalizedAssessmentTitle(assessment),
    }));

    const rowsForExport = rows.map((row) => {
      const dynamicValues = Object.fromEntries(
        assessments.map((assessment) => {
          const score = row.scoresByAssessmentId[assessment.id];
          const status = row.statusByAssessmentId[assessment.id];
          const value =
            status === "entered" && score != null
              ? `${score}/${assessment.maxScore}`
              : getStatusLabel(status);
          return [`assessment_${assessment.id}`, value];
        }),
      );

      return {
        studentId: row.studentId,
        studentName: locale === "ar" ? row.studentNameAr : row.studentNameEn,
        studentNameEn: row.studentNameEn,
        studentNameAr: row.studentNameAr,
        classroomName: row.classroomName || t("table.notAssigned"),
        average: formatPercent(row.average),
        completion: `${row.completedItems}/${row.totalItems}`,
        ...dynamicValues,
      };
    });

    return {
      title: t("export.datasets.gradebook.label"),
      filename: generateGradesExportFilename(
        "grades-gradebook",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "studentId", label: t("export.columns.studentId") },
        { key: "studentName", label: t("export.columns.studentName") },
        { key: "studentNameEn", label: t("export.columns.studentNameEn") },
        { key: "studentNameAr", label: t("export.columns.studentNameAr") },
        { key: "classroomName", label: t("table.classroom") },
        ...dynamicColumns,
        { key: "average", label: t("table.average") },
        { key: "completion", label: t("table.completion") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Gradebook",
        metadata: englishMetadata,
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
        },
        assessments: assessments.map((assessment) => ({
          id: assessment.id,
          titleEn: assessment.title,
          titleAr: assessment.titleAr,
          maxScore: assessment.maxScore,
          date: assessment.date,
          type: assessment.type,
        })),
        students: rows.map((row) => ({
          studentId: row.studentId,
          studentNameEn: row.studentNameEn,
          studentNameAr: row.studentNameAr,
          classroomName: row.classroomName || null,
          scoresByAssessmentId: row.scoresByAssessmentId,
          statusByAssessmentId: row.statusByAssessmentId,
          average: row.average,
          completedItems: row.completedItems,
          totalItems: row.totalItems,
        })),
      },
      count: rowsForExport.length,
    };
  }, [
    academicYearId,
    assessments,
    englishMetadata,
    getLocalizedAssessmentTitle,
    getStatusLabel,
    locale,
    rows,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const currentExportPayload = useMemo(() => {
    if (view === "overview") {
      switch (selectedOverviewExportDataset) {
        case "assessments":
          return buildOverviewAssessmentsExport();
        case "analytics_distribution":
          return buildOverviewDistributionExport();
        case "analytics_assessments":
          return buildOverviewAssessmentAnalyticsExport();
        case "analytics_students":
          return buildOverviewStudentAnalyticsExport();
        case "summary":
        default:
          return buildOverviewSummaryExport();
      }
    }

    if (view === "assessments") {
      return buildAssessmentsViewExport();
    }

    return buildGradebookViewExport();
  }, [
    buildAssessmentsViewExport,
    buildGradebookViewExport,
    buildOverviewAssessmentAnalyticsExport,
    buildOverviewAssessmentsExport,
    buildOverviewDistributionExport,
    buildOverviewStudentAnalyticsExport,
    buildOverviewSummaryExport,
    selectedOverviewExportDataset,
    view,
  ]);

  const handleExport = async (format: GradesExportFormat) => {
    const localizedDatasetName =
      view === "overview"
        ? getOverviewDatasetLocalizedLabel(selectedOverviewExportDataset)
        : undefined;
    const englishDatasetName =
      view === "overview"
        ? getOverviewDatasetEnglishLabel(selectedOverviewExportDataset)
        : undefined;

    exportGradesData({
      title: currentExportPayload.title,
      metadata: {
        ...localizedMetadata,
        ...(localizedDatasetName ? { datasetName: localizedDatasetName } : {}),
      },
      filename: currentExportPayload.filename,
      format,
      columns: currentExportPayload.columns,
      rows: currentExportPayload.rows,
      jsonData:
        format === "json" && currentExportPayload.jsonData
          ? {
              ...(currentExportPayload.jsonData as Record<string, unknown>),
              metadata: {
                ...englishMetadata,
                ...(englishDatasetName ? { datasetName: englishDatasetName } : {}),
              },
            }
          : currentExportPayload.jsonData,
      locale,
      emptyMessage: t("export.errors.noData"),
    });
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      style={{ backgroundColor: "var(--surface-secondary)" }}
    >
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
          onExport={() => setIsExportModalOpen(true)}
          isExportDisabled={!currentExportPayload.count}
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

      <GradesGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        datasetCount={currentExportPayload.count}
        emptyStateMessage={t("export.errors.noData")}
        datasetOptions={view === "overview" ? overviewDatasetOptions : undefined}
        selectedDataset={
          view === "overview" ? selectedOverviewExportDataset : undefined
        }
        onDatasetChange={
          view === "overview"
            ? (value) =>
                setSelectedOverviewExportDataset(
                  value as GradesOverviewExportDataset,
                )
            : undefined
        }
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
