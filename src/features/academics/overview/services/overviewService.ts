import type { AcademicsOverviewResponse } from "./overviewApiAdapter";

export interface ChecklistItem {
  id: string;
  status: "done" | "warning" | "error";
  titleKey: string;
  descriptionKey: string;
  link: string;
}

export function generateChecklist(
  response: AcademicsOverviewResponse,
  lang: string,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const { setupIndicators } = response;

  items.push({
    id: "academicYear",
    status: setupIndicators.hasAcademicYear ? "done" : "error",
    titleKey: "academics.overview.checklist.academicYear.title",
    descriptionKey: "academics.overview.checklist.academicYear.description",
    link: `/${lang}/academics/structure`,
  });

  items.push({
    id: "term",
    status: setupIndicators.hasTerm ? "done" : "error",
    titleKey: "academics.overview.checklist.term.title",
    descriptionKey: "academics.overview.checklist.term.description",
    link: `/${lang}/academics/structure`,
  });

  items.push({
    id: "structure",
    status: setupIndicators.hasStructure ? "done" : "warning",
    titleKey: "academics.overview.checklist.structure.title",
    descriptionKey: "academics.overview.checklist.structure.description",
    link: `/${lang}/academics/structure`,
  });

  items.push({
    id: "subjects",
    status: setupIndicators.hasSubjects ? "done" : "warning",
    titleKey: "academics.overview.checklist.subjects.title",
    descriptionKey: "academics.overview.checklist.subjects.description",
    link: `/${lang}/academics/subjects`,
  });

  items.push({
    id: "rooms",
    status: setupIndicators.hasRooms ? "done" : "warning",
    titleKey: "academics.overview.checklist.rooms.title",
    descriptionKey: "academics.overview.checklist.rooms.description",
    link: `/${lang}/academics/rooms`,
  });

  items.push({
    id: "teachers",
    status: setupIndicators.hasTeacherAllocations ? "done" : "warning",
    titleKey: "academics.overview.checklist.teachers.title",
    descriptionKey: "academics.overview.checklist.teachers.description",
    link: `/${lang}/academics/teacher-allocation`,
  });

  items.push({
    id: "curriculum",
    status: setupIndicators.hasCurriculum ? "done" : "warning",
    titleKey: "academics.overview.checklist.curriculum.title",
    descriptionKey: "academics.overview.checklist.curriculum.description",
    link: `/${lang}/academics/curriculum`,
  });

  items.push({
    id: "lessonPlans",
    status: setupIndicators.hasLessonPlans ? "done" : "warning",
    titleKey: "academics.overview.checklist.lessonPlans.title",
    descriptionKey: "academics.overview.checklist.lessonPlans.description",
    link: `/${lang}/academics/lesson-plans`,
  });

  items.push({
    id: "timetable",
    status: setupIndicators.hasTimetable ? "done" : "warning",
    titleKey: "academics.overview.checklist.timetable.title",
    descriptionKey: "academics.overview.checklist.timetable.description",
    link: `/${lang}/academics/timetable`,
  });

  items.push({
    id: "calendar",
    status: setupIndicators.hasCalendarEvents ? "done" : "warning",
    titleKey: "academics.overview.checklist.calendar.title",
    descriptionKey: "academics.overview.checklist.calendar.description",
    link: `/${lang}/academics/calendar`,
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

export function generateAlerts(
  response: AcademicsOverviewResponse,
  lang: string,
): Alert[] {
  const alerts: Alert[] = [];
  const { setupIndicators, curriculum, lessonPlans, timetable } = response;

  if (!setupIndicators.hasAcademicYear) {
    alerts.push({
      id: "no-academic-year",
      severity: "error",
      titleKey: "academics.overview.alerts.noAcademicYear.title",
      descriptionKey: "academics.overview.alerts.noAcademicYear.description",
      link: `/${lang}/academics/structure`,
    });
  }

  if (setupIndicators.hasAcademicYear && !setupIndicators.hasTerm) {
    alerts.push({
      id: "no-term",
      severity: "error",
      titleKey: "academics.overview.alerts.noTerm.title",
      descriptionKey: "academics.overview.alerts.noTerm.description",
      link: `/${lang}/academics/structure`,
    });
  }

  if (setupIndicators.hasTerm && !setupIndicators.readyForScheduling) {
    alerts.push({
      id: "not-ready-for-scheduling",
      severity: "warning",
      titleKey: "academics.overview.alerts.notReadyForScheduling.title",
      descriptionKey: "academics.overview.alerts.notReadyForScheduling.description",
      link: `/${lang}/academics`,
    });
  }

  if (setupIndicators.hasTerm && !setupIndicators.readyForLearningFlow) {
    alerts.push({
      id: "not-ready-for-learning",
      severity: "warning",
      titleKey: "academics.overview.alerts.notReadyForLearning.title",
      descriptionKey: "academics.overview.alerts.notReadyForLearning.description",
      link: `/${lang}/academics`,
    });
  }

  if (setupIndicators.hasTerm && timetable.entriesCount === 0) {
    alerts.push({
      id: "no-timetable",
      severity: "info",
      titleKey: "academics.overview.alerts.noTimetable.title",
      descriptionKey: "academics.overview.alerts.noTimetable.description",
      link: `/${lang}/academics/timetable`,
    });
  }

  if (setupIndicators.hasTerm && curriculum.curriculaCount === 0) {
    alerts.push({
      id: "no-curriculum",
      severity: "info",
      titleKey: "academics.overview.alerts.noCurriculum.title",
      descriptionKey: "academics.overview.alerts.noCurriculum.description",
      link: `/${lang}/academics/curriculum`,
    });
  }

  if (setupIndicators.hasTerm && lessonPlans.lessonPlansCount === 0) {
    alerts.push({
      id: "no-lesson-plans",
      severity: "info",
      titleKey: "academics.overview.alerts.noLessonPlans.title",
      descriptionKey: "academics.overview.alerts.noLessonPlans.description",
      link: `/${lang}/academics/lesson-plans`,
    });
  }

  const severityOrder = { error: 0, warning: 1, info: 2 };
  return alerts
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 6);
}

