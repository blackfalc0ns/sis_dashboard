// Absences Types

import type { AttachmentMeta } from "../roll-call/types";

export type AttendanceIncidentType = "ABSENT" | "LATE" | "EARLY_LEAVE" | "EXCUSED" | "UNMARKED";
export type AttendanceGranularity = "PERIOD" | "DAILY_DERIVED";

export interface AbsenceScopeFilter {
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
}

export interface AbsenceRecord {
  id: string;
  yearId: string;
  termId: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentNumber: string;
  studentNameAr: string;
  studentNameEn: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
  gradeNameAr?: string;
  gradeNameEn?: string;
  sectionNameAr?: string;
  sectionNameEn?: string;
  classroomNameAr?: string;
  classroomNameEn?: string;
  granularity: AttendanceGranularity;
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
  status: AttendanceIncidentType;
  minutesLate?: number;
  minutesEarlyLeave?: number;
  excuse?: {
    reasonAr?: string;
    reasonEn?: string;
    attachments?: AttachmentMeta[];
    createdAt: string;
  };
  sourceSessionId?: string;
  updatedAt: string;
}

export interface AbsencesFilters {
  dateFrom?: string;
  dateTo?: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
  status: "ALL" | AttendanceIncidentType; // Changed from statuses array to single status
  granularities: AttendanceGranularity[];
  onlyUnexcused: boolean;
  search: string;
}

export interface AbsencesKPIs {
  totalIncidents: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  dailyAbsentCount: number;
}

export interface DailyStatus {
  date: string;
  studentId: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  missedPeriodsCount: number;
  totalSelectedPeriods: number;
  threshold: number;
}
