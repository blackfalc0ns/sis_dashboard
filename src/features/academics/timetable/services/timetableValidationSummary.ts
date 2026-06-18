import type {
  TimetableValidationIssue,
  TimetableValidationItem,
  TimetableValidationResponse,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableConflict } from "@/features/academics/timetable/types/timetable";
import { dayIndexToKey } from "@/features/academics/timetable/services/timetableMappers";

export interface TimetableValidationSummary {
  canPublish: boolean;
  backendSummary: TimetableValidationResponse["summary"] | null;
  items: TimetableValidationItem[];
  blockingReasons: string[];
  warnings: string[];
  missingTeacherAllocations: TimetableValidationIssue[];
  underScheduledSubjects: TimetableValidationIssue[];
  overScheduledSubjects: TimetableValidationIssue[];
  teacherConflicts: TimetableValidationIssue[];
  classroomConflicts: TimetableValidationIssue[];
  roomConflicts: TimetableValidationIssue[];
  missingSubjectAllocationRows: TimetableValidationIssue[];
  conflicts: TimetableValidationIssue[];
}

export const emptyValidationSummary = (): TimetableValidationSummary => ({
  canPublish: false,
  backendSummary: null,
  items: [],
  blockingReasons: [],
  warnings: [],
  missingTeacherAllocations: [],
  underScheduledSubjects: [],
  overScheduledSubjects: [],
  teacherConflicts: [],
  classroomConflicts: [],
  roomConflicts: [],
  missingSubjectAllocationRows: [],
  conflicts: [],
});

export function validationSummaryFromResponse(
  response: unknown,
): TimetableValidationSummary {
  if (!response || typeof response !== "object") {
    return emptyValidationSummary();
  }

  const validationResponse = response as TimetableValidationResponse;
  const backendItems = Array.isArray(validationResponse.items)
    ? validationResponse.items
    : [];
  const itemBuckets = bucketIssuesFromValidationItems(backendItems);
  return {
    canPublish:
      validationResponse.canPublish === true ||
      !hasSummaryBlockingCounts(validationResponse),
    backendSummary: validationResponse.summary ?? null,
    items: backendItems,
    blockingReasons: [
      ...reasonList(validationResponse.blockingReasons),
      ...blockingReasonsFromSummary(validationResponse),
    ],
    warnings: reasonList(validationResponse.warnings),
    missingTeacherAllocations: issueList(
      validationResponse.missingTeacherAllocations,
    ).concat(itemBuckets.missingTeacherAllocations),
    underScheduledSubjects: issueList(
      validationResponse.underScheduledSubjects,
    ).concat(itemBuckets.underScheduledSubjects),
    overScheduledSubjects: issueList(
      validationResponse.overScheduledSubjects,
    ).concat(itemBuckets.overScheduledSubjects),
    teacherConflicts: issueList(validationResponse.teacherConflicts),
    classroomConflicts: issueList(validationResponse.classroomConflicts),
    roomConflicts: issueList(validationResponse.roomConflicts),
    missingSubjectAllocationRows: issueList(
      validationResponse.missingSubjectAllocationRows,
    ).concat(itemBuckets.missingSubjectAllocationRows),
    conflicts: issueList(validationResponse.conflicts),
  };
}

export function validationIssueText(issue: TimetableValidationIssue): string {
  if (issue.message) {
    return issue.message;
  }
  const name =
    issue.subjectName ??
    issue.subjectId ??
    issue.teacherName ??
    issue.classroomName ??
    issue.roomName ??
    issue.teacherId ??
    issue.classroomId ??
    issue.roomId;
  const hours =
    typeof issue.actual === "number" && typeof issue.expected === "number"
      ? ` (${issue.actual}/${issue.expected})`
      : typeof issue.scheduledWeeklyHours === "number" &&
          typeof issue.expectedWeeklyHours === "number"
        ? ` (${issue.scheduledWeeklyHours}/${issue.expectedWeeklyHours})`
        : "";
  return `${name ?? "Timetable issue"}${hours}`;
}

export function conflictsFromResponse(response: unknown): TimetableConflict[] {
  if (Array.isArray(response)) {
    return response.map(normalizeConflict);
  }
  if (response && typeof response === "object") {
    const conflictsResponse = response as {
      conflicts?: unknown[];
      items?: unknown[];
    };
    return (conflictsResponse.conflicts ?? conflictsResponse.items ?? []).map(
      normalizeConflict,
    );
  }
  return [];
}

export function hasBlockingValidation(summary: TimetableValidationSummary) {
  return (
    summary.blockingReasons.length > 0 ||
    summary.missingTeacherAllocations.length > 0 ||
    summary.underScheduledSubjects.length > 0 ||
    summary.overScheduledSubjects.length > 0 ||
    summary.teacherConflicts.length > 0 ||
    summary.classroomConflicts.length > 0 ||
    summary.roomConflicts.length > 0 ||
    summary.missingSubjectAllocationRows.length > 0 ||
    summary.conflicts.length > 0
  );
}

function issueList(
  issues: TimetableValidationIssue[] | undefined,
): TimetableValidationIssue[] {
  return Array.isArray(issues) ? issues : [];
}

function reasonList(
  messages: Array<string | { message?: string }> | undefined,
): string[] {
  return Array.isArray(messages)
    ? messages
        .map((message) =>
          typeof message === "string" ? message : message.message,
        )
        .filter((message): message is string => Boolean(message))
    : [];
}

function bucketIssuesFromValidationItems(items: TimetableValidationItem[]) {
  const buckets = {
    missingTeacherAllocations: [] as TimetableValidationIssue[],
    underScheduledSubjects: [] as TimetableValidationIssue[],
    overScheduledSubjects: [] as TimetableValidationIssue[],
    missingSubjectAllocationRows: [] as TimetableValidationIssue[],
  };

  for (const item of items) {
    const normalizedIssues = item.issues.map((issue) =>
      enrichValidationIssue(issue, item),
    );
    if (item.status === "missing_subject_allocation") {
      buckets.missingSubjectAllocationRows.push(...normalizedIssues);
      continue;
    }
    for (const issue of normalizedIssues) {
      if (issue.code === "missing_teacher_allocation") {
        buckets.missingTeacherAllocations.push(issue);
      } else if (issue.code === "under_scheduled_subject") {
        buckets.underScheduledSubjects.push(issue);
      } else if (issue.code === "over_scheduled_subject") {
        buckets.overScheduledSubjects.push(issue);
      } else if (issue.code === "missing_subject_allocation_row") {
        buckets.missingSubjectAllocationRows.push(issue);
      }
    }
  }

  return buckets;
}

function enrichValidationIssue(
  issue: TimetableValidationIssue,
  item: TimetableValidationItem,
): TimetableValidationIssue {
  return {
    ...issue,
    subjectId: issue.subjectId ?? item.subjectId ?? undefined,
    subjectName:
      issue.subjectName ?? item.subject?.nameEn ?? item.subject?.nameAr,
    classroomId: issue.classroomId ?? item.classroomId,
    classroomName:
      issue.classroomName ?? item.classroom.nameEn ?? item.classroom.nameAr,
    expectedWeeklyHours: issue.expectedWeeklyHours ?? item.expectedWeeklyHours,
    scheduledWeeklyHours:
      issue.scheduledWeeklyHours ?? item.scheduledWeeklyHours,
    expected:
      issue.expected ??
      (typeof item.expectedWeeklyHours === "number"
        ? item.expectedWeeklyHours
        : undefined),
    actual: issue.actual ?? item.scheduledWeeklyHours,
  };
}

function hasSummaryBlockingCounts(
  response: TimetableValidationResponse,
): boolean {
  const summary = response.summary;
  if (!summary) {
    return false;
  }
  return (
    summary.missingTeacherAllocations > 0 ||
    summary.underScheduledSubjects > 0 ||
    summary.overScheduledSubjects > 0 ||
    summary.teacherConflicts > 0 ||
    summary.classroomConflicts > 0 ||
    summary.roomConflicts > 0 ||
    summary.missingSubjectAllocationRows > 0
  );
}

function blockingReasonsFromSummary(
  response: TimetableValidationResponse,
): string[] {
  return hasSummaryBlockingCounts(response)
    ? ["Resolve timetable validation issues before publishing."]
    : [];
}

function normalizeConflict(conflict: unknown): TimetableConflict {
  const current = conflict as Partial<TimetableConflict> & {
    code?: string;
    type?: string;
    dayOfWeek?: number | null;
    periodIndex?: number;
    periodId?: string | null;
    teacherUserId?: string | null;
    roomId?: string | null;
    message?: string;
    severity?: string;
    proposedIndexes?: number[];
    entryIds?: string[];
  };
  if (current.dayKey && current.periodIndex) {
    return current as TimetableConflict;
  }
  const type =
    current.type === "ROOM" || current.code === "room_conflict"
      ? "ROOM"
      : "TEACHER";
  const periodIndex = current.periodIndex ?? current.period ?? 0;
  const resourceId =
    type === "ROOM"
      ? (current.roomId ?? current.resourceId ?? "")
      : (current.teacherUserId ?? current.resourceId ?? "");
  return {
    type,
    code: current.code,
    message: current.message,
    severity: current.severity,
    dayKey: dayIndexToKey(current.dayOfWeek ?? 0),
    periodIndex,
    periodId: current.periodId ?? undefined,
    resourceId,
    resourceName:
      current.resourceName ??
      resourceId ??
      current.message ??
      "Timetable conflict",
    proposedIndexes: current.proposedIndexes ?? [],
    entryIds: current.entryIds ?? [],
    sections: current.sections ?? [],
    day: current.dayOfWeek ?? current.day,
    period: periodIndex,
  };
}
