import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from "@/lib/api";
import type {
  BackendAssessmentRosterItem,
  BackendAssessmentResponse,
  BackendAssessmentQuestionResponse,
} from "../../gradebook/types/api.types";
import type {
  AssessmentRosterItem,
  GradeItemStatus,
  CreateAssessmentPayload,
  Assessment,
  AssessmentQuestion,
} from "../../shared/types";
import {
  mapBackendRosterItemToUi,
  toBackendGradeItemStatus,
  mapBackendAssessmentToAssessment,
} from "../../gradebook/utils/gradebookMappers";

// ── Local helper: Backend question → frontend AssessmentQuestion ─────

function mapBackendQuestionToUi(
  q: BackendAssessmentQuestionResponse,
): AssessmentQuestion {
  return {
    id: q.id,
    assessmentId: q.assessmentId,
    assignmentId: q.assignmentId ?? "",
    questionTextAr: q.questionTextAr ?? "",
    questionTextEn: q.questionTextEn ?? "",
    questionType: (q.questionType ?? "SHORT_ANSWER") as AssessmentQuestion["questionType"],
    points: q.points ?? 0,
    order: q.order ?? 0,
    options: q.options?.map((o) => ({
      id: o.id,
      textAr: o.textAr ?? "",
      textEn: o.textEn ?? "",
      isCorrect: o.isCorrect ?? false,
      order: o.order ?? 0,
    })),
    correctAnswer: q.correctAnswer,
    sampleAnswerAr: q.sampleAnswerAr,
    sampleAnswerEn: q.sampleAnswerEn,
    acceptedAnswersAr: q.acceptedAnswersAr,
    acceptedAnswersEn: q.acceptedAnswersEn,
    matchingPairs: q.matchingPairs?.map((m) => ({
      id: m.id,
      promptAr: m.promptAr ?? "",
      promptEn: m.promptEn ?? "",
      matchAr: m.matchAr ?? "",
      matchEn: m.matchEn ?? "",
      order: m.order ?? 0,
    })),
    mediaMode: q.mediaMode,
    mediaTitle: q.mediaTitle,
    mediaUrl: q.mediaUrl,
    mediaFileName: q.mediaFileName,
    mediaMimeType: q.mediaMimeType,
    mediaSize: q.mediaSize,
    createdAt: q.createdAt ?? "",
  };
}

// ── 1. Fetch assessment roster ───────────────────────────────────────

export async function fetchAssessmentRoster(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<AssessmentRosterItem[]> {
  const items = await apiGet<BackendAssessmentRosterItem[]>(
    `/grades/assessments/${assessmentId}/items`,
    { params: { academicYearId, termId, includeMissingStudents: true } },
  );
  return items.map(mapBackendRosterItemToUi);
}

// ── 2. Bulk update assessment grades ─────────────────────────────────

export async function bulkUpdateAssessmentGrades(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  items: Array<{
    studentId: string;
    score: number | null;
    status: GradeItemStatus;
    comment?: string;
  }>,
): Promise<void> {
  const backendItems = items.map((item) => ({
    studentId: item.studentId,
    score: item.score,
    status: toBackendGradeItemStatus(item.status),
    comment: item.comment,
  }));

  await apiPut(
    `/grades/assessments/${assessmentId}/items`,
    { items: backendItems },
    { params: { academicYearId, termId } },
  );
}

// ── 3. Publish assessment ────────────────────────────────────────────

export async function publishAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  await apiPost(
    `/grades/assessments/${assessmentId}/publish`,
    { academicYearId, termId },
  );
}

// ── 4. Approve assessment ────────────────────────────────────────────

export async function approveAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  await apiPost(
    `/grades/assessments/${assessmentId}/approve`,
    { academicYearId, termId },
  );
}

// ── 5. Lock assessment ───────────────────────────────────────────────

export async function lockAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  await apiPost(
    `/grades/assessments/${assessmentId}/lock`,
    { academicYearId, termId },
  );
}

// ── 6. Update assessment ─────────────────────────────────────────────

export async function updateAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  payload: CreateAssessmentPayload,
): Promise<Assessment> {
  const response = await apiPatch<BackendAssessmentResponse>(
    `/grades/assessments/${assessmentId}`,
    payload,
    { params: { academicYearId, termId } },
  );
  return mapBackendAssessmentToAssessment(response);
}

// ── 7. Delete assessment ─────────────────────────────────────────────

export async function deleteAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  await apiDelete(
    `/grades/assessments/${assessmentId}`,
    { params: { academicYearId, termId } },
  );
}

// ── 8. Create assessment ─────────────────────────────────────────────

export async function createAssessment(
  academicYearId: string,
  payload: CreateAssessmentPayload,
): Promise<{ id: string }> {
  const result = await apiPost<{ id: string }>(
    "/grades/assessments",
    payload,
    { params: { academicYearId } },
  );
  return { id: result.id };
}

// ── 9. Create assessment with questions ──────────────────────────────

export async function createAssessmentWithQuestions(
  academicYearId: string,
  payload: { assessment: CreateAssessmentPayload; questions: unknown[] },
): Promise<{ id: string }> {
  const result = await apiPost<{ id: string }>(
    "/grades/assessments/question-based",
    payload,
    { params: { academicYearId } },
  );
  return { id: result.id };
}

// ── 10. Get assessment type label key (pure) ─────────────────────────

const ASSESSMENT_TYPE_LABEL_KEYS: Record<string, string> = {
  QUIZ: "assessmentTypes.quiz",
  MONTH_EXAM: "assessmentTypes.monthExam",
  MIDTERM: "assessmentTypes.midterm",
  TERM_EXAM: "assessmentTypes.termExam",
};

export function getAssessmentTypeLabelKey(type: string): string {
  return ASSESSMENT_TYPE_LABEL_KEYS[type] ?? "assessmentTypes.quiz";
}

// ── 11. Fetch assessment by ID ───────────────────────────────────────

export async function fetchAssessmentById(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<Assessment> {
  const response = await apiGet<BackendAssessmentResponse>(
    `/grades/assessments/${assessmentId}`,
    { params: { academicYearId, termId } },
  );
  return mapBackendAssessmentToAssessment(response);
}

// ── 12. Fetch assessment questions ───────────────────────────────────

export async function fetchAssessmentQuestions(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<AssessmentQuestion[]> {
  const questions = await apiGet<BackendAssessmentQuestionResponse[]>(
    `/grades/assessments/${assessmentId}/questions`,
    { params: { academicYearId, termId } },
  );
  return questions.map(mapBackendQuestionToUi);
}

// ── 13. Create assessment question ───────────────────────────────────

export async function createAssessmentQuestion(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  questionPayload: unknown,
): Promise<AssessmentQuestion> {
  const response = await apiPost<BackendAssessmentQuestionResponse>(
    `/grades/assessments/${assessmentId}/questions`,
    questionPayload,
    { params: { academicYearId, termId } },
  );
  return mapBackendQuestionToUi(response);
}

// ── 14. Update assessment question ───────────────────────────────────

export async function updateAssessmentQuestion(
  academicYearId: string,
  termId: string,
  questionId: string,
  questionPayload: unknown,
): Promise<AssessmentQuestion> {
  const response = await apiPatch<BackendAssessmentQuestionResponse>(
    `/grades/questions/${questionId}`,
    questionPayload,
    { params: { academicYearId, termId } },
  );
  return mapBackendQuestionToUi(response);
}

// ── 15. Delete assessment question ───────────────────────────────────

export async function deleteAssessmentQuestion(
  academicYearId: string,
  termId: string,
  questionId: string,
): Promise<void> {
  await apiDelete(
    `/grades/questions/${questionId}`,
    { params: { academicYearId, termId } },
  );
}

// ── 16. Reorder assessment questions ─────────────────────────────────

export async function reorderAssessmentQuestions(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  orderedIds: string[],
): Promise<void> {
  await apiPut(
    `/grades/assessments/${assessmentId}/questions/reorder`,
    { orderedIds },
    { params: { academicYearId, termId } },
  );
}

// ── 17. Bulk update assessment question points ───────────────────────

export async function bulkUpdateAssessmentQuestionPoints(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  updates: Array<{ questionId: string; points: number }>,
): Promise<void> {
  await apiPut(
    `/grades/assessments/${assessmentId}/questions/points`,
    { updates },
    { params: { academicYearId, termId } },
  );
}
