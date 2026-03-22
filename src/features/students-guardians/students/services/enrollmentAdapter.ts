import type {
  EnrollmentMovement,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import type {
  BulkAssignStudentsPayload,
  BulkAssignStudentsResult,
  EnrollmentPlacementPayload,
  EnrollmentPlacementValidationResult,
  PromoteStudentEnrollmentPayload,
  TransferStudentPayload,
  WithdrawStudentPayload,
} from "@/features/students-guardians/students/services/enrollmentService";

export interface EnrollmentAdapter {
  validateEnrollmentPlacement(
    payload: EnrollmentPlacementPayload,
    options?: { excludeStudentId?: string; skipCapacityCheck?: boolean },
  ): EnrollmentPlacementValidationResult;
  createEnrollment(payload: EnrollmentPlacementPayload): Promise<StudentEnrollment>;
  updateEnrollment(
    enrollmentId: string,
    payload: Partial<EnrollmentPlacementPayload> & { status?: StudentEnrollment["status"] },
  ): Promise<StudentEnrollment>;
  upsertEnrollment(payload: EnrollmentPlacementPayload): Promise<StudentEnrollment>;
  getCurrentActiveEnrollment(
    studentId: string,
    academicYear?: string,
  ): StudentEnrollment | undefined;
  getEnrollmentHistory(studentId: string): StudentEnrollment[];
  getPlacementHistory(studentId: string): EnrollmentMovement[];
  transferStudent(payload: TransferStudentPayload): Promise<StudentEnrollment>;
  withdrawStudent(payload: WithdrawStudentPayload): Promise<StudentEnrollment>;
  promoteStudentEnrollment(
    payload: PromoteStudentEnrollmentPayload,
  ): Promise<StudentEnrollment>;
  bulkAssignStudentsToClassrooms(
    payload: BulkAssignStudentsPayload,
  ): Promise<BulkAssignStudentsResult>;
  promoteActiveStudentsToAcademicYear(
    targetAcademicYear: string,
    effectiveDate: string,
  ): Promise<StudentEnrollment[]>;
  getAcademicYearOptions(): Promise<string[]>;
}
