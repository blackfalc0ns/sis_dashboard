import type {
  LessonPlan,
  LessonPlanItem,
  LessonPlanSummary,
} from "@/features/academics/lesson-plans/services/lessonPlansService";

export interface LessonPlanItemUpsertPayload {
  termId: string;
  sectionId: string;
  subjectId: string;
  classroomId?: string;
  teacherId?: string;
  weekIndex: number;
  lessonId: string;
  unitId?: string;
  status?: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  order?: number;
  notesAr?: string;
  notesEn?: string;
}

export interface LessonPlansAdapter {
  fetchLessonPlans(
    termId: string,
    sectionId: string,
    subjectId: string,
    classroomId?: string
  ): Promise<LessonPlan[]>;
  upsertLessonPlanItem(payload: LessonPlanItemUpsertPayload): Promise<LessonPlanItem>;
  deleteLessonPlanItem(
    termId: string,
    sectionId: string,
    subjectId: string,
    itemId: string,
    classroomId?: string
  ): Promise<void>;
  reorderLessonPlanItems(
    termId: string,
    sectionId: string,
    subjectId: string,
    weekIndex: number,
    orderedItemIds: string[],
    classroomId?: string
  ): Promise<void>;
  moveLessonPlanItem(
    termId: string,
    sectionId: string,
    subjectId: string,
    itemId: string,
    toWeekIndex: number,
    toOrder?: number,
    classroomId?: string
  ): Promise<void>;
  updateLessonPlanItemStatus(
    termId: string,
    sectionId: string,
    subjectId: string,
    itemId: string,
    status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED",
    classroomId?: string
  ): Promise<void>;
  updateLessonPlanItemNotes(
    termId: string,
    sectionId: string,
    subjectId: string,
    itemId: string,
    notesAr?: string,
    notesEn?: string,
    classroomId?: string
  ): Promise<void>;
  getLessonPlanSummary(
    termId: string,
    sectionId: string,
    subjectId: string,
    classroomId?: string
  ): Promise<LessonPlanSummary>;
  bulkAutoPlan(
    termId: string,
    sectionId: string,
    subjectId: string,
    classroomId: string | undefined,
    teacherId: string | undefined,
    lessonIds: string[],
    weekCount: number
  ): Promise<void>;
}
