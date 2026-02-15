// FILE: src/types/students/index.ts
// Main exports for students module

// ============================================================================
// ENUMS & STATUS TYPES
// ============================================================================
export type {
  StudentStatus,
  RiskFlag,
  DocumentStatus,
  TimelineEventType,
} from "./enums";

// ============================================================================
// MODELS
// ============================================================================

// Student
export type { Student, StudentContact, StudentMock } from "./student";

// Guardian
export type {
  StudentGuardian,
  StudentGuardianLink,
  StudentGuardianMock,
  StudentGuardianLinkMock,
} from "./guardian";

// Document
export type { StudentDocument, StudentDocumentMock } from "./document";

// Medical
export type {
  StudentMedicalProfile,
  StudentMedicalProfileMock,
} from "./medical";

// Note
export type {
  StudentNote,
  StudentNoteMock,
  NoteCategory,
  NoteVisibility,
} from "./note";

// Timeline
export type {
  StudentTimelineEvent,
  StudentTimelineEventMock,
} from "./timeline";

// Enrollment (ERP)
export type {
  StudentEnrollment,
  EnrollmentTerm,
  ClassTeacherAssignment,
  SubjectTeacherAssignment,
} from "./enrollment";
