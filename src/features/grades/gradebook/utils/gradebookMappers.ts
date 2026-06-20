import type {
  BackendApprovalStatus,
  BackendAssessmentResponse,
  BackendGradebookCell,
  BackendGradebookColumn,
  BackendGradebookResponse,
  BackendGradebookRow,
  BackendGradeItemStatus,
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

const FRONTEND_TO_BACKEND_STATUS: Record<GradeItemStatus, BackendGradeItemStatus> = {
  entered: "ENTERED",
  missing: "MISSING",
  absent: "ABSENT",
};

const BACKEND_TO_FRONTEND_STATUS: Record<BackendGradeItemStatus, GradeItemStatus> = {
  ENTERED: "entered",
  MISSING: "missing",
  ABSENT: "absent",
};

export function toBackendGradeItemStatus(status: GradeItemStatus): BackendGradeItemStatus {
  return FRONTEND_TO_BACKEND_STATUS[status] ?? "MISSING";
}

export function fromBackendGradeItemStatus(status: BackendGradeItemStatus | null | undefined): GradeItemStatus {
  if (!status) return "missing";
  return BACKEND_TO_FRONTEND_STATUS[status] ?? "missing";
}

const BACKEND_TO_FRONTEND_APPROVAL: Record<BackendApprovalStatus, Assessment["approvalStatus"]> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  APPROVED: "approved",
};

export function fromBackendApprovalStatus(
  status: BackendApprovalStatus | null | undefined,
): Assessment["approvalStatus"] {
  if (!status) return "draft";
  return BACKEND_TO_FRONTEND_APPROVAL[status] ?? "draft";
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

export function mapBootstrapToFiltersData(
  response: BackendGradesBootstrapResponse,
): GradesFiltersData {
  const scopeTypes = response.supportedScopes ?? ["school", "stage", "grade", "section", "classroom"];

  const stages = mapNamedEntitiesToScopeEntities(response.stages, "stage");
  const grades = mapNamedEntitiesToScopeEntities(response.grades, "grade");
  const sections = mapNamedEntitiesToScopeEntities(response.sections, "section");
  const classrooms = mapNamedEntitiesToScopeEntities(response.classrooms, "classroom");

  const scopeEntities: Record<ExamScopeType, ScopeEntityOption[]> = {
    school: [],
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
    id: column.id,
    title: column.title,
    titleAr: column.titleAr,
    titleEn: column.titleEn,
  });

  return {
    id: column.assessmentId || column.id,
    termId: column.termId ?? "",
    subjectId: column.subjectId ?? column.subject?.id ?? "",
    scopeType: column.scopeType ?? "school",
    scopeId: column.scopeId ?? "",
    sectionId: column.sectionId ?? undefined,
    classroomId: column.classroomId ?? undefined,
    title: names.nameEn || names.name,
    titleAr: names.nameAr || names.name,
    type: column.type ?? "QUIZ",
    deliveryMode: column.deliveryMode ?? "SCORE_ONLY",
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
    deliveryMode: item.deliveryMode ?? "SCORE_ONLY",
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
    row.student?.fullNameEn || row.student?.nameEn || row.student?.fullName || row.student?.name || row.studentNameEn || row.studentName || "";
  const studentNameAr =
    row.student?.fullNameAr || row.student?.nameAr || row.studentNameAr || studentName;
  const studentNameEn =
    row.student?.fullNameEn || row.student?.nameEn || row.studentNameEn || studentName;

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
    const assessmentId = column.assessmentId || column.id;
    const cell = cellsByAssessmentId.get(assessmentId);

    if (cell) {
      scoresByAssessmentId[assessmentId] = cell.score ?? null;
      statusByAssessmentId[assessmentId] = fromBackendGradeItemStatus(cell.status);
      if (cell.status === "ENTERED") completedItems++;
    } else {
      scoresByAssessmentId[assessmentId] = null;
      statusByAssessmentId[assessmentId] = "missing";
    }
  }

  return {
    studentId: row.studentId,
    studentNameEn,
    studentNameAr,
    classroomName: row.classroomName ?? row.classroomNameEn ?? row.classroomNameAr ?? undefined,
    scoresByAssessmentId,
    statusByAssessmentId,
    average: row.average ?? row.finalPercent ?? 0,
    completedItems: row.completedItems ?? completedItems,
    totalItems: row.totalItems ?? totalItems,
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
    totalStudents: backendSummary?.totalStudents ?? rows.length,
    totalAssessments: backendSummary?.totalAssessments ?? columns.length,
    classAverage: backendSummary?.classAverage ?? 0,
    highestAverage: backendSummary?.highestAverage ?? 0,
    lowestAverage: backendSummary?.lowestAverage ?? 0,
    completionRate: backendSummary?.completionRate ?? 0,
  };

  // Derive trend from columns + rows: for each assessment, compute the class average
  const trend: AssessmentTrendPoint[] = columns.map((column) => {
    const assessmentId = column.assessmentId || column.id;
    const colNames = resolveEntityName({
      id: column.id,
      title: column.title,
      titleAr: column.titleAr,
      titleEn: column.titleEn,
    });

    let totalScore = 0;
    let enteredCount = 0;

    for (const row of backendRows) {
      const cell = row.cells?.find((c) => c.assessmentId === assessmentId);
      if (cell?.status === "ENTERED" && cell.score != null) {
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
    id: response.id ?? "",
    scopeType: response.scopeType ?? "school",
    scopeId: response.scopeId ?? "",
    gradingScale: response.gradingScale ?? "percentage",
    passMark: response.passMark ?? 50,
    rounding: response.rounding ?? "decimal_1",
  };
}

// ── Roster item mapping ──────────────────────────────────────────────

export function mapBackendRosterItemToUi(item: BackendAssessmentRosterItem): AssessmentRosterItem {
  return {
    studentId: item.studentId,
    studentNameEn: item.studentNameEn ?? item.studentName ?? "",
    studentNameAr: item.studentNameAr ?? item.studentName ?? "",
    classroomName: item.classroomName ?? undefined,
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
      submittedAt: detail.submittedAt,
      totalScore: detail.totalScore,
      maxScore: detail.maxScore,
    },
    assessment,
    studentNameEn: detail.studentNameEn ?? "",
    studentNameAr: detail.studentNameAr ?? "",
    questions: (detail.questions ?? []).map((q) => ({
      question: {
        id: q.question.id,
        assessmentId: q.question.assessmentId,
        assignmentId: q.question.assignmentId ?? "",
        questionTextAr: q.question.questionTextAr ?? "",
        questionTextEn: q.question.questionTextEn ?? "",
        questionType: (q.question.questionType ?? "SHORT_ANSWER") as any,
        points: q.question.points ?? 0,
        order: q.question.order ?? 0,
        options: q.question.options?.map((o) => ({
          id: o.id,
          textAr: o.textAr ?? "",
          textEn: o.textEn ?? "",
          isCorrect: o.isCorrect ?? false,
          order: o.order ?? 0,
        })),
        correctAnswer: q.question.correctAnswer,
        sampleAnswerAr: q.question.sampleAnswerAr,
        sampleAnswerEn: q.question.sampleAnswerEn,
        acceptedAnswersAr: q.question.acceptedAnswersAr,
        acceptedAnswersEn: q.question.acceptedAnswersEn,
        matchingPairs: q.question.matchingPairs?.map((m) => ({
          id: m.id,
          promptAr: m.promptAr ?? "",
          promptEn: m.promptEn ?? "",
          matchAr: m.matchAr ?? "",
          matchEn: m.matchEn ?? "",
          order: m.order ?? 0,
        })),
        mediaMode: q.question.mediaMode,
        mediaTitle: q.question.mediaTitle,
        mediaUrl: q.question.mediaUrl,
        mediaFileName: q.question.mediaFileName,
        mediaMimeType: q.question.mediaMimeType,
        mediaSize: q.question.mediaSize,
        createdAt: q.question.createdAt ?? "",
      },
      answer: q.answer
        ? {
            id: q.answer.id,
            submissionId: q.answer.submissionId,
            assessmentId: q.answer.assessmentId,
            questionId: q.answer.questionId,
            studentId: q.answer.studentId,
            selectedOptionIds: q.answer.selectedOptionIds,
            booleanAnswer: q.answer.booleanAnswer,
            answerText: q.answer.answerText,
            awardedPoints: q.answer.awardedPoints,
            correctionStatus: (q.answer.correctionStatus ?? "pending") as "pending" | "corrected",
            teacherComment: q.answer.teacherComment,
          }
        : null,
    })),
  };
}
