export type LessonPlanStatusDto = "draft" | "active" | "archived";
export type LessonPlanItemStatusDto =
  | "planned"
  | "in_progress"
  | "done"
  | "skipped"
  | "rescheduled"
  | "cancelled";
export type LessonPlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "UNKNOWN";
export type LessonPlanItemStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "DONE"
  | "SKIPPED"
  | "CANCELLED"
  | "UNKNOWN";
export type LessonPlanStatusFilter = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface NamedSummaryDto {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
}
export interface LessonPlanItemResponseDto {
  id: string;
  itemId: string;
  lessonPlanId: string;
  curriculumId: string;
  unitId: string;
  lessonId: string;
  unitTitle: string;
  lessonTitle: string;
  timetableEntryId: string | null;
  plannedDate: string | null;
  dayOfWeek: number | null;
  periodId: string | null;
  periodLabel: string | null;
  title: string;
  notes: string | null;
  status: LessonPlanItemStatusDto | string;
  sortOrder: number;
  startedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface LessonPlanResponseDto {
  id: string;
  lessonPlanId: string;
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  teacherUserId: string;
  classroomId: string;
  subjectId: string;
  curriculumId: string;
  title: string;
  description: string | null;
  status: LessonPlanStatusDto | string;
  weekStartDate: string;
  weekEndDate: string;
  activatedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: NamedSummaryDto;
  term: NamedSummaryDto;
  teacher: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  classroom: NamedSummaryDto;
  subject: NamedSummaryDto & { code: string | null; color: string | null };
  curriculum: { curriculumId: string; title: string; status: string };
  itemCount: number;
}
export interface LessonPlanDetailResponseDto extends LessonPlanResponseDto {
  items: LessonPlanItemResponseDto[];
}
export interface LessonPlansListResponseDto {
  items: LessonPlanResponseDto[];
}
export interface LessonPlanWeekBucketDto {
  weekIndex: number;
  startsAt: string;
  endsAt: string;
  instructionalDays: string[];
  holidayDays: Array<{ date: string; eventId: string; title: string }>;
  plannedItemsCount: number;
}
export interface LessonPlanWeeksResponseDto {
  termId: string;
  academicYearId: string;
  weeks: LessonPlanWeekBucketDto[];
}
export interface LessonPlanSummaryTotals {
  lessonPlansCount: number;
  itemsCount: number;
  plannedItemsCount: number;
  completedItemsCount: number;
  unplannedLessonsCount: number;
  coveragePercent: number;
}
export interface LessonPlanSummaryResponseDto {
  termId: string;
  academicYearId: string;
  summary: LessonPlanSummaryTotals;
  byTeacherAllocation: unknown[];
}
export interface LessonPlanValidationResponseDto {
  termId: string;
  academicYearId: string;
  summary: Record<string, number>;
  issues: Array<Record<string, unknown>>;
}
export interface AutoPlanLessonPlanResponseDto {
  termId: string;
  academicYearId: string;
  teacherSubjectAllocationId: string;
  dryRun: boolean;
  summary: Record<string, number>;
  items: Array<Record<string, unknown>>;
}

export interface LessonPlanListFilters {
  academicYearId?: string;
  termId?: string;
  teacherSubjectAllocationId?: string;
  teacherUserId?: string;
  classroomId?: string;
  subjectId?: string;
  curriculumId?: string;
  status?: LessonPlanStatusFilter;
  weekStartDate?: string;
  search?: string;
}
export interface CreateLessonPlanRequest {
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  teacherUserId?: string;
  classroomId?: string;
  subjectId?: string;
  curriculumId: string;
  title: string;
  description?: string | null;
  weekStartDate: string;
  weekEndDate: string;
}
export interface UpdateLessonPlanRequest {
  title?: string;
  description?: string | null;
  weekStartDate?: string;
  weekEndDate?: string;
}
export interface CreateLessonPlanItemRequest {
  unitId: string;
  lessonId: string;
  timetableEntryId?: string | null;
  plannedDate?: string | null;
  dayOfWeek?: number | null;
  periodId?: string | null;
  periodLabel?: string | null;
  title?: string | null;
  notes?: string | null;
  sortOrder?: number;
}
export type UpdateLessonPlanItemRequest = Omit<
  Partial<CreateLessonPlanItemRequest>,
  "sortOrder"
>;
export interface ReorderLessonPlanItemRequest {
  sortOrder: number;
}
export interface MoveLessonPlanItemRequest {
  plannedDate?: string;
  weekIndex?: number;
  timetableEntryId?: string | null;
  sortOrder?: number;
}
export interface LessonPlanStatusNoteRequest {
  note?: string | null;
}
export interface LessonPlanWeeksQuery {
  termId: string;
  teacherSubjectAllocationId?: string;
  from?: string;
  to?: string;
}
export interface LessonPlanSummaryQuery {
  termId: string;
  teacherSubjectAllocationId?: string;
  gradeId?: string;
  subjectId?: string;
  classroomId?: string;
}
export type LessonPlanValidationQuery = LessonPlanSummaryQuery;
export interface AutoPlanLessonPlanRequest {
  termId: string;
  teacherSubjectAllocationId: string;
  from?: string;
  to?: string;
  overwrite?: boolean;
  dryRun?: boolean;
}
export interface DeleteResponse {
  ok: true;
}

export interface LessonPlanItem {
  id: string;
  planId: string;
  lessonId: string;
  unitId: string;
  status: LessonPlanItemStatus;
  rawStatus: string;
  order: number;
  notes?: string;
  notesAr?: string;
  notesEn?: string;
  plannedDate?: string;
  title?: string;
}
export interface LessonPlan {
  id: string;
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  teacherId: string;
  classroomId: string;
  subjectId: string;
  curriculumId: string;
  title: string;
  description: string | null;
  status: LessonPlanStatus;
  rawStatus: string;
  weekIndex: number;
  weekStartDate: string;
  weekEndDate: string;
  items: LessonPlanItem[];
  updatedAt: string;
}
export interface WeekInfo {
  weekIndex: number;
  startDate: string;
  endDate: string;
  lostTeachingDays: number;
  hasHolidays: boolean;
  plannedItemsCount: number;
}
export type LessonPlanSummary = LessonPlanSummaryTotals;

export interface CreateLessonPlanItemCommand {
  lessonPlanId: string;
  payload: CreateLessonPlanItemRequest;
}
export interface UpdateLessonPlanItemCommand {
  lessonPlanId: string;
  itemId: string;
  payload: UpdateLessonPlanItemRequest;
}
export interface ReorderLessonPlanItemCommand {
  lessonPlanId: string;
  itemId: string;
  payload: ReorderLessonPlanItemRequest;
}
export interface LessonPlanItemActionCommand {
  lessonPlanId: string;
  itemId: string;
  payload?: LessonPlanStatusNoteRequest;
}
export interface DeleteLessonPlanItemCommand {
  lessonPlanId: string;
  itemId: string;
}
