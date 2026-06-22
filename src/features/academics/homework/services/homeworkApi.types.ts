import type {
  AssignmentAttachment,
  AssignmentQuestion,
} from "@/features/academics/curriculum/services/curriculumService";

export type HomeworkAssignmentStatus =
  | "draft"
  | "published"
  | "closed"
  | "cancelled"
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "CANCELLED"
  | "archived"
  | "ARCHIVED";

export type HomeworkMode =
  | "homework"
  | "worksheet"
  | "writing_task"
  | "quiz"
  | "reading"
  | "project"
  | "HOMEWORK"
  | "WORKSHEET"
  | "WRITING_TASK"
  | "QUIZ"
  | "READING"
  | "PROJECT";

export type HomeworkTargetMode =
  | "classroom"
  | "selected_students"
  | "CLASSROOM"
  | "SELECTED_STUDENTS";

export interface BackendHomeworkListResponse {
  items: BackendHomeworkAssignmentDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BackendHomeworkAssignmentDto {
  id: string;
  title?: string;
  description?: string | null;
  mode?: HomeworkMode;
  status?: HomeworkAssignmentStatus;
  targetMode?: HomeworkTargetMode;
  academicYearId?: string;
  termId?: string;
  teacherSubjectAllocationId?: string;
  teacherUserId?: string;
  timetableEntryId?: string | null;
  scheduleDate?: string | null;
  publishAt?: string | null;
  publishedAt?: string | null;
  dueAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  estimatedMinutes?: number | null;
  totalMarks?: number | null;
  isGraded?: boolean;
  questionCount?: number;
  attachmentCount?: number;
  academicYear?: BackendNamedRef;
  term?: BackendNamedRef;
  classroom?: BackendNamedRef;
  subject?: BackendNamedRef;
  teacher?: BackendNamedRef;
  questions?: BackendHomeworkQuestionDto[];
  attachments?: BackendHomeworkAttachmentDto[];
  counters?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendNamedRef {
  id?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  displayName?: string;
}

export interface HomeworkAssignmentListFilters {
  academicYearId?: string;
  termId?: string;
  classroomId?: string;
  teacherUserId?: string;
  teacherSubjectAllocationId?: string;
  status?: string;
  mode?: string;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateHomeworkAssignmentRequest {
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  title: string;
  targetMode: string;
  dueAt: string;
  timetableEntryId?: string;
  scheduleDate?: string;
  description?: string;
  mode?: string;
  studentIds?: string[];
  publishAt?: string;
  estimatedMinutes?: number;
  totalMarks?: number;
  isGraded?: boolean;
}

export type UpdateHomeworkAssignmentRequest =
  Partial<CreateHomeworkAssignmentRequest>;

export interface BackendHomeworkQuestionDto {
  questionId: string;
  homeworkId: string;
  type: string;
  prompt: string;
  instructions?: string | null;
  points: number;
  sortOrder: number;
  isRequired: boolean;
  expectedAnswer?: string | null;
  options: BackendHomeworkQuestionOptionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendHomeworkQuestionOptionDto {
  optionId: string;
  questionId: string;
  text: string;
  isCorrect?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendHomeworkQuestionsResponse {
  items: BackendHomeworkQuestionDto[];
}

export interface BackendHomeworkQuestionDetailResponse {
  question: BackendHomeworkQuestionDto;
}

export interface BackendHomeworkAttachmentDto {
  attachmentId: string;
  homeworkId: string;
  fileId: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
  file: {
    filename: string;
    mimeType: string;
    sizeBytes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BackendHomeworkAttachmentsResponse {
  items: BackendHomeworkAttachmentDto[];
}

export interface BackendHomeworkAttachmentDetailResponse {
  attachment: BackendHomeworkAttachmentDto;
}

export interface BackendHomeworkTargetDto {
  targetId: string;
  studentId: string;
  enrollmentId?: string;
  student?: {
    id?: string;
    displayName?: string;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  };
  status?: string;
  assignedAt?: string | null;
  viewedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  excusedAt?: string | null;
}

export interface BackendHomeworkTargetsResponse {
  items?: BackendHomeworkTargetDto[];
  targets?: BackendHomeworkTargetDto[];
}

export interface HomeworkAssignmentUiModel {
  id: string;
  academicYearId?: string;
  termId?: string;
  teacherSubjectAllocationId?: string;
  title: string;
  description?: string;
  mode: string;
  status: "draft" | "published" | "closed" | "cancelled" | "archived";
  targetMode: string;
  dueAt?: string;
  publishAt?: string;
  estimatedMinutes?: number;
  totalMarks: number;
  isGraded: boolean;
  questionCount: number;
  attachmentCount: number;
  classroomName?: string;
  subjectName?: string;
  teacherName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeworkListResult {
  items: HomeworkAssignmentUiModel[];
  meta: BackendHomeworkListResponse["meta"];
}

export interface HomeworkTargetUiModel {
  targetId: string;
  studentId: string;
  enrollmentId?: string;
  studentName: string;
  status: string;
  assignedAt?: string | null;
  viewedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  excusedAt?: string | null;
}

export interface HomeworkAdapter {
  listAssignments(
    filters: HomeworkAssignmentListFilters,
  ): Promise<HomeworkListResult>;
  createAssignment(
    payload: CreateHomeworkAssignmentRequest,
  ): Promise<HomeworkAssignmentUiModel>;
  getAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  updateAssignment(
    homeworkId: string,
    payload: UpdateHomeworkAssignmentRequest,
  ): Promise<HomeworkAssignmentUiModel>;
  publishAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  closeAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  cancelAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  listTargets(homeworkId: string): Promise<HomeworkTargetUiModel[]>;
  resolveTargets(homeworkId: string): Promise<HomeworkTargetUiModel[]>;
  listQuestions(homeworkId: string): Promise<AssignmentQuestion[]>;
  createQuestion(
    homeworkId: string,
    question: AssignmentQuestion,
  ): Promise<AssignmentQuestion>;
  updateQuestion(
    homeworkId: string,
    questionId: string,
    question: AssignmentQuestion,
  ): Promise<AssignmentQuestion>;
  deleteQuestion(homeworkId: string, questionId: string): Promise<void>;
  reorderQuestion(
    homeworkId: string,
    questionId: string,
    order: number,
  ): Promise<AssignmentQuestion>;
  createOption(
    homeworkId: string,
    questionId: string,
    option: NonNullable<AssignmentQuestion["options"]>[number],
  ): Promise<AssignmentQuestion>;
  updateOption(
    homeworkId: string,
    questionId: string,
    option: NonNullable<AssignmentQuestion["options"]>[number],
  ): Promise<AssignmentQuestion>;
  deleteOption(
    homeworkId: string,
    questionId: string,
    optionId: string,
  ): Promise<void>;
  listAttachments(homeworkId: string): Promise<AssignmentAttachment[]>;
  createAttachment(
    homeworkId: string,
    payload: {
      fileId: string;
      title?: string;
      description?: string;
      sortOrder?: number;
    },
  ): Promise<AssignmentAttachment>;
  deleteAttachment(homeworkId: string, attachmentId: string): Promise<void>;
}
