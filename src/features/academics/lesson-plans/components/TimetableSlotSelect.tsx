"use client";

import { useEffect, useState } from "react";
import Select from "@/components/ui/input/Select";
import { getConfig, listEntries } from "@/features/academics/timetable/services/timetableApiAdapter";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";

export interface TimetableSlotScope {
  academicYearId: string;
  termId: string;
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
    void getConfig({
      academicYearId: scope.academicYearId,
      termId: scope.termId,
      classroomId: scope.classroomId || undefined,
    })
      .then((config) =>
        listEntries({
          timetableConfigId: config.timetableConfigId || config.id,
          classroomId: scope.classroomId || undefined,
          teacherUserId: scope.teacherUserId || undefined,
          subjectId: scope.subjectId || undefined,
          dayOfWeek: dayOfWeekFromDateOnly(plannedDate),
          status: "ACTIVE",
        }),
      )
      .then((response) => {
        if (!active) return;
        setEntries(
          responseEntries(response).filter(
            (entry) =>
              !scope.teacherSubjectAllocationId ||
              entry.teacherSubjectAllocationId ===
                scope.teacherSubjectAllocationId,
          ),
        );
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
  }, [onChange, plannedDate, scope.academicYearId, scope.classroomId, scope.subjectId, scope.teacherSubjectAllocationId, scope.teacherUserId, scope.termId]);

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
