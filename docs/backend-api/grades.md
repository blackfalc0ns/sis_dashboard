# Grades API Contract

Status: `Service-derived`

The grades feature currently uses local services, so the contract below is derived from current types and function signatures.

Base path: `/grades`

## Main Response Models

```ts
type ExamScopeType = "school" | "stage" | "grade" | "section" | "classroom";
type AssessmentDeliveryMode = "SCORE_ONLY" | "QUESTION_BASED";

interface Assessment {
  id: string;
  termId: string;
  subjectId: string;
  scopeType: ExamScopeType;
  scopeId: string;
  sectionId?: string;
  classroomId?: string;
  title: string;
  titleAr: string;
  type: "QUIZ" | "MONTH_EXAM" | "MIDTERM" | "TERM_EXAM" | "ASSIGNMENT" | "FINAL" | "PRACTICAL";
  deliveryMode: AssessmentDeliveryMode;
  date: string;
  weight: number;
  maxScore: number;
  isLocked: boolean;
  approvalStatus: "draft" | "published" | "approved";
}

interface GradeItem {
  id: string;
  termId: string;
  assessmentId: string;
  studentId: string;
  score: number | null;
  comment?: string;
  status: "entered" | "missing" | "absent";
}

interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  assignmentId: string;
  questionTextAr: string;
  questionTextEn: string;
  questionType: "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
  points: number;
  order: number;
  options?: Array<{ id: string; textAr: string; textEn: string; isCorrect: boolean; order: number }>;
  correctAnswer?: boolean;
  sampleAnswerAr?: string;
  sampleAnswerEn?: string;
  createdAt: string;
}

interface AssessmentSubmissionReview {
  submission: {
    id: string;
    termId: string;
    assessmentId: string;
    studentId: string;
    status: "not_started" | "submitted" | "in_progress" | "corrected";
    submittedAt?: string;
    totalScore: number | null;
    maxScore: number;
  };
  assessment: Assessment;
  studentNameEn: string;
  studentNameAr: string;
  questions: Array<{
    question: AssessmentQuestion;
    answer: {
      id: string;
      submissionId: string;
      questionId: string;
      selectedOptionIds?: string[];
      booleanAnswer?: boolean;
      answerText?: string;
      awardedPoints: number | null;
      correctionStatus: "pending" | "corrected";
      teacherComment?: string;
    } | null;
  }>;
}

interface GradebookResponse {
  assessments: Assessment[];
  rows: Array<{
    studentId: string;
    studentNameEn: string;
    studentNameAr: string;
    classroomName?: string;
    scoresByAssessmentId: Record<string, number | null>;
    statusByAssessmentId: Record<string, "entered" | "missing" | "absent">;
    average: number;
    completedItems: number;
    totalItems: number;
  }>;
  summary: {
    totalStudents: number;
    totalAssessments: number;
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
    completionRate: number;
  };
  trend: Array<{
    assessmentId: string;
    label: string;
    date: string;
    average: number;
    weight: number;
    enteredCount: number;
    maxScore: number;
  }>;
}

interface GradeRule {
  id: string;
  scopeType: "school" | "grade";
  scopeId: string;
  gradingScale: "percentage";
  passMark: number;
  rounding: "whole" | "decimal_1";
}
```

## Core Request DTOs

```ts
interface CreateAssessmentPayload {
  termId: string;
  subjectId: string;
  scopeType: ExamScopeType;
  scopeId: string;
  sectionId?: string;
  classroomId?: string;
  title: string;
  titleAr: string;
  type: "QUIZ" | "MONTH_EXAM" | "MIDTERM" | "TERM_EXAM";
  deliveryMode: "SCORE_ONLY" | "QUESTION_BASED";
  date: string;
  weight: number;
  maxScore: number;
}

interface UpdateGradeItemPayload {
  assessmentId: string;
  studentId: string;
  score: number | null;
  status: "entered" | "missing" | "absent";
  comment?: string;
}

interface BulkGradeItemPayload {
  studentId: string;
  score: number | null;
  status: "entered" | "missing" | "absent";
  comment?: string;
}
```

## Endpoints

### Gradebook and Analytics

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/grades/gradebook` | query: `academicYearId`, `termId`, `scopeType?`, `scopeId?`, `subjectId?`, `includeDrafts?` | `GradebookResponse` |
| `GET` | `/grades/analytics` | same filters as gradebook | `GradesAnalyticsReport` |
| `GET` | `/grades/filters-data` | query: `academicYearId`, `termId` | `GradesFiltersData` |
| `GET` | `/grades/rules/scope` | query: `academicYearId`, `termId`, `scopeType`, `scopeId` | `GradeRule \| null` |
| `GET` | `/grades/rules/sections/:sectionId` | query: `academicYearId`, `termId` | `GradeRule \| null` |

### Assessments

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/grades/assessments` | query: `academicYearId`, `termId`, `scopeType?`, `scopeId?`, `subjectId?` | `Assessment[]` |
| `POST` | `/grades/assessments` | `CreateAssessmentPayload` | `Assessment` |
| `POST` | `/grades/assessments/with-questions` | `{ assessment: CreateAssessmentPayload, questions: AssessmentQuestion[] }` | `Assessment` |
| `GET` | `/grades/assessments/:id` | query: `academicYearId`, `termId` | `Assessment \| null` |
| `PATCH` | `/grades/assessments/:id` | `CreateAssessmentPayload` | `Assessment` |
| `DELETE` | `/grades/assessments/:id` | query: `academicYearId`, `termId` | `void` |
| `POST` | `/grades/assessments/:id/publish` | query or body: `academicYearId`, `termId` | `Assessment` |
| `POST` | `/grades/assessments/:id/approve` | query or body: `academicYearId`, `termId` | `Assessment` |
| `POST` | `/grades/assessments/:id/lock` | query or body: `academicYearId`, `termId` | `Assessment` |

### Grade Entry

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/grades/assessments/:id/roster` | query: `academicYearId`, `termId` | `AssessmentRosterItem[]` |
| `PATCH` | `/grades/grade-items` | `{ academicYearId, termId, ...UpdateGradeItemPayload }` | `GradeItem` |
| `PUT` | `/grades/assessments/:id/grades/bulk` | `{ academicYearId, termId, items: BulkGradeItemPayload[] }` | `AssessmentRosterItem[]` |
| `GET` | `/grades/grade-items/detail` | query: `academicYearId`, `termId`, `assessmentId`, `studentId` | `{ assessment, gradeItem, student }` |

### Question-Based Assessments

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/grades/assessments/:id/questions` | query: `academicYearId`, `termId` | `AssessmentQuestion[]` |
| `POST` | `/grades/assessments/:id/questions` | `{ academicYearId, termId, questionTextAr?, questionTextEn?, questionType?, points?, options?, correctAnswer?, sampleAnswerAr?, sampleAnswerEn? }` | `AssessmentQuestion` |
| `PATCH` | `/grades/questions/:questionId` | `{ academicYearId, termId, ...partialQuestion }` | `AssessmentQuestion` |
| `DELETE` | `/grades/questions/:questionId` | query: `academicYearId`, `termId` | `void` |
| `POST` | `/grades/assessments/:id/questions/reorder` | `{ academicYearId, termId, questionIds }` | `void` |
| `PATCH` | `/grades/assessments/:id/questions/points` | `{ academicYearId, termId, updates: Array<{ questionId, points }> }` | `void` |
| `GET` | `/grades/assessments/:id/submissions/:studentId/review` | query: `academicYearId`, `termId` | `AssessmentSubmissionReview` |
| `PUT` | `/grades/assessments/:id/submissions/:studentId/correction` | `{ academicYearId, termId, answers: Array<{ answerId, awardedPoints, teacherComment? }> }` | `AssessmentSubmissionReview` |

### Student View

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/grades/students/:studentId/snapshot` | query: `academicYearId?`, `termId?` | `StudentGradesSnapshot \| null` |

## Notes

- Scope validation matters in this module. The backend should reject assessments whose combined `weight` exceeds 100 for the same `subjectId + scopeType + scopeId`.
- For question-based assessments, question edits must be blocked after grading starts or after approval/lock.
