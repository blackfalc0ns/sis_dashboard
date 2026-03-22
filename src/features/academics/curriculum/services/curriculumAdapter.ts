import type {
  Assignment,
  AssignmentAttachment,
  AssignmentQuestion,
  CarryOverCurriculumOptions,
  Curriculum,
  Lesson,
  LessonAttachment,
  LessonVideo,
  Unit,
} from "@/features/academics/curriculum/services/curriculumService";

export interface CurriculumAdapter {
  fetchCurriculum(
    termId: string,
    gradeId: string,
    subjectId: string
  ): Promise<Curriculum | null>;
  createCurriculum(
    termId: string,
    gradeId: string,
    subjectId: string,
    name?: string
  ): Promise<Curriculum>;
  updateCurriculum(
    curriculumId: string,
    payload: Partial<Omit<Curriculum, "id" | "termId" | "gradeId" | "subjectId">>
  ): Promise<Curriculum>;
  fetchUnits(curriculumId: string): Promise<Unit[]>;
  createUnit(
    curriculumId: string,
    payload: Omit<Unit, "id" | "curriculumId" | "order">
  ): Promise<Unit>;
  updateUnit(
    unitId: string,
    payload: Partial<Omit<Unit, "id" | "curriculumId">>
  ): Promise<Unit>;
  deleteUnit(unitId: string): Promise<void>;
  reorderUnits(curriculumId: string, orderedUnitIds: string[]): Promise<void>;
  fetchLessons(unitId: string): Promise<Lesson[]>;
  fetchAllLessons(curriculumId: string): Promise<Lesson[]>;
  createLesson(
    unitId: string,
    payload: Omit<Lesson, "id" | "unitId" | "order" | "status" | "doneAt">
  ): Promise<Lesson>;
  updateLesson(
    lessonId: string,
    payload: Partial<Omit<Lesson, "id" | "unitId">>
  ): Promise<Lesson>;
  deleteLesson(lessonId: string): Promise<void>;
  reorderLessons(unitId: string, orderedLessonIds: string[]): Promise<void>;
  updateLessonSchedule(lessonId: string, plannedWeek: number): Promise<Lesson>;
  markLessonDone(lessonId: string): Promise<Lesson>;
  undoLessonDone(lessonId: string): Promise<Lesson>;
  carryOverCurriculum(params: CarryOverCurriculumOptions): Promise<void>;
  fetchLessonAttachments(lessonId: string): Promise<LessonAttachment[]>;
  uploadLessonAttachmentFile(
    lessonId: string,
    file: File,
    meta?: { title?: string; category?: string }
  ): Promise<LessonAttachment>;
  createLessonAttachmentLink(
    lessonId: string,
    payload: { title: string; url: string; category?: string }
  ): Promise<LessonAttachment>;
  deleteAttachment(attachmentId: string): Promise<void>;
  fetchLessonVideo(lessonId: string): Promise<LessonVideo | null>;
  upsertLessonVideoLink(
    lessonId: string,
    payload: { titleAr: string; titleEn: string; url: string }
  ): Promise<LessonVideo>;
  uploadLessonVideoFile(
    lessonId: string,
    file: File,
    payload: { titleAr: string; titleEn: string }
  ): Promise<LessonVideo>;
  deleteLessonVideo(lessonId: string): Promise<void>;
  fetchLessonAssignments(lessonId: string): Promise<Assignment[]>;
  fetchAssignmentById(
    lessonId: string,
    assignmentId: string
  ): Promise<Assignment | null>;
  createAssignment(
    lessonId: string,
    payload: Omit<Assignment, "id" | "lessonId" | "createdAt">
  ): Promise<Assignment>;
  updateAssignment(
    assignmentId: string,
    payload: Partial<Omit<Assignment, "id" | "lessonId" | "createdAt">>
  ): Promise<Assignment>;
  deleteAssignment(assignmentId: string): Promise<void>;
  fetchAssignmentAttachments(assignmentId: string): Promise<AssignmentAttachment[]>;
  uploadAssignmentAttachmentFile(
    assignmentId: string,
    file: File,
    meta?: { title?: string }
  ): Promise<AssignmentAttachment>;
  createAssignmentAttachmentLink(
    assignmentId: string,
    payload: { title: string; url: string }
  ): Promise<AssignmentAttachment>;
  deleteAssignmentAttachment(attachmentId: string): Promise<void>;
  fetchAssignmentQuestions(assignmentId: string): Promise<AssignmentQuestion[]>;
  createAssignmentQuestion(
    assignmentId: string,
    payload: Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt" | "order">
  ): Promise<AssignmentQuestion>;
  updateAssignmentQuestion(
    questionId: string,
    payload: Partial<Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt">>
  ): Promise<AssignmentQuestion>;
  deleteAssignmentQuestion(questionId: string): Promise<void>;
  reorderAssignmentQuestions(
    assignmentId: string,
    orderedQuestionIds: string[]
  ): Promise<void>;
  bulkUpdateQuestionPoints(
    assignmentId: string,
    updates: Array<{ questionId: string; points: number }>
  ): Promise<void>;
}
