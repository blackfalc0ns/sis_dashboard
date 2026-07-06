export type LessonPlansMissingDataStatus =
  | "missing-grade"
  | "missing-section"
  | "missing-classroom"
  | "missing-subject"
  | "missing-teacher-allocation"
  | "missing-curriculum"
  | "no-curriculum-lessons"
  | "missing-timetable-slots";

export interface LessonPlansMissingDataScope {
  academicYearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
}

function setIfPresent(
  params: URLSearchParams,
  key: string,
  value?: string,
) {
  if (value) params.set(key, value);
}

function addStructureParent(
  params: URLSearchParams,
  nodeType: "stage" | "grade" | "section",
  nodeId?: string,
) {
  if (!nodeId) return;
  params.set("nodeType", nodeType);
  params.set("nodeId", nodeId);
}

export function buildLessonPlansMissingDataHref(
  status: LessonPlansMissingDataStatus,
  locale: string,
  scope: LessonPlansMissingDataScope,
): string {
  const params = new URLSearchParams();
  setIfPresent(params, "year", scope.academicYearId);
  setIfPresent(params, "term", scope.termId);

  let pathname: string;
  switch (status) {
    case "missing-grade":
      pathname = "/academics/structure";
      addStructureParent(params, "stage", scope.stageId);
      break;
    case "missing-section":
      pathname = "/academics/structure";
      addStructureParent(params, "grade", scope.gradeId);
      break;
    case "missing-classroom":
      pathname = "/academics/structure";
      addStructureParent(params, "section", scope.sectionId);
      break;
    case "missing-subject":
      pathname = "/academics/subjects";
      params.set("tab", "subjects");
      break;
    case "missing-teacher-allocation":
      pathname = "/academics/teacher-allocation";
      params.set("tab", "matrix");
      setIfPresent(params, "grade", scope.gradeId);
      setIfPresent(params, "section", scope.sectionId);
      setIfPresent(params, "classroom", scope.classroomId);
      setIfPresent(params, "subject", scope.subjectId);
      break;
    case "missing-curriculum":
    case "no-curriculum-lessons":
      pathname = "/academics/curriculum";
      setIfPresent(params, "grade", scope.gradeId);
      setIfPresent(params, "subject", scope.subjectId);
      break;
    case "missing-timetable-slots":
      pathname = "/academics/timetable";
      setIfPresent(params, "grade", scope.gradeId);
      setIfPresent(params, "section", scope.sectionId);
      setIfPresent(params, "classroom", scope.classroomId);
      break;
  }

  const query = params.toString();
  return `/${locale}${pathname}${query ? `?${query}` : ""}`;
}
