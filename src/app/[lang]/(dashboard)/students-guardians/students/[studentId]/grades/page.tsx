import * as studentsService from "@/services/studentsService";
import GradesTab from "@/components/features/students-guardians/components/tabs/student/GradesTab";

export default async function StudentGradesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <GradesTab student={student} />;
}
