import * as studentsService from "@/services/studentsService";
import EnrollmentHistoryTab from "@/components/features/students-guardians/components/tabs/student/EnrollmentHistoryTab";

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
