import type {
  BackendSubmissionAnswerResponse,
  BackendSubmissionDetailResponse,
  BackendSubmissionListRowResponse,
} from "../gradebook/types/api.types";

export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "CORRECTED";

export interface SubmissionListFilters {
  status?: SubmissionStatus;
  classroomId?: string;
  sectionId?: string;
  gradeId?: string;
  search?: string;
}

export type GradeSubmissionRow = BackendSubmissionListRowResponse;
export type GradeSubmissionDetail = BackendSubmissionDetailResponse;
export type GradeSubmissionAnswer = BackendSubmissionAnswerResponse;

export interface SaveSubmissionAnswerPayload {
  answerText?: string | null;
  answerJson?: Record<string, unknown> | null;
  selectedOptionIds?: string[] | null;
}

export interface BulkSaveSubmissionAnswerPayload extends SaveSubmissionAnswerPayload {
  questionId: string;
}

export interface ReviewSubmissionAnswerPayload {
  awardedPoints: number;
  reviewerComment?: string | null;
  reviewerCommentAr?: string | null;
}
