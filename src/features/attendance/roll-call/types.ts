// Roll Call Types

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "EARLY_LEAVE" | "UNMARKED";
export type AttendanceSessionMode = "DAILY" | "PERIOD";
export type AttendanceSessionStatus = "DRAFT" | "SUBMITTED";

export interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface AttendanceSession {
  id: string;
  yearId: string;
  termId: string;
  date: string; // YYYY-MM-DD
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
  mode: AttendanceSessionMode;
  periodId?: string; // Canonical stable ID from TimetablePeriod.id (for PERIOD mode)
  periodIndex?: number; // Display/order only (derived from timetable period.index)
  periodNameAr?: string;
  periodNameEn?: string;
  status: AttendanceSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceEntry {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  minutesLate?: number;
  minutesEarlyLeave?: number;
  excuseReason?: string;
  excuseAttachments?: AttachmentMeta[];
  note?: string;
  hasAttachment?: boolean;
  updatedAt: string;
}

export interface AttendanceKPIs {
  totalStudents: number;
  markedCount: number;
  unmarkedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  earlyLeaveCount: number;
  completionPct: number;
}

export interface RosterStudent {
  id: string;
  nameAr: string;
  nameEn: string;
  studentNumber: string;
  photoUrl?: string;
}

export interface SessionWithEntries {
  session: AttendanceSession;
  entries: AttendanceEntry[];
}
