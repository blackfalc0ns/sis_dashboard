import type {
  LessonPlan,
  LessonPlanDetailResponseDto,
  LessonPlanItem,
  LessonPlanItemResponseDto,
  LessonPlanResponseDto,
  LessonPlanSummary,
  LessonPlanSummaryResponseDto,
  LessonPlanWeekBucketDto,
  LessonPlanWeeksResponseDto,
  WeekInfo,
} from "./lessonPlansBackendTypes";

const planStatuses = {
  draft: "DRAFT",
  active: "ACTIVE",
  archived: "ARCHIVED",
} as const;
const itemStatuses = {
  planned: "PLANNED",
  in_progress: "IN_PROGRESS",
  done: "DONE",
  skipped: "SKIPPED",
  cancelled: "CANCELLED",
} as const;
const weekContaining = (
  date: string | null,
  weeks: LessonPlanWeekBucketDto[],
) =>
  date
    ? weeks.find((week) => date >= week.startsAt && date <= week.endsAt)
        ?.weekIndex
    : undefined;

export function mapLessonPlanItemDto(
  dto: LessonPlanItemResponseDto,
): LessonPlanItem {
  return {
    id: dto.itemId || dto.id,
    planId: dto.lessonPlanId,
    lessonId: dto.lessonId,
    unitId: dto.unitId,
    status: itemStatuses[dto.status as keyof typeof itemStatuses] ?? "UNKNOWN",
    rawStatus: dto.status,
    order: dto.sortOrder,
    notes: dto.notes ?? undefined,
    notesAr: dto.notes ?? undefined,
    notesEn: dto.notes ?? undefined,
    plannedDate: dto.plannedDate ?? undefined,
    title: dto.title,
  };
}

export function mapLessonPlanDto(
  dto: LessonPlanResponseDto,
  weeks: LessonPlanWeekBucketDto[] = [],
): LessonPlan {
  return {
    id: dto.lessonPlanId || dto.id,
    academicYearId: dto.academicYearId,
    termId: dto.termId,
    teacherSubjectAllocationId: dto.teacherSubjectAllocationId,
    teacherId: dto.teacherUserId,
    classroomId: dto.classroomId,
    subjectId: dto.subjectId,
    curriculumId: dto.curriculumId,
    title: dto.title,
    description: dto.description,
    status: planStatuses[dto.status as keyof typeof planStatuses] ?? "UNKNOWN",
    rawStatus: dto.status,
    weekIndex: weekContaining(dto.weekStartDate, weeks) ?? 0,
    weekStartDate: dto.weekStartDate,
    weekEndDate: dto.weekEndDate,
    items: [],
    updatedAt: dto.updatedAt,
  };
}

export function mapLessonPlanDetailDto(
  dto: LessonPlanDetailResponseDto,
  weeks: LessonPlanWeekBucketDto[] = [],
): LessonPlan {
  const plan = mapLessonPlanDto(dto, weeks);
  return { ...plan, items: dto.items.map(mapLessonPlanItemDto) };
}

export const mapLessonPlanWeeksDto = (
  dto: LessonPlanWeeksResponseDto,
): WeekInfo[] =>
  dto.weeks.map((week) => ({
    weekIndex: week.weekIndex,
    startDate: week.startsAt,
    endDate: week.endsAt,
    lostTeachingDays: week.holidayDays.length,
    hasHolidays: week.holidayDays.length > 0,
    plannedItemsCount: week.plannedItemsCount,
  }));
export const mapLessonPlanSummaryDto = (
  dto: LessonPlanSummaryResponseDto,
): LessonPlanSummary => dto.summary;
