import * as studentsService from "@/services/studentsService";
import GuardiansTab from "@/components/features/students-guardians/components/tabs/student/GuardiansTab";

export default async function StudentGuardiansPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <GuardiansTab student={student} />;
}
