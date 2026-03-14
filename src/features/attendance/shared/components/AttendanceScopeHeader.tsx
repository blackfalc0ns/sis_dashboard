"use client";

import ScopeBreadcrumb from "@/features/attendance/shared/components/ScopeBreadcrumb";
import AttendanceReadOnlyBanner from "./AttendanceReadOnlyBanner";
import type {
  Classroom,
  Grade,
  Section,
  Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import { isScopeSelectionComplete, type AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

interface AttendanceScopeHeaderProps {
  isReadOnly: boolean;
  readOnlyMessage: string;
  scopeType: AttendanceScopeType;
  scopeIds?: AttendanceScopeIds;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms?: Classroom[];
  containerClassName?: string;
}

export default function AttendanceScopeHeader({
  isReadOnly,
  readOnlyMessage,
  scopeType,
  scopeIds,
  stages,
  grades,
  sections,
  classrooms = [],
  containerClassName = "flex flex-col gap-4",
}: AttendanceScopeHeaderProps) {
  const canShowScope = isScopeSelectionComplete(scopeType, scopeIds);

  if (!isReadOnly && !canShowScope) {
    return null;
  }

  return (
    <div className={containerClassName}>
      {isReadOnly ? <AttendanceReadOnlyBanner message={readOnlyMessage} /> : null}
      {canShowScope ? (
        <div
          className="rounded-lg border px-4 py-3"
          style={{
            backgroundColor: "var(--card-background)",
            borderColor: "var(--border-color)",
          }}
        >
          <ScopeBreadcrumb
            scopeType={scopeType}
            scopeIds={scopeIds}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
          />
        </div>
      ) : null}
    </div>
  );
}
