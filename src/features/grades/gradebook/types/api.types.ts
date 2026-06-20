import type {
  AssessmentDeliveryMode,
  AssessmentType,
  ExamScopeType,
  LegacyAssessmentType,
} from "../../shared/types";

export type BackendGradeItemStatus = "ENTERED" | "MISSING" | "ABSENT";

export type BackendApprovalStatus = "DRAFT" | "PUBLISHED" | "APPROVED";

export type BackendAssessmentType = AssessmentType | LegacyAssessmentType;

export interface BackendNamedEntity {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  parentId?: string | null;
}

export interface BackendGradesBootstrapResponse {
  academicYears?: BackendNamedEntity[];
  terms?: BackendNamedEntity[];
  stages?: BackendNamedEntity[];
  grades?: BackendNamedEntity[];
  sections?: BackendNamedEntity[];
  classrooms?: BackendNamedEntity[];
  subjects?: BackendNamedEntity[];
  defaults?: {
    academicYearId?: string | null;
    termId?: string | null;
  };
  supportedScopes?: ExamScopeType[];
  assessmentTypes?: BackendAssessmentType[];
  deliveryModes?: AssessmentDeliveryMode[];
  approvalStatuses?: BackendApprovalStatus[];
}

//Gradebook query types
export interface BackendGradebookQuery {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  subjectId?: string;
  scopeType?: ExamScopeType;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  search?: string;
  assessmentStatus?: BackendApprovalStatus;
  includeVirtualMissing?: boolean;
}

//Backend Gradebook response types
export interface BackendGradebookColumn {
  id: string;
  assessmentId?: string;
  termId?: string;
  subjectId?: string;
  subject?: BackendNamedEntity | null;

  scopeType?: ExamScopeType;
  scopeId?: string | null;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;

  title?: string;
  titleAr?: string;
  titleEn?: string;

  type?: BackendAssessmentType;
  deliveryMode?: AssessmentDeliveryMode;

  date?: string;
  weight?: number;
  maxScore?: number;
  expectedTimeMinutes?: number | null;

  approvalStatus?: BackendApprovalStatus;
  isLocked?: boolean;
}

export interface BackendGradebookCell {
  assessmentId: string;
  gradeItemId?: string | null;
  score?: number | null;
  status?: BackendGradeItemStatus | null;
  percent?: number | null;
  weightedContribution?: number | null;
  comment?: string | null;
  isVirtualMissing?: boolean;
}

export interface BackendGradebookStudent {
  id?: string;
  studentId?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  fullName?: string;
  fullNameAr?: string;
  fullNameEn?: string;
}

export interface BackendGradebookRow {
  studentId: string;
  student?: BackendGradebookStudent | null;

  studentName?: string;
  studentNameAr?: string;
  studentNameEn?: string;

  classroomId?: string | null;
  classroomName?: string | null;
  classroomNameAr?: string | null;
  classroomNameEn?: string | null;

  finalPercent?: number | null;
  average?: number | null;

  completedWeight?: number | null;
  completedItems?: number;
  totalItems?: number;

  enteredCount?: number;
  missingCount?: number;
  absentCount?: number;

  cells?: BackendGradebookCell[];
}

export interface BackendGradebookSummary {
  totalStudents?: number;
  totalAssessments?: number;
  classAverage?: number;
  highestAverage?: number;
  lowestAverage?: number;
  completionRate?: number;
}

export interface BackendGradebookResponse {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  subjectId?: string;
  scope?: unknown;
  rule?: {
    id?: string;
    passMark?: number;
    scopeType?: "school" | "grade";
    scopeId?: string;
    gradingScale?: "percentage";
    rounding?: "whole" | "decimal_1";
  } | null;
  columns?: BackendGradebookColumn[];
  rows?: BackendGradebookRow[];
  summary?: BackendGradebookSummary;
}

//Grade item update types
export interface BackendUpdateGradeItemPayload {
  status: BackendGradeItemStatus;
  score?: number | null;
  comment?: string | null;
}

export interface BackendBulkGradeItemPayload {
  items: Array<{
    studentId: string;
    status: BackendGradeItemStatus;
    score?: number | null;
    comment?: string | null;
  }>;
}

//Assessment roster types
export interface BackendAssessmentRosterItem {
  studentId: string;
  studentName?: string;
  studentNameAr?: string;
  studentNameEn?: string;
  classroomName?: string | null;
  score?: number | null;
  status?: BackendGradeItemStatus | null;
  comment?: string | null;
  isVirtualMissing?: boolean;
}

// Assessment list response (GET /grades/assessments)
export interface BackendAssessmentResponse {
  id: string;
  termId?: string;
  subjectId?: string;
  subject?: BackendNamedEntity | null;

  scopeType?: ExamScopeType;
  scopeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;

  title?: string;
  titleAr?: string;
  titleEn?: string;

  type?: BackendAssessmentType;
  deliveryMode?: AssessmentDeliveryMode;

  date?: string;
  weight?: number;
  maxScore?: number;
  expectedTimeMinutes?: number | null;

  approvalStatus?: BackendApprovalStatus;
  isLocked?: boolean;
}

// Grade rule response (GET /grades/rules/effective)
export interface BackendGradeRuleResponse {
  id?: string;
  scopeType?: "school" | "grade";
  scopeId?: string;
  gradingScale?: "percentage";
  passMark?: number;
  rounding?: "whole" | "decimal_1";
}

// Submission flow types
export interface BackendSubmissionResolveResponse {
  submissionId: string;
  assessmentId: string;
  studentId: string;
  status?: string;
  submittedAt?: string;
  totalScore?: number | null;
  maxScore?: number;
}

export interface BackendSubmissionAnswerResponse {
  id: string;
  submissionId: string;
  assessmentId: string;
  questionId: string;
  studentId: string;
  selectedOptionIds?: string[];
  booleanAnswer?: boolean;
  answerText?: string;
  awardedPoints: number | null;
  correctionStatus?: "pending" | "corrected";
  teacherComment?: string;
}

export interface BackendSubmissionDetailResponse {
  id: string;
  termId?: string;
  assessmentId: string;
  studentId: string;
  status?: string;
  submittedAt?: string;
  totalScore: number | null;
  maxScore: number;
  assessment?: BackendAssessmentResponse;
  studentNameEn?: string;
  studentNameAr?: string;
  questions?: Array<{
    question: BackendAssessmentQuestionResponse;
    answer: BackendSubmissionAnswerResponse | null;
  }>;
}

export interface BackendSubmissionReviewPayload {
  answers: Array<{
    answerId: string;
    awardedPoints: number | null;
    teacherComment?: string;
  }>;
}

// Assessment questions types (GET /grades/assessments/:id/questions)
export interface BackendAssessmentQuestionResponse {
  id: string;
  assessmentId: string;
  assignmentId?: string;
  questionTextAr?: string;
  questionTextEn?: string;
  questionType?: string;
  points?: number;
  order?: number;
  options?: Array<{
    id: string;
    textAr?: string;
    textEn?: string;
    isCorrect?: boolean;
    order?: number;
  }>;
  correctAnswer?: boolean;
  sampleAnswerAr?: string;
  sampleAnswerEn?: string;
  acceptedAnswersAr?: string[];
  acceptedAnswersEn?: string[];
  matchingPairs?: Array<{
    id: string;
    promptAr?: string;
    promptEn?: string;
    matchAr?: string;
    matchEn?: string;
    order?: number;
  }>;
  mediaMode?: "FILE" | "LINK";
  mediaTitle?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  createdAt?: string;
}
