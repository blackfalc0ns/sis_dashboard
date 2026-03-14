export interface TimetableEntry {
  id: string;
  termId: string;
  sectionId: string;
  classroomId?: string;
  dayKey: string; // e.g., "sun", "mon", "tue" - config-safe identifier
  periodIndex: number; // 1-based period number
  slotType?: "CLASS" | "BREAK"; // Type of slot (default: CLASS)
  subjectId: string | null;
  teacherId: string | null;
  roomId: string | null;
  breakLabelAr?: string; // Label for break slots (default: "فُسحة")
  breakLabelEn?: string; // Label for break slots (default: "Break")
  status?: "DRAFT" | "PUBLISHED";
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for backward compatibility (optional)
  day?: number; // Deprecated: use dayKey instead
  period?: number; // Deprecated: use periodIndex instead
}

export interface Room {
  id: string;
  schoolId: string;
  nameAr: string;
  nameEn: string;
  type: "CLASSROOM" | "LAB" | "OTHER";
  capacity: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetableConflict {
  type: "TEACHER" | "ROOM";
  dayKey: string;
  periodIndex: number;
  resourceId: string; // teacherId or roomId
  resourceName: string;
  sections: Array<{
    sectionId: string;
    sectionName: string;
    classroomId?: string;
    classroomName?: string;
    subjectName: string;
  }>;
  // Legacy fields for backward compatibility
  day?: number;
  period?: number;
}

export interface SubjectHoursSummary {
  subjectId: string;
  subjectNameAr: string;
  subjectNameEn: string;
  target: number; // from weekly hours matrix
  actual: number; // count from timetable
  status: "OK" | "UNDER" | "OVER";
}

export interface TimetableValidationResult {
  isValid: boolean;
  completeness: {
    totalSlots: number;
    filledSlots: number;
    missingTeacher: number;
    missingRoom: number;
  };
  subjectHours: SubjectHoursSummary[];
  conflicts: TimetableConflict[];
}

export interface TimetableConfig {
  daysPerWeek: number; // typically 5 or 6
  periodsPerDay: number; // typically 6-8
  dayNames: string[]; // ["Sunday", "Monday", ...]
}
