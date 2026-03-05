import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import EnrollmentHistoryTab from "@/features/students-guardians/students/components/tabs/EnrollmentHistoryTab";

export default async function StudentEnrollmentHistoryPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <EnrollmentHistoryTab student={student} />;
}
