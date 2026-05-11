import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";

export interface AttendanceBehaviorFilters {
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  incidentType?: "ALL" | "POSITIVE" | "NEGATIVE";
}

export interface AttendanceBehaviorRow {
  id: string;
  studentName: string;
  studentNumber: string;
  behaviorType: "POSITIVE" | "NEGATIVE";
  points: number;
  incidentDate: string;
  note?: string;
}

export interface AttendanceBehaviorResponse {
  rows: AttendanceBehaviorRow[];
  total: number;
}
