export type AssessmentType =
  | "QUIZ"
  | "ASSIGNMENT"
  | "MIDTERM"
  | "FINAL"
  | "PRACTICAL";

export type AssessmentDeliveryMode = "SCORE_ONLY" | "QUESTION_BASED";

export type GradeItemStatus = "entered" | "missing" | "absent";

export interface Assessment {
  id: string;
  termId: string;
  subjectId: string;
  sectionId: string;
  classroomId?: string;
  title: string;
  titleAr: string;
  type: AssessmentType;
  deliveryMode: AssessmentDeliveryMode;
  date: string;
  weight: number;
  maxScore: number;
  isLocked: boolean;
  approvalStatus: "draft" | "published" | "approved";
}

export interface GradeItem {
  id: string;
  termId: string;
  assessmentId: string;
  studentId: string;
  score: number | null;
  comment?: string;
  status: GradeItemStatus;
}

export interface GradeRule {
  id: string;
  scopeType: "school" | "grade";
  scopeId: string;
  gradingScale: "percentage";
  passMark: number;
  rounding: "whole" | "decimal_1";
}

export interface Rubric {
  id: string;
  assessmentId: string;
  criteria: Array<{
    id: string;
    label: string;
    points: number;
  }>;
}

export interface ReportCardSummary {
  studentId: string;
  average: number;
  status: "pass" | "fail";
  totalAssessments: number;
}

export interface GradebookStudentRow {
  studentId: string;
  studentNameEn: string;
  studentNameAr: string;
  classroomName?: string;
  scoresByAssessmentId: Record<string, number | null>;
  statusByAssessmentId: Record<string, GradeItemStatus>;
  average: number;
  completedItems: number;
  totalItems: number;
}

export interface AssessmentTrendPoint {
  assessmentId: string;
  label: string;
  date: string;
  average: number;
  weight: number;
  enteredCount: number;
  maxScore: number;
}

export interface GradesPageSummary {
  totalStudents: number;
  totalAssessments: number;
  classAverage: number;
  highestAverage: number;
  lowestAverage: number;
  completionRate: number;
}

export interface GradebookResponse {
  assessments: Assessment[];
  rows: GradebookStudentRow[];
  summary: GradesPageSummary;
  trend: AssessmentTrendPoint[];
}

export interface CreateAssessmentPayload {
  termId: string;
  subjectId: string;
  sectionId: string;
  classroomId?: string;
  title: string;
  titleAr: string;
  type: AssessmentType;
  deliveryMode?: AssessmentDeliveryMode;
  date: string;
  weight: number;
  maxScore: number;
}

export interface QuestionOption {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
  order: number;
}

export interface AssessmentQuestion extends Record<string, unknown> {
  id: string;
  assessmentId: string;
  assignmentId: string;
  questionTextAr: string;
  questionTextEn: string;
  questionType: "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
  points: number;
  order: number;
  options?: QuestionOption[];
  correctAnswer?: boolean;
  sampleAnswerAr?: string;
  sampleAnswerEn?: string;
  createdAt: string;
}

export interface UpdateGradeItemPayload {
  assessmentId: string;
  studentId: string;
  score: number | null;
  status: GradeItemStatus;
  comment?: string;
}

export interface BulkGradeItemPayload {
  studentId: string;
  score: number | null;
  status: GradeItemStatus;
  comment?: string;
}

export interface AssessmentRosterItem {
  studentId: string;
  studentNameEn: string;
  studentNameAr: string;
  classroomName?: string;
  score: number | null;
  status: GradeItemStatus;
  comment?: string;
}

export interface StudentSubjectGradeSummary {
  subjectId: string;
  subjectName: string;
  subjectNameAr: string;
  average: number;
  lastAssessmentScore: number | null;
  assessmentsCount: number;
  trend: "up" | "down" | "stable";
}

export interface StudentGradesSnapshot {
  studentId: string;
  academicYearId?: string;
  termId?: string;
  subjectRows: StudentSubjectGradeSummary[];
  currentAverage: number;
  highestAverage: number;
  lowestAverage: number;
  totalAssessments: number;
  performanceTrend: Array<{
    label: string;
    average: number;
  }>;
}
