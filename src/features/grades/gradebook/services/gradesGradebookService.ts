import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  BackendAssessmentRosterItem,
  BackendGradesBootstrapResponse,
  BackendSubmissionDetailResponse,
  BackendSubmissionResolveResponse,
} from "../types/api.types";
import type {
  AssessmentSubmissionReview,
  BulkGradeItemPayload,
  GradesFiltersData,
  UpdateGradeItemPayload,
} from "../../shared/types";
import {
  mapBackendAssessmentToAssessment,
  mapBootstrapToFiltersData,
  mapSubmissionDetailToReview,
  toBackendGradeItemStatus,
} from "../utils/gradebookMappers";

// ── Filters / bootstrap ──────────────────────────────────────────────

export async function fetchGradesFiltersData(
  academicYearId: string,
  termId: string,
): Promise<GradesFiltersData> {
  const response = await apiGet<BackendGradesBootstrapResponse>(
    "/grades/bootstrap",
    { params: { academicYearId, termId } },
  );
  return mapBootstrapToFiltersData(response);
}

// ── Grade-item detail (comment lookup) ───────────────────────────────

export async function fetchGradeItemDetail(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
): Promise<{ comment?: string } | null> {
  const items = await apiGet<BackendAssessmentRosterItem[]>(
    `/grades/assessments/${assessmentId}/items`,
    { params: { academicYearId, termId, includeMissingStudents: true } },
  );

  const item = items.find((i) => i.studentId === studentId);
  if (!item) return null;

  return { comment: item.comment ?? undefined };
}

// ── Submission review (question-based assessment) ────────────────────

export async function fetchAssessmentSubmissionReview(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
): Promise<AssessmentSubmissionReview> {
  // Step 1: Resolve (or create) the submission for this student
  const resolved = await apiPost<BackendSubmissionResolveResponse>(
    `/grades/assessments/${assessmentId}/submissions/resolve`,
    { studentId, academicYearId, termId },
  );

  // Step 2: Fetch the full submission detail (includes questions + answers)
  const detail = await apiGet<BackendSubmissionDetailResponse>(
    `/grades/submissions/${resolved.submissionId}`,
  );

  // Step 3: Map the embedded assessment and build the review object
  const assessment = detail.assessment
    ? mapBackendAssessmentToAssessment(detail.assessment)
    : mapBackendAssessmentToAssessment({
        id: assessmentId,
        titleEn: "",
        titleAr: "",
      });

  return mapSubmissionDetailToReview(detail, assessment);
}

// ── Save submission correction ───────────────────────────────────────

export async function saveAssessmentSubmissionCorrection(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
  answers: Array<{
    answerId: string;
    awardedPoints: number | null;
    teacherComment?: string;
  }>,
): Promise<void> {
  // Step 1: Resolve the submission
  const resolved = await apiPost<BackendSubmissionResolveResponse>(
    `/grades/assessments/${assessmentId}/submissions/resolve`,
    { studentId, academicYearId, termId },
  );

  const { submissionId } = resolved;

  // Step 2: Save the reviewed answers
  await apiPut(`/grades/submissions/${submissionId}/answers/review`, {
    answers,
  });

  // Step 3: Finalize the review
  await apiPost(`/grades/submissions/${submissionId}/review/finalize`);

  // Step 4: Sync back to the grade item
  await apiPost(`/grades/submissions/${submissionId}/sync-grade-item`);
}

// ── Single grade-item update ─────────────────────────────────────────

export async function updateGradeItem(
  academicYearId: string,
  termId: string,
  payload: UpdateGradeItemPayload,
): Promise<void> {
  const backendPayload = {
    status: toBackendGradeItemStatus(payload.status),
    score: payload.score,
    comment: payload.comment ?? null,
  };

  await apiPut(
    `/grades/assessments/${payload.assessmentId}/items/${payload.studentId}`,
    backendPayload,
    { params: { academicYearId, termId } },
  );
}

// ── Bulk grade-item update ───────────────────────────────────────────

export async function bulkUpdateGradeItems(
  assessmentId: string,
  items: BulkGradeItemPayload[],
  params?: { academicYearId?: string; termId?: string },
): Promise<void> {
  const backendItems = items.map((item) => ({
    studentId: item.studentId,
    status: toBackendGradeItemStatus(item.status),
    score: item.score,
    comment: item.comment ?? null,
  }));

  await apiPut(
    `/grades/assessments/${assessmentId}/items`,
    { items: backendItems },
    { params },
  );
}
