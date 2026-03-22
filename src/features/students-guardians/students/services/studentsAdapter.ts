import type {
  Student,
  StudentDocument,
  StudentGuardian,
  StudentStatus,
  UpdateStudentPayload,
} from "@/features/students-guardians/students/types";
import type { StudentWithEnrollmentContext } from "@/features/students-guardians/students/services/studentsService";

export interface StudentsAdapter {
  getAllStudents(): Student[];
  getStudentById(id: string): Student | undefined;
  updateStudent(studentId: string, payload: UpdateStudentPayload): Promise<Student>;
  getStudentsByStatus(status: StudentStatus): Student[];
  getStudentsByGrade(grade: string): Student[];
  getAtRiskStudents(): Student[];
  searchStudents(query: string): Student[];
  getStudentGuardians(studentId: string): StudentGuardian[];
  getPrimaryGuardian(studentId: string): StudentGuardian | undefined;
  getGuardianStudents(guardianId: string): Student[];
  getAllGuardians(): StudentGuardian[];
  getGuardianById(guardianId: string): StudentGuardian | undefined;
  getStudentDocuments(studentId: string): StudentDocument[];
  getMissingDocuments(studentId: string): StudentDocument[];
  getStudentsWithEnrollment(): StudentWithEnrollmentContext[];
  getStudentsWithEnrollmentForContext(
    academicYearId?: string | null,
    termId?: string | null,
  ): StudentWithEnrollmentContext[];
  fetchAllGuardians?(): Promise<StudentGuardian[]>;
  fetchAllStudents?(): Promise<Student[]>;
  fetchStudentById?(id: string): Promise<Student | undefined>;
  fetchStudentGuardians?(studentId: string): Promise<StudentGuardian[]>;
  fetchPrimaryGuardian?(studentId: string): Promise<StudentGuardian | undefined>;
  fetchGuardianStudents?(guardianId: string): Promise<Student[]>;
  fetchGuardianById?(guardianId: string): Promise<StudentGuardian | undefined>;
  fetchStudentsWithEnrollment?(): Promise<StudentWithEnrollmentContext[]>;
  fetchStudentsWithEnrollmentForContext?(
    academicYearId?: string | null,
    termId?: string | null,
  ): Promise<StudentWithEnrollmentContext[]>;
}
