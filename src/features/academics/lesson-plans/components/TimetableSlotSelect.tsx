"use client";

import { useEffect, useState } from "react";
import Select from "@/components/ui/input/Select";
import { getConfig, listEntries } from "@/features/academics/timetable/services/timetableApiAdapter";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
  TimetableScopeType,
} from "@/features/academics/timetable/services/timetableApiTypes";

export interface TimetableSlotScope {
  academicYearId: string;
  termId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  teacherUserId: string;
  subjectId: string;
  teacherSubjectAllocationId: string;
}

interface TimetableSlotSelectProps extends TimetableSlotScope {
  plannedDate: string;
  value: string;
  onChange: (entry: BackendTimetableEntryDto | null) => void;
  label: string;
  emptyOptionLabel: string;
  noSlotsMessage: string;
  loadingMessage: string;
}

export function dayOfWeekFromDateOnly(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

const responseEntries = (
  response:
    | BackendTimetableEntryDto[]
    | { items: BackendTimetableEntryDto[] },
) => (Array.isArray(response) ? response : response.items || []);

/**
 * Resolve the timetable config for lesson plans by trying scopes in order:
 * CLASSROOM → SECTION → GRADE → TERM.
 * This mirrors the timetable page's `resolveScopeSelection` logic so that
 * lesson plans can find a config even when it was created at a broader scope.
 */
async function resolveTimetableConfigForLessonPlans(scope: {
  academicYearId: string;
  termId: string;
  classroomId?: string;
  sectionId?: string;
  gradeId?: string;
}): Promise<BackendTimetableConfigDto | null> {
  type Attempt = {
    academicYearId: string;
    termId: string;
    scopeType: TimetableScopeType;
    classroomId?: string;
    sectionId?: string;
    gradeId?: string;
  };

  const attempts: Attempt[] = [];

  if (scope.classroomId) {
    attempts.push({
      academicYearId: scope.academicYearId,
      termId: scope.termId,
      scopeType: "CLASSROOM",
      classroomId: scope.classroomId,
    });
  }
  if (scope.sectionId) {
    attempts.push({
      academicYearId: scope.academicYearId,
      termId: scope.termId,
      scopeType: "SECTION",
      sectionId: scope.sectionId,
    });
  }
  if (scope.gradeId) {
    attempts.push({
      academicYearId: scope.academicYearId,
      termId: scope.termId,
      scopeType: "GRADE",
      gradeId: scope.gradeId,
    });
  }
  attempts.push({
    academicYearId: scope.academicYearId,
    termId: scope.termId,
    scopeType: "TERM",
  });

  for (const params of attempts) {
    try {
      return await getConfig(params);
    } catch {
      // Config not found at this scope level — try the next one
    }
  }
  return null;
}

/**
 * Filter timetable entries client-side to match the current lesson plan scope.
 * - Accepts entries with lowercase or uppercase "active" status.
 * - When both entry and scope have a teacherSubjectAllocationId, matches exactly.
 * - When entry's teacherSubjectAllocationId is null, falls back to matching
 *   by teacher + subject + classroom.
 */
function filterEntriesForScope(
  entries: BackendTimetableEntryDto[],
  scope: TimetableSlotScope,
): BackendTimetableEntryDto[] {
  return entries.filter((entry) => {
    // Accept active entries regardless of case
    const entryStatus = (entry.status || "").toLowerCase();
    if (entryStatus !== "active") return false;

    // If entry has a teacherSubjectAllocationId and so does the scope, match exactly
    if (entry.teacherSubjectAllocationId && scope.teacherSubjectAllocationId) {
      return (
        entry.teacherSubjectAllocationId === scope.teacherSubjectAllocationId
      );
    }

    // Fallback: match by classroom + subject + teacher when allocation ID is null
    const classroomMatch =
      !scope.classroomId || entry.classroom?.id === scope.classroomId;
    const subjectMatch =
      !scope.subjectId || entry.subject?.id === scope.subjectId;
    const teacherMatch =
      !scope.teacherUserId || entry.teacher?.userId === scope.teacherUserId;
    return classroomMatch && subjectMatch && teacherMatch;
  });
}

export default function TimetableSlotSelect({
  plannedDate,
  value,
  onChange,
  label,
  emptyOptionLabel,
  noSlotsMessage,
  loadingMessage,
  ...scope
}: TimetableSlotSelectProps) {
  const [entries, setEntries] = useState<BackendTimetableEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    onChange(null);
    if (!plannedDate || !scope.academicYearId || !scope.termId) {
      return () => {
        active = false;
      };
    }
    void Promise.resolve().then(() => {
      if (active) setIsLoading(true);
    });
    void resolveTimetableConfigForLessonPlans({
      academicYearId: scope.academicYearId,
      termId: scope.termId,
      classroomId: scope.classroomId || undefined,
      sectionId: scope.sectionId || undefined,
      gradeId: scope.gradeId || undefined,
    })
      .then((config) => {
        if (!config || !active) return [];
        return listEntries({
          timetableConfigId: config.timetableConfigId || config.id,
          dayOfWeek: dayOfWeekFromDateOnly(plannedDate),
        });
      })
      .then((response) => {
        if (!active) return;
        if (!response || (Array.isArray(response) && response.length === 0)) {
          setEntries([]);
          return;
        }
        setEntries(filterEntriesForScope(responseEntries(response), scope));
      })
      .catch(() => {
        if (active) setEntries([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onChange, plannedDate, scope.academicYearId, scope.classroomId, scope.gradeId, scope.sectionId, scope.subjectId, scope.teacherSubjectAllocationId, scope.teacherUserId, scope.termId]);

  const selectEntry = (entryId: string) =>
    onChange(entries.find((entry) => entry.id === entryId) ?? null);

  return (
    <Select
      label={label}
      value={value}
      onChange={selectEntry}
      disabled={isLoading}
      options={[
        { value: "", label: isLoading ? loadingMessage : emptyOptionLabel },
        ...entries.map((entry) => ({
          value: entry.id,
          label: entry.period.label,
        })),
      ]}
      helperText={!isLoading && entries.length === 0 ? noSlotsMessage : undefined}
    />
  );
}
