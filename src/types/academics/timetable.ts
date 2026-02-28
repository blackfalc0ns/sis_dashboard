export interface TimetableEntry {
  id: string;
  termId: string;
  sectionId: string;
  day: number; // 0 = Sunday, 1 = Monday, etc.
  period: number; // 1-based period number
  subjectId: string | null;
  teacherId: string | null;
  roomId: string | null;
  status?: "DRAFT" | "PUBLISHED";
  createdAt?: string;
  updatedAt?: string;
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
  day: number;
  period: number;
  resourceId: string; // teacherId or roomId
  resourceName: string;
  sections: Array<{
    sectionId: string;
    sectionName: string;
    subjectName: string;
  }>;
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
