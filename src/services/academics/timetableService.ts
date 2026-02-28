import {
  TimetableEntry,
  TimetableValidationResult,
  TimetableConflict,
  SubjectHoursSummary,
} from "@/types/academics/timetable";

// Mock data for development
const mockTimetableEntries: TimetableEntry[] = [];

export async function fetchTimetable(
  termId: string,
  sectionId: string
): Promise<TimetableEntry[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Filter entries for this section
  return mockTimetableEntries.filter(
    (entry) => entry.termId === termId && entry.sectionId === sectionId
  );
}

export async function fetchAllTimetablesForTerm(
  termId: string
): Promise<TimetableEntry[]> {
  // Fetch all timetables for conflict detection
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockTimetableEntries.filter((entry) => entry.termId === termId);
}

export async function upsertTimetableEntries(
  termId: string,
  sectionId: string,
  entries: Partial<TimetableEntry>[]
): Promise<TimetableEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock implementation: update or create entries
  const updatedEntries: TimetableEntry[] = [];

  for (const entry of entries) {
    const existingIndex = mockTimetableEntries.findIndex(
      (e) =>
        e.termId === termId &&
        e.sectionId === sectionId &&
        e.day === entry.day &&
        e.period === entry.period
    );

    const newEntry: TimetableEntry = {
      id: entry.id || `tt-${Date.now()}-${Math.random()}`,
      termId,
      sectionId,
      day: entry.day!,
      period: entry.period!,
      subjectId: entry.subjectId || null,
      teacherId: entry.teacherId || null,
      roomId: entry.roomId || null,
      status: "DRAFT",
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      mockTimetableEntries[existingIndex] = newEntry;
    } else {
      mockTimetableEntries.push(newEntry);
    }

    updatedEntries.push(newEntry);
  }

  return updatedEntries;
}

export async function deleteTimetableEntry(
  termId: string,
  sectionId: string,
  day: number,
  period: number
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = mockTimetableEntries.findIndex(
    (e) =>
      e.termId === termId &&
      e.sectionId === sectionId &&
      e.day === day &&
      e.period === period
  );

  if (index >= 0) {
    mockTimetableEntries.splice(index, 1);
  }
}

export async function validateTimetable(
  termId: string,
  sectionId?: string
): Promise<TimetableValidationResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // This would call the backend validation endpoint
  // For now, return a mock result
  return {
    isValid: true,
    completeness: {
      totalSlots: 40,
      filledSlots: 32,
      missingTeacher: 2,
      missingRoom: 5,
    },
    subjectHours: [],
    conflicts: [],
  };
}

export async function publishTimetable(
  termId: string,
  sectionId: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update all entries for this section to PUBLISHED
  mockTimetableEntries.forEach((entry) => {
    if (entry.termId === termId && entry.sectionId === sectionId) {
      entry.status = "PUBLISHED";
    }
  });
}

// Helper function to detect conflicts
export function detectConflicts(
  entries: TimetableEntry[],
  sections: Array<{ id: string; nameAr: string; nameEn: string }>,
  teachers: Array<{ id: string; nameAr: string; nameEn: string }>,
  rooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];

  // Group by day and period
  const slots = new Map<string, TimetableEntry[]>();

  entries.forEach((entry) => {
    if (!entry.subjectId) return; // Skip empty slots

    const key = `${entry.day}-${entry.period}`;
    if (!slots.has(key)) {
      slots.set(key, []);
    }
    slots.get(key)!.push(entry);
  });

  // Check for teacher conflicts
  slots.forEach((slotEntries, key) => {
    const [day, period] = key.split("-").map(Number);

    // Group by teacher
    const teacherMap = new Map<string, TimetableEntry[]>();
    slotEntries.forEach((entry) => {
      if (entry.teacherId) {
        if (!teacherMap.has(entry.teacherId)) {
          teacherMap.set(entry.teacherId, []);
        }
        teacherMap.get(entry.teacherId)!.push(entry);
      }
    });

    // Find conflicts (teacher in multiple sections at same time)
    teacherMap.forEach((entries, teacherId) => {
      if (entries.length > 1) {
        const teacher = teachers.find((t) => t.id === teacherId);
        conflicts.push({
          type: "TEACHER",
          day,
          period,
          resourceId: teacherId,
          resourceName: teacher?.nameEn || "Unknown Teacher",
          sections: entries.map((e) => {
            const section = sections.find((s) => s.id === e.sectionId);
            const subject = subjects.find((s) => s.id === e.subjectId);
            return {
              sectionId: e.sectionId,
              sectionName: section?.nameEn || "Unknown Section",
              subjectName: subject?.nameEn || "Unknown Subject",
            };
          }),
        });
      }
    });

    // Group by room
    const roomMap = new Map<string, TimetableEntry[]>();
    slotEntries.forEach((entry) => {
      if (entry.roomId) {
        if (!roomMap.has(entry.roomId)) {
          roomMap.set(entry.roomId, []);
        }
        roomMap.get(entry.roomId)!.push(entry);
      }
    });

    // Find room conflicts
    roomMap.forEach((entries, roomId) => {
      if (entries.length > 1) {
        const room = rooms.find((r) => r.id === roomId);
        conflicts.push({
          type: "ROOM",
          day,
          period,
          resourceId: roomId,
          resourceName: room?.nameEn || "Unknown Room",
          sections: entries.map((e) => {
            const section = sections.find((s) => s.id === e.sectionId);
            const subject = subjects.find((s) => s.id === e.subjectId);
            return {
              sectionId: e.sectionId,
              sectionName: section?.nameEn || "Unknown Section",
              subjectName: subject?.nameEn || "Unknown Subject",
            };
          }),
        });
      }
    });
  });

  return conflicts;
}
