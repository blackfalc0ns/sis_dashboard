// FILE: src/data/mockStudents.ts
// Re-export from linked mock data for backward compatibility

export {
  mockStudents,
  mockStudentGuardians,
  mockStudentGuardianLinks,
  mockStudentDocuments,
  mockStudentMedicalProfiles,
  mockStudentNotes,
  mockStudentTimelineEvents,
} from "./mockDataLinked";

// Re-export ERP data
export {
  mockStudentEnrollments,
  mockEnrollmentMovements,
  getEnrollmentByStudentId,
  getEnrollmentByStudentIdAndAcademicYear,
  getEnrollmentsByStudentId,
  getEnrollmentsByGrade,
  getEnrollmentsBySection,
  getEnrollmentsBySectionId,
  getEnrollmentsByClassroomId,
  getEnrollmentClassroom,
  getEnrollmentMovementsByStudentId,
  upsertStudentEnrollment,
} from "./mockEnrollments";

export {
  mockEnrollmentTerms,
  getTermsByEnrollmentId,
  getCurrentTerm,
  getLatestTerm,
  getYearToDateAverages,
} from "./mockTerms";

export {
  mockClassTeacherAssignments,
  mockSubjectTeacherAssignments,
  getClassTeacher,
  getSubjectTeachers,
  getSubjectTeacher,
} from "./mockTeacherAssignments";
