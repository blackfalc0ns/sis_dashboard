// FILE: src/types/students/note.ts
// Student note model

/**
 * Note Category
 * Categories for student notes
 */
export type NoteCategory = "academic" | "behavioral" | "medical" | "general";

/**
 * Note Visibility
 * Who can see the note
 */
export type NoteVisibility = "visible_to_guardian" | "internal";

/**
 * Student Note
 * Represents a note or observation about a student
 */
export interface StudentNote {
  id: string; // Note ID
  studentId: string; // Student this note belongs to
  date: string; // When the note was created (ISO date string)
  category: NoteCategory; // Note category
  note: string; // Note content
  xpAdjustment: number; // Signed XP delta attached to the note
  visibility: NoteVisibility; // Who can see this note
  created_by: string; // Who created the note (teacher/staff name)
}

export interface CreateStudentNotePayload {
  category: NoteCategory;
  note: string;
  xpAdjustment: number;
  visibility: NoteVisibility;
  created_by: string;
}

export interface StudentXpEvent {
  id: string;
  studentId: string;
  date: string;
  category: NoteCategory;
  points: number;
  note: string;
  visibility: NoteVisibility;
  created_by: string;
}

export interface StudentXpSummary {
  totalXp: number;
  recentXp: number;
  weeklyXpDelta: number;
  positiveNotesCount: number;
  negativeNotesCount: number;
  totalNotesCount: number;
  positivePointsTotal: number;
  negativePointsTotal: number;
}

// Backward compatibility alias
export type StudentNoteMock = StudentNote;
