// Mock service for Lesson Plans (TERM + SECTION + SUBJECT SCOPED)
// Replace with real API calls when backend is ready

export interface LessonPlanItem {
  id: string;
  planId: string;
  lessonId: string; // from curriculum lessons
  unitId?: string; // optional, if lesson belongs to unit
  status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  order: number; // ordering within week
  notesAr?: string;
  notesEn?: string;
  resources?: {
    type: "LINK" | "FILE";
    url?: string;
    fileId?: string;
    titleAr?: string;
    titleEn?: string;
  }[];
  assignmentIds?: string[]; // optional references to assignments
}

export interface LessonPlan {
  id: string;
  termId: string;
  sectionId: string;
  subjectId: string;
  teacherId?: string; // default from teacher allocation
  weekIndex: number; // 1..N
  items: LessonPlanItem[];
  updatedAt: string;
}

export interface WeekInfo {
  weekIndex: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  holidayCount: number;
  hasHolidays: boolean;
}

export interface LessonPlanSummary {
  totalPlanned: number;
  totalInProgress: number;
  totalDone: number;
  totalSkipped: number;
  completionPercentage: number;
  weeklyBreakdown: {
    weekIndex: number;
    planned: number;
    inProgress: number;
    done: number;
    skipped: number;
  }[];
}

// In-memory mock data keyed by termId-sectionId-subjectId
const plansByKey: Record<string, LessonPlan[]> = {};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 3000;
const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

const getPlanKey = (termId: string, sectionId: string, subjectId: string) =>
  `${termId}-${sectionId}-${subjectId}`;

/**
 * Compute teaching weeks for a term
 * Integrates with calendar holidays
 */
export const computeTermWeeks = async (
  termStartDate: string,
  termEndDate: string,
  holidays: Array<{ startDate: string; endDate: string }>
): Promise<WeekInfo[]> => {
  await delay(100);

  const start = new Date(termStartDate);
  const end = new Date(termEndDate);
  const weeks: WeekInfo[] = [];

  let weekIndex = 1;
  const currentStart = new Date(start);

  while (currentStart <= end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6); // Week is 7 days

    // Don't go past term end
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    // Count holidays in this week
    let holidayCount = 0;
    for (const holiday of holidays) {
      const holidayStart = new Date(holiday.startDate);
      const holidayEnd = new Date(holiday.endDate);

      // Check if holiday overlaps with this week
      if (holidayStart <= currentEnd && holidayEnd >= currentStart) {
        holidayCount++;
      }
    }

    weeks.push({
      weekIndex,
      startDate: currentStart.toISOString().split("T")[0],
      endDate: currentEnd.toISOString().split("T")[0],
      holidayCount,
      hasHolidays: holidayCount > 0,
    });

    // Move to next week
    currentStart.setDate(currentStart.getDate() + 7);
    weekIndex++;
  }

  return weeks;
};

/**
 * Fetch all lesson plans for a term/section/subject
 * Returns items grouped by week
 */
export const fetchLessonPlans = async (
  termId: string,
  sectionId: string,
  subjectId: string
): Promise<LessonPlan[]> => {
  await delay(300);
  const key = getPlanKey(termId, sectionId, subjectId);
  return plansByKey[key] || [];
};

/**
 * Create or update a lesson plan item
 */
export const upsertLessonPlanItem = async (payload: {
  termId: string;
  sectionId: string;
  subjectId: string;
  teacherId?: string;
  weekIndex: number;
  lessonId: string;
  unitId?: string;
  status?: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  order?: number;
  notesAr?: string;
  notesEn?: string;
}): Promise<LessonPlanItem> => {
  await delay(300);

  const key = getPlanKey(payload.termId, payload.sectionId, payload.subjectId);
  const plans = plansByKey[key] || [];

  // Find or create plan for this week
  let plan = plans.find((p) => p.weekIndex === payload.weekIndex);

  if (!plan) {
    plan = {
      id: generateId("plan"),
      termId: payload.termId,
      sectionId: payload.sectionId,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId,
      weekIndex: payload.weekIndex,
      items: [],
      updatedAt: new Date().toISOString(),
    };
    plans.push(plan);
  }

  // Check if item already exists
  const existingItem = plan.items.find((item) => item.lessonId === payload.lessonId);

  if (existingItem) {
    // Update existing item
    existingItem.status = payload.status || existingItem.status;
    existingItem.notesAr = payload.notesAr ?? existingItem.notesAr;
    existingItem.notesEn = payload.notesEn ?? existingItem.notesEn;
    if (payload.order !== undefined) {
      existingItem.order = payload.order;
    }
    plan.updatedAt = new Date().toISOString();
    plansByKey[key] = plans;
    return existingItem;
  }

  // Create new item
  const maxOrder = plan.items.reduce((max, item) => Math.max(max, item.order), 0);
  const newItem: LessonPlanItem = {
    id: generateId("item"),
    planId: plan.id,
    lessonId: payload.lessonId,
    unitId: payload.unitId,
    status: payload.status || "PLANNED",
    order: payload.order !== undefined ? payload.order : maxOrder + 1,
    notesAr: payload.notesAr,
    notesEn: payload.notesEn,
  };

  plan.items.push(newItem);
  plan.updatedAt = new Date().toISOString();
  plansByKey[key] = plans;

  return newItem;
};

/**
 * Delete a lesson plan item
 */
export const deleteLessonPlanItem = async (
  termId: string,
  sectionId: string,
  subjectId: string,
  itemId: string
): Promise<void> => {
  await delay(300);

  const key = getPlanKey(termId, sectionId, subjectId);
  const plans = plansByKey[key] || [];

  for (const plan of plans) {
    const index = plan.items.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      plan.items.splice(index, 1);
      plan.updatedAt = new Date().toISOString();
      plansByKey[key] = plans;
      return;
    }
  }
};

/**
 * Reorder items within a week
 */
export const reorderLessonPlanItems = async (
  termId: string,
  sectionId: string,
  subjectId: string,
  weekIndex: number,
  orderedItemIds: string[]
): Promise<void> => {
  await delay(300);

  const key = getPlanKey(termId, sectionId, subjectId);
  const plans = plansByKey[key] || [];
  const plan = plans.find((p) => p.weekIndex === weekIndex);

  if (!plan) return;

  orderedItemIds.forEach((itemId, index) => {
    const item = plan.items.find((i) => i.id === itemId);
    if (item) {
      item.order = index + 1;
    }
  });

  plan.updatedAt = new Date().toISOString();
  plansByKey[key] = plans;
};

/**
 * Move an item to a different week
 */
export const moveLessonPlanItem = async (
  termId: string,
  sectionId: string,
  subjectId: string,
  itemId: string,
  toWeekIndex: number,
  toOrder?: number
): Promise<void> => {
  await delay(300);

  const key = getPlanKey(termId, sectionId, subjectId);
  const plans = plansByKey[key] || [];

  // Find the item in any week
  let sourceItem: LessonPlanItem | null = null;
  let sourcePlan: LessonPlan | null = null;

  for (const plan of plans) {
    const item = plan.items.find((i) => i.id === itemId);
    if (item) {
      sourceItem = item;
      sourcePlan = plan;
      break;
    }
  }

  if (!sourceItem || !sourcePlan) return;

  // Remove from source week
  sourcePlan.items = sourcePlan.items.filter((i) => i.id !== itemId);
  sourcePlan.updatedAt = new Date().toISOString();

  // Find or create target week plan
  let targetPlan = plans.find((p) => p.weekIndex === toWeekIndex);

  if (!targetPlan) {
    targetPlan = {
      id: generateId("plan"),
      termId,
      sectionId,
      subjectId,
      teacherId: sourcePlan.teacherId,
      weekIndex: toWeekIndex,
      items: [],
      updatedAt: new Date().toISOString(),
    };
    plans.push(targetPlan);
  }

  // Add to target week
  const maxOrder = targetPlan.items.reduce((max, item) => Math.max(max, item.order), 0);
  sourceItem.order = toOrder !== undefined ? toOrder : maxOrder + 1;
  sourceItem.planId = targetPlan.id;
  targetPlan.items.push(sourceItem);
  targetPlan.updatedAt = new Date().toISOString();

  plansByKey[key] = plans;
};

/**
 * Update item status
 */
export const updateLessonPlanItemStatus = async (
  termId: string,
  sectionId: string,
  subjectId: string,
  itemId: string,
  status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED"
): Promise<void> => {
  await delay(300);

  const key = getPlanKey(termId, sectionId, subjectId);
  const plans = plansByKey[key] || [];

  for (const plan of plans) {
    const item = plan.items.find((i) => i.id === itemId);
    if (item) {
      item.status = status;
      plan.updatedAt = new Date().toISOString();
      plansByKey[key] = plans;
      return;
    }
  }
};

/**
 * Update item notes
 */
export const updateLessonPlanItemNotes = async (
  termId: string,
  sectionId: string,
  subjectId: string,
  itemId: string,
  notesAr?: string,
  notesEn?: string
): Promise<void> => {
  await delay(300);

  const key = getPlanKey(termId, sectionId, subjectId);
  const plans = plansByKey[key] || [];

  for (const plan of plans) {
    const item = plan.items.find((i) => i.id === itemId);
    if (item) {
      item.notesAr = notesAr;
      item.notesEn = notesEn;
      plan.updatedAt = new Date().toISOString();
      plansByKey[key] = plans;
      return;
    }
  }
};

/**
 * Get summary analytics
 */
export const getLessonPlanSummary = async (
  termId: string,
  sectionId: string,
  subjectId: string
): Promise<LessonPlanSummary> => {
  await delay(200);

  const key = getPlanKey(termId, sectionId, subjectId);
  const plans = plansByKey[key] || [];

  let totalPlanned = 0;
  let totalInProgress = 0;
  let totalDone = 0;
  let totalSkipped = 0;

  const weeklyBreakdown: LessonPlanSummary["weeklyBreakdown"] = [];

  for (const plan of plans) {
    let weekPlanned = 0;
    let weekInProgress = 0;
    let weekDone = 0;
    let weekSkipped = 0;

    for (const item of plan.items) {
      switch (item.status) {
        case "PLANNED":
          totalPlanned++;
          weekPlanned++;
          break;
        case "IN_PROGRESS":
          totalInProgress++;
          weekInProgress++;
          break;
        case "DONE":
          totalDone++;
          weekDone++;
          break;
        case "SKIPPED":
          totalSkipped++;
          weekSkipped++;
          break;
      }
    }

    weeklyBreakdown.push({
      weekIndex: plan.weekIndex,
      planned: weekPlanned,
      inProgress: weekInProgress,
      done: weekDone,
      skipped: weekSkipped,
    });
  }

  const total = totalPlanned + totalInProgress + totalDone + totalSkipped;
  const completionPercentage = total > 0 ? Math.round((totalDone / total) * 100) : 0;

  return {
    totalPlanned,
    totalInProgress,
    totalDone,
    totalSkipped,
    completionPercentage,
    weeklyBreakdown,
  };
};

/**
 * Bulk auto-plan lessons (optional feature)
 * Distributes lessons evenly across weeks
 */
export const bulkAutoPlan = async (
  termId: string,
  sectionId: string,
  subjectId: string,
  teacherId: string | undefined,
  lessonIds: string[],
  weekCount: number
): Promise<void> => {
  await delay(500);

  const key = getPlanKey(termId, sectionId, subjectId);
  const plans: LessonPlan[] = [];

  const lessonsPerWeek = Math.ceil(lessonIds.length / weekCount);

  for (let weekIndex = 1; weekIndex <= weekCount; weekIndex++) {
    const startIdx = (weekIndex - 1) * lessonsPerWeek;
    const endIdx = Math.min(startIdx + lessonsPerWeek, lessonIds.length);
    const weekLessonIds = lessonIds.slice(startIdx, endIdx);

    if (weekLessonIds.length === 0) continue;

    const plan: LessonPlan = {
      id: generateId("plan"),
      termId,
      sectionId,
      subjectId,
      teacherId,
      weekIndex,
      items: weekLessonIds.map((lessonId, idx) => ({
        id: generateId("item"),
        planId: "", // Will be set after plan creation
        lessonId,
        status: "PLANNED" as const,
        order: idx + 1,
      })),
      updatedAt: new Date().toISOString(),
    };

    // Set planId for items
    plan.items.forEach((item) => {
      item.planId = plan.id;
    });

    plans.push(plan);
  }

  plansByKey[key] = plans;
};
