import {
  TimetableEntry,
  TimetableValidationResult,
  TimetableConflict,
} from "@/features/academics/timetable/types/timetable";
import type { TimetableAdapter } from "@/features/academics/timetable/services/timetableAdapter";
import { createTimetableApiAdapter } from "@/features/academics/timetable/services/timetableApiAdapter";

// Helper function to migrate old format to new
function getDayKeyFromIndex(index: number): string {
  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return keys[index] || "sun";
}

// Helper function to migrate entries
function migrateEntry(entry: TimetableEntry): TimetableEntry {
  return {
    ...entry,
    dayKey: entry.dayKey || getDayKeyFromIndex(entry.day ?? 0),
    periodIndex: entry.periodIndex ?? entry.period ?? 1,
  };
}

// Mock data for development
const mockTimetableEntries: TimetableEntry[] = [];

async function fetchTimetableImpl(
  termId: string,
  sectionId: string,
  classroomId?: string
): Promise<TimetableEntry[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Filter entries for this section and migrate to new format
  const entries = mockTimetableEntries.filter(
    (entry) =>
      entry.termId === termId &&
      entry.sectionId === sectionId &&
      (classroomId ? entry.classroomId === classroomId : !entry.classroomId)
  );

  return entries.map(migrateEntry);
}

async function fetchAllTimetablesForTermImpl(
  termId: string
): Promise<TimetableEntry[]> {
  // Fetch all timetables for conflict detection
  await new Promise((resolve) => setTimeout(resolve, 500));

  const entries = mockTimetableEntries.filter((entry) => entry.termId === termId);
  return entries.map(migrateEntry);
}

async function upsertTimetableEntriesImpl(
  termId: string,
  sectionId: string,
  entries: Partial<TimetableEntry>[],
  classroomId?: string
): Promise<TimetableEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock implementation: update or create entries
  const updatedEntries: TimetableEntry[] = [];

  for (const entry of entries) {
    const existingIndex = mockTimetableEntries.findIndex(
      (e) =>
        e.termId === termId &&
        e.sectionId === sectionId &&
        (e.classroomId || "") === (classroomId || "") &&
        e.dayKey === entry.dayKey &&
        e.periodIndex === entry.periodIndex
    );

    const newEntry: TimetableEntry = {
      id: entry.id || `tt-${Date.now()}-${Math.random()}`,
      termId,
      sectionId,
      classroomId,
      dayKey: entry.dayKey!,
      periodIndex: entry.periodIndex!,
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

async function deleteTimetableEntryImpl(
  termId: string,
  sectionId: string,
  day: number,
  period: number,
  classroomId?: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const dayKey = getDayKeyFromIndex(day);
  const index = mockTimetableEntries.findIndex((entry) => {
    const migrated = migrateEntry(entry);
    return (
      migrated.termId === termId &&
      migrated.sectionId === sectionId &&
      (migrated.classroomId || "") === (classroomId || "") &&
      migrated.dayKey === dayKey &&
      migrated.periodIndex === period
    );
  });

  if (index >= 0) {
    mockTimetableEntries.splice(index, 1);
  }
}

async function validateTimetableImpl(): Promise<TimetableValidationResult> {
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

async function publishTimetableImpl(
  termId: string,
  sectionId: string,
  classroomId?: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update all entries for this section to PUBLISHED
  mockTimetableEntries.forEach((entry) => {
    if (
      entry.termId === termId &&
      entry.sectionId === sectionId &&
      (classroomId ? entry.classroomId === classroomId : !entry.classroomId)
    ) {
      entry.status = "PUBLISHED";
    }
  });
}

async function unpublishTimetableImpl(
  termId: string,
  sectionId: string,
  classroomId?: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update all entries for this section to DRAFT
  mockTimetableEntries.forEach((entry) => {
    if (
      entry.termId === termId &&
      entry.sectionId === sectionId &&
      (classroomId ? entry.classroomId === classroomId : !entry.classroomId)
    ) {
      entry.status = "DRAFT";
    }
  });
}

// Helper function to detect conflicts
function detectConflictsImpl(
  entries: TimetableEntry[],
  sections: Array<{ id: string; nameAr: string; nameEn: string }>,
  classrooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  teachers: Array<{ id: string; nameAr: string; nameEn: string }>,
  rooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];

  // Group by dayKey and periodIndex
  const slots = new Map<string, TimetableEntry[]>();

  entries.forEach((entry) => {
    if (!entry.subjectId) return; // Skip empty slots

    const key = `${entry.dayKey}-${entry.periodIndex}`;
    if (!slots.has(key)) {
      slots.set(key, []);
    }
    slots.get(key)!.push(entry);
  });

  // Check for teacher conflicts
  slots.forEach((slotEntries, key) => {
    const [dayKey, periodIndexStr] = key.split("-");
    const periodIndex = parseInt(periodIndexStr);

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
          dayKey,
          periodIndex,
          resourceId: teacherId,
          resourceName: teacher?.nameEn || "Unknown Teacher",
          sections: entries.map((e) => {
            const section = sections.find((s) => s.id === e.sectionId);
            const classroom = e.classroomId
              ? classrooms.find((item) => item.id === e.classroomId)
              : undefined;
            const subject = subjects.find((s) => s.id === e.subjectId);
            return {
              sectionId: e.sectionId,
              sectionName: section?.nameEn || "Unknown Section",
              classroomId: e.classroomId,
              classroomName: classroom?.nameEn || classroom?.nameAr,
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
          dayKey,
          periodIndex,
          resourceId: roomId,
          resourceName: room?.nameEn || "Unknown Room",
          sections: entries.map((e) => {
            const section = sections.find((s) => s.id === e.sectionId);
            const classroom = e.classroomId
              ? classrooms.find((item) => item.id === e.classroomId)
              : undefined;
            const subject = subjects.find((s) => s.id === e.subjectId);
            return {
              sectionId: e.sectionId,
              sectionName: section?.nameEn || "Unknown Section",
              classroomId: e.classroomId,
              classroomName: classroom?.nameEn || classroom?.nameAr,
              subjectName: subject?.nameEn || "Unknown Subject",
            };
          }),
        });
      }
    });
  });

  return conflicts;
}

const mockTimetableAdapter: TimetableAdapter = {
  fetchTimetable: fetchTimetableImpl,
  fetchAllTimetablesForTerm: fetchAllTimetablesForTermImpl,
  upsertTimetableEntries: upsertTimetableEntriesImpl,
  deleteTimetableEntry: deleteTimetableEntryImpl,
  validateTimetable: validateTimetableImpl,
  publishTimetable: publishTimetableImpl,
  unpublishTimetable: unpublishTimetableImpl,
  detectConflicts: detectConflictsImpl,
};

let timetableAdapter: TimetableAdapter = mockTimetableAdapter;

if (process.env.NEXT_PUBLIC_USE_TIMETABLE_API === "true") {
  timetableAdapter = createTimetableApiAdapter(detectConflictsImpl);
}

export const getTimetableAdapter = (): TimetableAdapter => timetableAdapter;

export const setTimetableAdapter = (adapter: TimetableAdapter) => {
  timetableAdapter = adapter;
};

export const resetTimetableAdapter = () => {
  timetableAdapter =
    process.env.NEXT_PUBLIC_USE_TIMETABLE_API === "true"
      ? createTimetableApiAdapter(detectConflictsImpl)
      : mockTimetableAdapter;
};

export const activateTimetableAdapter = (adapter: TimetableAdapter) => {
  setTimetableAdapter(adapter);
  return adapter;
};

export const fetchTimetable = (
  termId: string,
  sectionId: string,
  classroomId?: string
): Promise<TimetableEntry[]> =>
  timetableAdapter.fetchTimetable(termId, sectionId, classroomId);

export const fetchAllTimetablesForTerm = (
  termId: string
): Promise<TimetableEntry[]> => timetableAdapter.fetchAllTimetablesForTerm(termId);

export const upsertTimetableEntries = (
  termId: string,
  sectionId: string,
  entries: Partial<TimetableEntry>[],
  classroomId?: string
): Promise<TimetableEntry[]> =>
  timetableAdapter.upsertTimetableEntries(termId, sectionId, entries, classroomId);

export const deleteTimetableEntry = (
  termId: string,
  sectionId: string,
  day: number,
  period: number,
  classroomId?: string
): Promise<void> =>
  timetableAdapter.deleteTimetableEntry(termId, sectionId, day, period, classroomId);

export const validateTimetable = (): Promise<TimetableValidationResult> =>
  timetableAdapter.validateTimetable();

export const publishTimetable = (
  termId: string,
  sectionId: string,
  classroomId?: string
): Promise<void> => timetableAdapter.publishTimetable(termId, sectionId, classroomId);

export const unpublishTimetable = (
  termId: string,
  sectionId: string,
  classroomId?: string
): Promise<void> => timetableAdapter.unpublishTimetable(termId, sectionId, classroomId);

export const detectConflicts = (
  entries: TimetableEntry[],
  sections: Array<{ id: string; nameAr: string; nameEn: string }>,
  classrooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  teachers: Array<{ id: string; nameAr: string; nameEn: string }>,
  rooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>
): TimetableConflict[] =>
  timetableAdapter.detectConflicts(entries, sections, classrooms, teachers, rooms, subjects);
