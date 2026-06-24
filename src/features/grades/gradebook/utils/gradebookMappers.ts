import type {
  BackendApprovalStatus,
  BackendAssessmentResponse,
  BackendGradebookCell,
  BackendGradebookColumn,
  BackendGradebookResponse,
  BackendGradebookRow,
  BackendGradeItemStatus,
  BackendGradeItemStatusPayload,
  BackendGradeRuleResponse,
  BackendGradesBootstrapResponse,
  BackendNamedEntity,
  BackendAssessmentRosterItem,
  BackendSubmissionDetailResponse,
} from "../types/api.types";
import type {
  Assessment,
  AssessmentRosterItem,
  AssessmentSubmissionReview,
  AssessmentTrendPoint,
  ExamScopeType,
  GradebookStudentRow,
  GradeItemStatus,
  GradeRule,
  GradesFiltersData,
  GradesPageSummary,
  GradebookResponse,
  ScopeEntityOption,
  ScopeOption,
  AssessmentDeliveryMode,
} from "../../shared/types";

// ── Name resolution ──────────────────────────────────────────────────

export function resolveEntityName(
  entity: BackendNamedEntity,
): { name: string; nameAr: string; nameEn: string } {
  return {
    name: entity.name || entity.title || entity.nameEn || entity.titleEn || entity.nameAr || entity.titleAr || "",
    nameAr: entity.nameAr || entity.titleAr || entity.name || entity.title || "",
    nameEn: entity.nameEn || entity.titleEn || entity.name || entity.title || "",
  };
}

// ── Status mappers ───────────────────────────────────────────────────

const FRONTEND_TO_BACKEND_STATUS: Record<GradeItemStatus, BackendGradeItemStatusPayload> = {
  entered: "ENTERED",
  missing: "MISSING",
  absent: "ABSENT",
};

const BACKEND_TO_FRONTEND_STATUS: Record<BackendGradeItemStatus, GradeItemStatus> = {
  entered: "entered",
  missing: "missing",
  absent: "absent",
};

export function toBackendGradeItemStatus(status: GradeItemStatus): BackendGradeItemStatusPayload {
  return FRONTEND_TO_BACKEND_STATUS[status] ?? "MISSING";
}

export function fromBackendGradeItemStatus(status: BackendGradeItemStatus | null | undefined): GradeItemStatus {
  if (!status) return "missing";
  return BACKEND_TO_FRONTEND_STATUS[status] ?? "missing";
}

const BACKEND_TO_FRONTEND_APPROVAL: Record<BackendApprovalStatus, Assessment["approvalStatus"]> = {
  draft: "draft",
  published: "published",
  approved: "approved",
};

const BACKEND_QUESTION_TYPE_TO_UI: Record<string, AssessmentSubmissionReview["questions"][number]["question"]["questionType"]> = {
  mcq_single: "MCQ_SINGLE",
  mcq_multi: "MCQ_MULTI",
  true_false: "TRUE_FALSE",
  short_answer: "SHORT_ANSWER",
  essay: "ESSAY",
  fill_in_blank: "FILL_IN_BLANK",
  matching: "MATCHING",
  media: "MEDIA",
};

export function fromBackendApprovalStatus(
  status: BackendApprovalStatus | null | undefined,
): Assessment["approvalStatus"] {
  if (!status) return "draft";
  return BACKEND_TO_FRONTEND_APPROVAL[status] ?? "draft";
}

function fromBackendQuestionType(
  type: string | undefined,
): AssessmentSubmissionReview["questions"][number]["question"]["questionType"] {
  if (!type) return "SHORT_ANSWER";
  return BACKEND_QUESTION_TYPE_TO_UI[type] ??
    (type.toUpperCase() as AssessmentSubmissionReview["questions"][number]["question"]["questionType"]);
}

function fromBackendDeliveryMode(
  deliveryMode: string | null | undefined,
): AssessmentDeliveryMode {
  return deliveryMode?.toLowerCase() === "question_based"
    ? "QUESTION_BASED"
    : "SCORE_ONLY";
}

// ── Bootstrap → FiltersData ──────────────────────────────────────────

function mapNamedEntitiesToScopeEntities(
  entities: BackendNamedEntity[] | undefined,
  scopeType: ExamScopeType,
): ScopeEntityOption[] {
  return (entities ?? []).map((entity) => {
    const names = resolveEntityName(entity);
    return {
      id: entity.id,
      name: names.name,
      nameAr: names.nameAr,
      nameEn: names.nameEn,
      scopeType,
      parentId: entity.parentId ?? undefined,
    };
  });
}

function mapNamedEntitiesToScopeOptions(
  entities: BackendNamedEntity[] | undefined,
): ScopeOption[] {
  return (entities ?? []).map((entity) => {
    const names = resolveEntityName(entity);
    return {
      id: entity.id,
      name: names.name,
      nameAr: names.nameAr,
      nameEn: names.nameEn,
    };
  });
}

function wholeSchoolScopeEntity(): ScopeEntityOption {
  return {
    id: "",
    name: "Whole School",
    nameAr: "المدرسة بالكامل",
    nameEn: "Whole School",
    scopeType: "school",
  };
}

export function mapBootstrapToFiltersData(
  response: BackendGradesBootstrapResponse,
): GradesFiltersData {
  const scopeTypes = response.supportedScopes ?? ["school", "stage", "grade", "section", "classroom"];

  const stages = mapNamedEntitiesToScopeEntities(response.stages, "stage");
  const grades = mapNamedEntitiesToScopeEntities(response.grades, "grade");
  const sections = mapNamedEntitiesToScopeEntities(response.sections, "section");
  const classrooms = mapNamedEntitiesToScopeEntities(response.classrooms, "classroom");

  const scopeEntities: Record<ExamScopeType, ScopeEntityOption[]> = {
    school: [wholeSchoolScopeEntity()],
    stage: stages,
    grade: grades,
    section: sections,
    classroom: classrooms,
  };

  return {
    scopeTypes,
    scopeEntities,
    stages,
    grades,
    sections,
    classrooms,
    subjects: mapNamedEntitiesToScopeOptions(response.subjects),
  };
}

// ── Gradebook column → Assessment ────────────────────────────────────

export function mapBackendColumnToAssessment(column: BackendGradebookColumn): Assessment {
  const names = resolveEntityName({
    id: column.assessmentId,
    title: column.title,
    titleAr: column.titleAr,
    titleEn: column.titleEn,
  });

  return {
    id: column.assessmentId,
    termId: "",
    subjectId: column.subjectId ?? column.subject?.id ?? "",
    scopeType: column.scopeType ?? "school",
    scopeId: column.scopeId ?? "",
    sectionId: column.sectionId ?? undefined,
    classroomId: column.classroomId ?? undefined,
    title: names.nameEn || names.name,
    titleAr: names.nameAr || names.name,
    type: column.type ?? "QUIZ",
    deliveryMode: fromBackendDeliveryMode(column.deliveryMode),
    date: column.date ?? "",
    weight: column.weight ?? 0,
    maxScore: column.maxScore ?? 0,
    expectedTimeMinutes: column.expectedTimeMinutes ?? undefined,
    isLocked: column.isLocked ?? false,
    approvalStatus: fromBackendApprovalStatus(column.approvalStatus),
  };
}

// ── BackendAssessmentResponse → Assessment ───────────────────────────

export function mapBackendAssessmentToAssessment(item: BackendAssessmentResponse): Assessment {
  const names = resolveEntityName({
    id: item.id,
    title: item.title,
    titleAr: item.titleAr,
    titleEn: item.titleEn,
  });

  return {
    id: item.id,
    termId: item.termId ?? "",
    subjectId: item.subjectId ?? item.subject?.id ?? "",
    scopeType: item.scopeType ?? "school",
    scopeId: item.scopeId ?? "",
    sectionId: item.sectionId ?? undefined,
    classroomId: item.classroomId ?? undefined,
    title: names.nameEn || names.name,
    titleAr: names.nameAr || names.name,
    type: item.type ?? "QUIZ",
    deliveryMode: fromBackendDeliveryMode(item.deliveryMode),
    date: item.date ?? "",
    weight: item.weight ?? 0,
    maxScore: item.maxScore ?? 0,
    expectedTimeMinutes: item.expectedTimeMinutes ?? undefined,
    isLocked: item.isLocked ?? false,
    approvalStatus: fromBackendApprovalStatus(item.approvalStatus),
  };
}

// ── Gradebook row → GradebookStudentRow ──────────────────────────────

export function mapBackendRowToStudentRow(
  row: BackendGradebookRow,
  columns: BackendGradebookColumn[],
): GradebookStudentRow {
  const studentName =
    row.student?.nameEn ||
    [row.student?.firstName, row.student?.lastName].filter(Boolean).join(" ") ||
    "";
  const studentNameAr = row.student?.nameAr || studentName;
  const studentNameEn = row.student?.nameEn || studentName;

  const scoresByAssessmentId: Record<string, number | null> = {};
  const statusByAssessmentId: Record<string, GradeItemStatus> = {};

  const cellsByAssessmentId = new Map<string, BackendGradebookCell>();
  if (row.cells) {
    for (const cell of row.cells) {
      cellsByAssessmentId.set(cell.assessmentId, cell);
    }
  }

  let completedItems = 0;
  const totalItems = columns.length;

  for (const column of columns) {
    const assessmentId = column.assessmentId;
    const cell = cellsByAssessmentId.get(assessmentId);

    if (cell) {
      scoresByAssessmentId[assessmentId] = cell.score ?? null;
      statusByAssessmentId[assessmentId] = fromBackendGradeItemStatus(cell.status);
      if (cell.status === "entered") completedItems++;
    } else {
      scoresByAssessmentId[assessmentId] = null;
      statusByAssessmentId[assessmentId] = "missing";
    }
  }

  return {
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    studentNameEn,
    studentNameAr,
    studentCode: row.student?.code ?? null,
    admissionNo: row.student?.admissionNo ?? null,
    classroomName: undefined,
    status: row.status,
    scoresByAssessmentId,
    statusByAssessmentId,
    average: row.finalPercent ?? 0,
    completedItems: row.totalEnteredCount ?? completedItems,
    totalItems,
  };
}

// ── Full gradebook response → UI ─────────────────────────────────────

export function mapGradebookResponseToUi(response: BackendGradebookResponse): GradebookResponse {
  const columns = response.columns ?? [];
  const backendRows = response.rows ?? [];
  const backendSummary = response.summary;

  const assessments = columns.map(mapBackendColumnToAssessment);
  const rows = backendRows.map((row) => mapBackendRowToStudentRow(row, columns));

  const summary: GradesPageSummary = {
    totalStudents: backendSummary?.studentCount ?? rows.length,
    totalAssessments: backendSummary?.assessmentCount ?? columns.length,
    classAverage: backendSummary?.averagePercent ?? 0,
    highestAverage: 0,
    lowestAverage: 0,
    completionRate: backendSummary?.studentCount
      ? Math.round(
          ((backendSummary.studentCount - (backendSummary.incompleteCount ?? 0)) /
            backendSummary.studentCount) *
            1000,
        ) / 10
      : 0,
  };

  // Derive trend from columns + rows: for each assessment, compute the class average
  const trend: AssessmentTrendPoint[] = columns.map((column) => {
    const assessmentId = column.assessmentId;
    const colNames = resolveEntityName({
      id: column.assessmentId,
      title: column.title,
      titleAr: column.titleAr,
      titleEn: column.titleEn,
    });

    let totalScore = 0;
    let enteredCount = 0;

    for (const row of backendRows) {
      const cell = row.cells?.find((c) => c.assessmentId === assessmentId);
      if (cell?.status === "entered" && cell.score != null) {
        totalScore += cell.score;
        enteredCount++;
      }
    }

    const maxScore = column.maxScore ?? 0;
    const average = enteredCount > 0 && maxScore > 0
      ? Math.round(((totalScore / enteredCount) / maxScore) * 1000) / 10
      : 0;

    return {
      assessmentId,
      label: colNames.nameEn || colNames.name,
      date: column.date ?? "",
      average,
      weight: column.weight ?? 0,
      enteredCount,
      maxScore,
    };
  });

  return { assessments, rows, summary, trend };
}

// ── Grade rule mapping ───────────────────────────────────────────────

export function mapBackendGradeRuleToUi(
  response: BackendGradeRuleResponse | null | undefined,
): GradeRule | null {
  if (!response) return null;
  return {
    id: response.ruleId ?? response.id ?? "",
    scopeType: (response.scopeType as GradeRule["scopeType"]) ?? "school",
    scopeId: response.scopeId ?? "",
    gradingScale: "percentage",
    passMark: response.passMark ?? 50,
    rounding:
      response.rounding?.toLowerCase() === "none"
        ? "none"
        : response.rounding?.toLowerCase() === "decimal_0"
          ? "decimal_0"
          : response.rounding?.toLowerCase() === "decimal_2"
            ? "decimal_2"
            : "decimal_1",
  };
}

// ── Roster item mapping ──────────────────────────────────────────────

export function mapBackendRosterItemToUi(item: BackendAssessmentRosterItem): AssessmentRosterItem {
  return {
    studentId: item.studentId,
    studentNameEn: item.student?.nameEn ?? item.student?.fullName ?? "",
    studentNameAr: item.student?.nameAr ?? item.student?.nameEn ?? item.student?.fullName ?? "",
    classroomName: undefined,
    score: item.score ?? null,
    status: fromBackendGradeItemStatus(item.status),
    comment: item.comment ?? undefined,
  };
}

// ── Submission detail → AssessmentSubmissionReview ────────────────────

export function mapSubmissionDetailToReview(
  detail: BackendSubmissionDetailResponse,
  assessment: Assessment,
): AssessmentSubmissionReview {
  return {
    submission: {
      id: detail.id,
      termId: detail.termId ?? assessment.termId,
      assessmentId: detail.assessmentId,
      studentId: detail.studentId,
      status: (detail.status as AssessmentSubmissionReview["submission"]["status"]) ?? "not_started",
      submittedAt: detail.submittedAt ?? undefined,
      totalScore: detail.totalScore,
      maxScore: detail.maxScore ?? assessment.maxScore,
    },
    assessment,
    studentNameEn:
      detail.student?.nameEn ??
      [detail.student?.firstName, detail.student?.lastName].filter(Boolean).join(" "),
    studentNameAr: detail.student?.nameAr ?? detail.student?.nameEn ?? "",
    questions: (detail.questions ?? []).map((q) => {
      const metadata = q.metadata ?? {};
      return {
      question: {
        id: q.id,
        assessmentId: q.assessmentId,
        assignmentId: "",
        questionTextAr: q.promptAr ?? "",
        questionTextEn: q.prompt ?? "",
        questionType: fromBackendQuestionType(q.type),
        points: q.points ?? 0,
        order: q.sortOrder ?? 0,
        options: q.options?.map((o) => ({
          id: o.id,
          textAr: o.labelAr ?? "",
          textEn: o.label ?? "",
          isCorrect: o.isCorrect ?? false,
          order: o.sortOrder ?? 0,
        })),
        correctAnswer: typeof q.answerKey === "boolean" ? q.answerKey : undefined,
        sampleAnswerAr: typeof metadata.sampleAnswerAr === "string" ? metadata.sampleAnswerAr : undefined,
        sampleAnswerEn: typeof metadata.sampleAnswerEn === "string" ? metadata.sampleAnswerEn : undefined,
        acceptedAnswersAr: Array.isArray(metadata.acceptedAnswersAr)
          ? metadata.acceptedAnswersAr.filter((answer): answer is string => typeof answer === "string")
          : undefined,
        acceptedAnswersEn: Array.isArray(metadata.acceptedAnswersEn)
          ? metadata.acceptedAnswersEn.filter((answer): answer is string => typeof answer === "string")
          : undefined,
        matchingPairs: Array.isArray(metadata.matchingPairs) ? metadata.matchingPairs as AssessmentSubmissionReview["questions"][number]["question"]["matchingPairs"] : undefined,
        mediaMode: metadata.mediaMode === "FILE" || metadata.mediaMode === "LINK" ? metadata.mediaMode : undefined,
        mediaTitle: typeof metadata.mediaTitle === "string" ? metadata.mediaTitle : undefined,
        mediaUrl: typeof metadata.mediaUrl === "string" ? metadata.mediaUrl : undefined,
        mediaFileName: typeof metadata.mediaFileName === "string" ? metadata.mediaFileName : undefined,
        mediaMimeType: typeof metadata.mediaMimeType === "string" ? metadata.mediaMimeType : undefined,
        mediaSize: typeof metadata.mediaSize === "number" ? metadata.mediaSize : undefined,
        createdAt: q.createdAt ?? "",
      },
      answer: q.answer
        ? {
            id: q.answer.id,
            submissionId: detail.id,
            assessmentId: detail.assessmentId,
            questionId: q.answer.questionId,
            studentId: detail.studentId,
            selectedOptionIds: q.answer.selectedOptions?.map((option) => option.optionId),
            answerText: q.answer.answerText ?? undefined,
            awardedPoints: q.answer.awardedPoints,
            correctionStatus: (q.answer.correctionStatus ?? "pending") as "pending" | "corrected",
            teacherComment: q.answer.reviewerComment ?? undefined,
          }
        : null,
    };
    }),
  };
}
