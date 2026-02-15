// FILE: src/types/index.ts
// Main type exports for the application

// Admissions Module
export * from "./admissions";

// Students Module (with renamed exports to avoid conflicts)
export type {
  StudentStatus,
  RiskFlag,
  TimelineEventType,
  Student,
  StudentContact,
  StudentMock,
  StudentGuardian,
  StudentGuardianLink,
  StudentGuardianMock,
  StudentGuardianLinkMock,
  StudentDocument,
  StudentDocumentMock,
  StudentMedicalProfile,
  StudentMedicalProfileMock,
  StudentTimelineEvent,
  StudentTimelineEventMock,
} from "./students";

// Re-export DocumentStatus from students with alias to avoid conflict
export type { DocumentStatus as StudentDocumentStatus } from "./students";

// Notifications Module
export * from "./notifications";

// Note: For better tree-shaking and explicit imports, prefer importing from specific modules:
// import type { Application } from "@/types/admissions";
// import type { Student } from "@/types/students";
// import type { Notification } from "@/types/notifications";
