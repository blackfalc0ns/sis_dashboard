import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import GradesTab from "@/features/students-guardians/students/components/tabs/GradesTab";

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
