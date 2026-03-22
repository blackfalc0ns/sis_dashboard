import type { OverviewAdapter } from "@/features/academics/overview/services/overviewAdapter";
import { overviewApiAdapter } from "@/features/academics/overview/services/overviewApiAdapter";

// Service to aggregate data from all academics modules for the overview

import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjects, fetchSubjectAllocations } from "@/features/academics/subjects/services/subjectsService";
import { fetchTeacherAllocations, fetchTeachers } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchTermEvents } from "@/features/academics/calendar/services/calendarService";
import { getLessonPlanSummary } from "@/features/academics/lesson-plans/services/lessonPlansService";

export interface OverviewMetrics {
  structure: {
    totalStages: number;
    totalGrades: number;
    totalSections: number;
    sectionsWithoutCapacity: number;
    gradesWithoutSections: number;
  };
  subjects: {
    totalSubjects: number;
    totalAllocations: number;
    expectedAllocations: number;
    completionPercentage: number;
    missingAllocations: number;
  };
  teacherAllocation: {
    totalAllocations: number;
    missingAllocations: number;
    overloadedTeachers: number;
    averageLoad: number;
  };
  calendar: {
    upcomingEvents: number;
    nextHolidayDate: string | null;
    nextExamDate: string | null;
  };
  lessonPlans: {
    totalPlanned: number;
    totalDone: number;
    completionPercentage: number;
    weeklyBreakdown?: Array<{
      week: string;
      planned: number;
      done: number;
    }>;
  };
}

const fetchOverviewMetricsImpl = async (
  yearId: string,
  termId: string
): Promise<OverviewMetrics> => {
  // Fetch all data in parallel
  const [structure, subjects, allocations, teacherAllocations, teachers, events] = await Promise.all([
    fetchStructureTree(yearId, termId),
    fetchSubjects(termId),
    fetchSubjectAllocations(termId),
    fetchTeacherAllocations(termId),
    fetchTeachers(),
    fetchTermEvents(termId),
  ]);

  // Calculate structure metrics
  const sectionsWithoutCapacity = structure.sections.filter(
    (s) => !s.capacity || s.capacity === 0
  ).length;
  const gradesWithoutSections = structure.grades.filter(
    (g) => !structure.sections.some((s) => s.gradeId === g.id)
  ).length;

  // Calculate subject allocation metrics
  const stageNamesById = new Map(
    structure.stages.map((stage) => [
      stage.id,
      [
        normalizeOverviewLabel(stage.name),
        normalizeOverviewLabel(stage.nameEn),
        normalizeOverviewLabel(stage.nameAr),
      ].filter(Boolean),
    ])
  );
  const eligibleAllocationKeys = new Set<string>();

  structure.grades.forEach((grade) => {
    const stageNames = new Set(stageNamesById.get(grade.stageId) || []);
    subjects.forEach((subject) => {
      const subjectStage = normalizeOverviewLabel(subject.stage);
      const isEligible = !subjectStage || stageNames.has(subjectStage);
      if (isEligible) {
        eligibleAllocationKeys.add(`${grade.id}:${subject.id}`);
      }
    });
  });

  const actualAllocationKeys = new Set(
    allocations
      .filter((allocation) => allocation.weeklyHours > 0)
      .map((allocation) => `${allocation.gradeId}:${allocation.subjectId}`)
  );

  const expectedAllocations = eligibleAllocationKeys.size;
  const completionPercentage =
    expectedAllocations > 0
      ? Math.min(
          100,
          Math.round((actualAllocationKeys.size / expectedAllocations) * 100)
        )
      : 0;
  const missingSubjectAllocations = Math.max(
    0,
    expectedAllocations - actualAllocationKeys.size
  );

  // Calculate teacher allocation metrics
  const missingTeacherAllocations = teacherAllocations.filter(
    (a) => !a.teacherId
  ).length;

  // Calculate teacher loads
  const teacherLoads = new Map<string, number>();
  teacherAllocations.forEach((allocation) => {
    if (allocation.teacherId) {
      const subjectAlloc = allocations.find(
        (a) => a.subjectId === allocation.subjectId
      );
      const weeklyHours = subjectAlloc?.weeklyHours || 0;
      const current = teacherLoads.get(allocation.teacherId) || 0;
      teacherLoads.set(allocation.teacherId, current + weeklyHours);
    }
  });

  const overloadedTeachers = Array.from(teacherLoads.entries()).filter(
    ([teacherId, load]) => {
      const teacher = teachers.find((t) => t.id === teacherId);
      return teacher?.maxWeeklyLoad && load > teacher.maxWeeklyLoad;
    }
  ).length;

  const averageLoad = teacherLoads.size > 0
    ? Math.round(Array.from(teacherLoads.values()).reduce((a, b) => a + b, 0) / teacherLoads.size)
    : 0;

  // Calculate calendar metrics
  const today = new Date();
  const upcomingEvents = events.filter((e) => {
    const eventDate = new Date(e.startDate);
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  }).length;

  const nextHoliday = events
    .filter((e) => e.type === "HOLIDAY" && new Date(e.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  const nextExam = events
    .filter((e) => e.type === "EXAM" && new Date(e.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  const lessonPlanTargets: Array<{
    sectionId: string;
    subjectId: string;
    classroomId?: string;
  }> = structure.sections.flatMap<{
    sectionId: string;
    subjectId: string;
    classroomId?: string;
  }>((section) => {
    const subjectTargets = allocations.filter(
      (allocation) =>
        allocation.gradeId === section.gradeId && allocation.weeklyHours > 0
    );
    const classrooms = structure.classrooms.filter(
      (classroom) => classroom.sectionId === section.id
    );

    if (classrooms.length > 0) {
      return subjectTargets.flatMap((allocation) =>
        classrooms.map((classroom) => ({
          sectionId: section.id,
          subjectId: allocation.subjectId,
          classroomId: classroom.id,
        }))
      );
    }

    return subjectTargets.map((allocation) => ({
      sectionId: section.id,
      subjectId: allocation.subjectId,
    }));
  });

  const lessonPlanSummaries = await Promise.all(
    lessonPlanTargets.map((target) =>
      getLessonPlanSummary(
        termId,
        target.sectionId,
        target.subjectId,
        target.classroomId
      )
    )
  );

  const lessonWeeks = new Map<number, { planned: number; done: number }>();
  let totalPlanned = 0;
  let totalInProgress = 0;
  let totalDone = 0;
  let totalSkipped = 0;

  lessonPlanSummaries.forEach((summary) => {
    totalPlanned += summary.totalPlanned;
    totalInProgress += summary.totalInProgress;
    totalDone += summary.totalDone;
    totalSkipped += summary.totalSkipped;

    summary.weeklyBreakdown.forEach((week) => {
      const current = lessonWeeks.get(week.weekIndex) || { planned: 0, done: 0 };
      lessonWeeks.set(week.weekIndex, {
        planned: current.planned + week.planned + week.inProgress,
        done: current.done + week.done,
      });
    });
  });

  const totalLessonItems =
    totalPlanned + totalInProgress + totalDone + totalSkipped;
  const lessonPlansMetrics = {
    totalPlanned,
    totalDone,
    completionPercentage:
      totalLessonItems > 0
        ? Math.round((totalDone / totalLessonItems) * 100)
        : 0,
    weeklyBreakdown: Array.from(lessonWeeks.entries())
      .sort(([left], [right]) => left - right)
      .map(([weekIndex, values]) => ({
        week: `W${weekIndex}`,
        planned: values.planned,
        done: values.done,
      })),
  };

  return {
    structure: {
      totalStages: structure.stages.length,
      totalGrades: structure.grades.length,
      totalSections: structure.sections.length,
      sectionsWithoutCapacity,
      gradesWithoutSections,
    },
    subjects: {
      totalSubjects: subjects.length,
      totalAllocations: allocations.length,
      expectedAllocations,
      completionPercentage,
      missingAllocations: missingSubjectAllocations,
    },
    teacherAllocation: {
      totalAllocations: teacherAllocations.length,
      missingAllocations: missingTeacherAllocations,
      overloadedTeachers,
      averageLoad,
    },
    calendar: {
      upcomingEvents,
      nextHolidayDate: nextHoliday?.startDate || null,
      nextExamDate: nextExam?.startDate || null,
    },
    lessonPlans: lessonPlansMetrics,
  };
};

const mockOverviewAdapter: OverviewAdapter = {
  fetchOverviewMetrics: fetchOverviewMetricsImpl,
};

let overviewAdapter: OverviewAdapter =
  process.env.NEXT_PUBLIC_USE_OVERVIEW_API === "true"
    ? overviewApiAdapter
    : mockOverviewAdapter;

export const getOverviewAdapter = (): OverviewAdapter => overviewAdapter;

export const setOverviewAdapter = (adapter: OverviewAdapter) => {
  overviewAdapter = adapter;
};

export const resetOverviewAdapter = () => {
  overviewAdapter =
    process.env.NEXT_PUBLIC_USE_OVERVIEW_API === "true"
      ? overviewApiAdapter
      : mockOverviewAdapter;
};

export const activateOverviewAdapter = () => {
  overviewAdapter = overviewApiAdapter;
};

export const fetchOverviewMetrics = (
  yearId: string,
  termId: string
): Promise<OverviewMetrics> => getOverviewAdapter().fetchOverviewMetrics(yearId, termId);

export interface ChecklistItem {
  id: string;
  status: "done" | "warning" | "error";
  titleKey: string;
  descriptionKey: string;
  link: string;
}

export function generateChecklist(metrics: OverviewMetrics, lang: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // 1. Structure ready
  const structureStatus =
    metrics.structure.gradesWithoutSections === 0 &&
    metrics.structure.sectionsWithoutCapacity === 0
      ? "done"
      : metrics.structure.gradesWithoutSections > 0
      ? "error"
      : "warning";

  items.push({
    id: "structure",
    status: structureStatus,
    titleKey: 'academics.overview.checklist.structure.title',
    descriptionKey: 'academics.overview.checklist.structure.description',
    link: `/${lang}/academics/structure`,
  });

  // 2. Subjects allocation ready
  const subjectsStatus =
    metrics.subjects.completionPercentage === 100
      ? "done"
      : metrics.subjects.completionPercentage >= 80
      ? "warning"
      : "error";

  items.push({
    id: "subjects",
    status: subjectsStatus,
    titleKey: 'academics.overview.checklist.subjects.title',
    descriptionKey: 'academics.overview.checklist.subjects.description',
    link: `/${lang}/academics/subjects`,
  });

  // 3. Teacher allocation ready
  const teacherStatus =
    metrics.teacherAllocation.missingAllocations === 0 &&
    metrics.teacherAllocation.overloadedTeachers === 0
      ? "done"
      : metrics.teacherAllocation.overloadedTeachers > 0
      ? "error"
      : "warning";

  items.push({
    id: "teachers",
    status: teacherStatus,
    titleKey: 'academics.overview.checklist.teachers.title',
    descriptionKey: 'academics.overview.checklist.teachers.description',
    link: `/${lang}/academics/teacher-allocation`,
  });

  // 4. Calendar ready
  const calendarStatus =
    metrics.calendar.nextHolidayDate || metrics.calendar.nextExamDate
      ? "done"
      : "warning";

  items.push({
    id: "calendar",
    status: calendarStatus,
    titleKey: 'academics.overview.checklist.calendar.title',
    descriptionKey: 'academics.overview.checklist.calendar.description',
    link: `/${lang}/academics/calendar`,
  });

  // 5. Lesson plans started
  const lessonPlansStatus =
    metrics.lessonPlans.totalPlanned >= 10
      ? "done"
      : metrics.lessonPlans.totalPlanned > 0
      ? "warning"
      : "error";

  items.push({
    id: "lessonPlans",
    status: lessonPlansStatus,
    titleKey: 'academics.overview.checklist.lessonPlans.title',
    descriptionKey: 'academics.overview.checklist.lessonPlans.description',
    link: `/${lang}/academics/lesson-plans`,
  });

  return items;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "error";
  titleKey: string;
  descriptionKey: string;
  link: string;
  count?: number;
}

const normalizeOverviewLabel = (value?: string | null) =>
  (value || "").trim().toLowerCase();

export function generateAlerts(metrics: OverviewMetrics, lang: string): Alert[] {
  const alerts: Alert[] = [];

  // Sections missing capacity
  if (metrics.structure.sectionsWithoutCapacity > 0) {
    alerts.push({
      id: "sections-capacity",
      severity: "warning",
      titleKey: 'academics.overview.alerts.sectionsCapacity.title',
      descriptionKey: 'academics.overview.alerts.sectionsCapacity.description',
      link: `/${lang}/academics/structure`,
      count: metrics.structure.sectionsWithoutCapacity,
    });
  }

  // Grades without sections
  if (metrics.structure.gradesWithoutSections > 0) {
    alerts.push({
      id: "grades-sections",
      severity: "error",
      titleKey: 'academics.overview.alerts.gradesSections.title',
      descriptionKey: 'academics.overview.alerts.gradesSections.description',
      link: `/${lang}/academics/structure`,
      count: metrics.structure.gradesWithoutSections,
    });
  }

  // Missing teacher allocations
  if (metrics.teacherAllocation.missingAllocations > 0) {
    alerts.push({
      id: "teacher-missing",
      severity: "error",
      titleKey: 'academics.overview.alerts.teacherMissing.title',
      descriptionKey: 'academics.overview.alerts.teacherMissing.description',
      link: `/${lang}/academics/teacher-allocation`,
      count: metrics.teacherAllocation.missingAllocations,
    });
  }

  // Overloaded teachers
  if (metrics.teacherAllocation.overloadedTeachers > 0) {
    alerts.push({
      id: "teacher-overloaded",
      severity: "warning",
      titleKey: 'academics.overview.alerts.teacherOverloaded.title',
      descriptionKey: 'academics.overview.alerts.teacherOverloaded.description',
      link: `/${lang}/academics/teacher-allocation`,
      count: metrics.teacherAllocation.overloadedTeachers,
    });
  }

  // Upcoming exam soon
  if (metrics.calendar.nextExamDate) {
    const daysUntil = Math.ceil(
      (new Date(metrics.calendar.nextExamDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysUntil <= 7) {
      alerts.push({
        id: "exam-soon",
        severity: "info",
        titleKey: 'academics.overview.alerts.examSoon.title',
        descriptionKey: 'academics.overview.alerts.examSoon.description',
        link: `/${lang}/academics/calendar`,
      });
    }
  }

  // Lesson plans behind schedule (if completion < 70%)
  if (metrics.lessonPlans.completionPercentage < 70) {
    alerts.push({
      id: "lessons-behind",
      severity: "warning",
      titleKey: 'academics.overview.alerts.lessonsBehind.title',
      descriptionKey: 'academics.overview.alerts.lessonsBehind.description',
      link: `/${lang}/academics/lesson-plans`,
    });
  }

  // Sort by severity
  const severityOrder = { error: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 6);
}
