"use client";

import { useEffect, useMemo, useState } from "react";
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
  response: BackendTimetableEntryDto[] | { items: BackendTimetableEntryDto[] },
) => (Array.isArray(response) ? response : response.items || []);

export function timetableConfigAttempts(scope: TimetableSlotScope) {
  type Attempt = {
    academicYearId: string;
    termId: string;
    scopeType: TimetableScopeType;
    classroomId?: string;
    sectionId?: string;
    gradeId?: string;
  };
  const common = {
    academicYearId: scope.academicYearId,
    termId: scope.termId,
  };
  const attempts: Attempt[] = [];
  if (scope.classroomId) {
    attempts.push({ ...common, scopeType: "CLASSROOM", classroomId: scope.classroomId });
  }
  if (scope.sectionId) {
    attempts.push({ ...common, scopeType: "SECTION", sectionId: scope.sectionId });
  }
  if (scope.gradeId) {
    attempts.push({ ...common, scopeType: "GRADE", gradeId: scope.gradeId });
  }
  attempts.push({ ...common, scopeType: "TERM" });
  return attempts;
}

export function useTimetableConfigForScope(
  scope: TimetableSlotScope,
  enabled: boolean,
) {
  const [config, setConfig] = useState<BackendTimetableConfigDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (
      !enabled ||
      !scope.academicYearId ||
      !scope.termId ||
      !scope.classroomId
    ) {
      setConfig(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setConfig(null);
    setIsLoading(true);
    void (async () => {
      for (const attempt of timetableConfigAttempts(scope)) {
        if (!active) return;
        try {
          const resolvedConfig = await getConfig(attempt);
          if (active) setConfig(resolvedConfig);
          return;
        } catch {
          // Try the next broader timetable scope.
        }
      }
      if (active) setConfig(null);
    })().finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [enabled, scope]);

  return { config, isLoading };
}

export function activeTimetableDates(
  dates: string[],
  config: Pick<BackendTimetableConfigDto, "activeDays" | "weekStartDay"> | null,
): string[] {
  if (!config) return [];
  const activeDays = new Set(config.activeDays);
  return dates
    .filter((date) => activeDays.has(dayOfWeekFromDateOnly(date)))
    .sort((left, right) => {
      const leftOffset =
        (dayOfWeekFromDateOnly(left) - config.weekStartDay + 7) % 7;
      const rightOffset =
        (dayOfWeekFromDateOnly(right) - config.weekStartDay + 7) % 7;
      if (leftOffset !== rightOffset) return leftOffset - rightOffset;
      return left.localeCompare(right);
    });
}

export function filterEntriesForScope(
  entries: BackendTimetableEntryDto[],
): BackendTimetableEntryDto[] {
  return entries.filter((entry) => entry.status?.toLowerCase() !== "cancelled");
}

export function entryMatchesTimetableScope(
  entry: BackendTimetableEntryDto,
  scope: TimetableSlotScope,
): boolean {
  if (entry.status?.toLowerCase() === "cancelled") return false;

  const allocationMatch = Boolean(
    entry.teacherSubjectAllocationId &&
      scope.teacherSubjectAllocationId &&
      entry.teacherSubjectAllocationId === scope.teacherSubjectAllocationId,
  );
  const flatEntry = entry as BackendTimetableEntryDto & {
    classroomId?: string;
    subjectId?: string;
    teacherUserId?: string;
    teacher?: BackendTimetableEntryDto["teacher"] & { id?: string };
  };
  const classroomMatch =
    !scope.classroomId ||
    entry.classroom?.id === scope.classroomId ||
    flatEntry.classroomId === scope.classroomId;
  const subjectMatch =
    !scope.subjectId ||
    entry.subject?.id === scope.subjectId ||
    flatEntry.subjectId === scope.subjectId;
  const teacherMatch =
    !scope.teacherUserId ||
    entry.teacher?.userId === scope.teacherUserId ||
    flatEntry.teacherUserId === scope.teacherUserId ||
    flatEntry.teacher?.id === scope.teacherUserId;

  return allocationMatch || (classroomMatch && subjectMatch && teacherMatch);
}

export async function listAvailableTimetableDays(
  scope: TimetableSlotScope,
): Promise<number[]> {
  for (const attempt of timetableConfigAttempts(scope)) {
    try {
      const config = await getConfig(attempt);
      const timetableConfigId = config.timetableConfigId || config.id;
      const entriesByDay = await Promise.all(
        config.activeDays.map(async (dayOfWeek) => ({
          dayOfWeek,
          response: await listEntries({
            timetableConfigId,
            classroomId: scope.classroomId || undefined,
            dayOfWeek,
          }),
        })),
      );

      return entriesByDay
        .filter(({ response }) =>
          filterEntriesForScope(responseEntries(response)).some((entry) =>
            entryMatchesTimetableScope(entry, scope),
          ),
        )
        .map(({ dayOfWeek }) => dayOfWeek);
    } catch {
      // Try the next broader timetable scope.
    }
  }

  return [];
}

function entryOptionLabel(entry: BackendTimetableEntryDto): string {
  const subject = entry.subject?.nameEn || entry.subject?.nameAr;
  const teacher = entry.teacher as
    | (NonNullable<BackendTimetableEntryDto["teacher"]> & {
        name?: string;
        nameEn?: string;
        nameAr?: string;
      })
    | null;
  const teacherName =
    teacher?.fullName || teacher?.name || teacher?.nameEn || teacher?.nameAr;
  const time =
    entry.period?.startTime && entry.period?.endTime
      ? `${entry.period.startTime} - ${entry.period.endTime}`
      : undefined;
  return [entry.period?.label, time, subject, teacherName]
    .filter(Boolean)
    .join(" · ") || entry.id;
}

export default function TimetableSlotSelect({
  plannedDate,
  value,
  onChange,
  label,
  emptyOptionLabel,
  noSlotsMessage,
  loadingMessage,
  academicYearId,
  termId,
  gradeId,
  sectionId,
  classroomId,
  teacherUserId,
  subjectId,
  teacherSubjectAllocationId,
}: TimetableSlotSelectProps) {
  const [entries, setEntries] = useState<BackendTimetableEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scope = useMemo(
    () => ({
      academicYearId,
      termId,
      gradeId,
      sectionId,
      classroomId,
      teacherUserId,
      subjectId,
      teacherSubjectAllocationId,
    }),
    [academicYearId, classroomId, gradeId, sectionId, subjectId, teacherSubjectAllocationId, teacherUserId, termId],
  );

  useEffect(() => {
    let active = true;
    onChange(null);
    if (
      !plannedDate ||
      !scope.academicYearId ||
      !scope.termId ||
      !scope.subjectId ||
      !scope.classroomId
    ) {
      return () => {
        active = false;
      };
    }

    void Promise.resolve().then(() => {
      if (active) setIsLoading(true);
    });
    void (async () => {
      for (const attempt of timetableConfigAttempts(scope)) {
        if (!active) return;
        try {
          const config = await getConfig(attempt);
          const response = await listEntries({
            timetableConfigId: config.timetableConfigId || config.id,
            classroomId: scope.classroomId || undefined,
            dayOfWeek: dayOfWeekFromDateOnly(plannedDate),
          });
          const filtered = filterEntriesForScope(responseEntries(response));
          if (active) setEntries(filtered);
          return;
        } catch {
          // Try the next broader timetable scope.
        }
      }
      if (active) setEntries([]);
    })().finally(() => {
      if (active) setIsLoading(false);
    });

    return () => { active = false; };
  }, [onChange, plannedDate, scope]);

  return (
    <Select
      label={label}
      value={value}
      onChange={(entryId) => onChange(entries.find((entry) => entry.id === entryId) ?? null)}
      disabled={isLoading}
      options={[
        { value: "", label: isLoading ? loadingMessage : emptyOptionLabel },
        ...entries.map((entry) => ({
          value: entry.id,
          label: entryOptionLabel(entry),
          disabled: !entryMatchesTimetableScope(entry, scope),
        })),
      ]}
      helperText={!isLoading && entries.length === 0 ? noSlotsMessage : undefined}
    />
  );
}
