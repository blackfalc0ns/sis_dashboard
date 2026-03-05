import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import GuardiansTab from "@/features/students-guardians/students/components/tabs/GuardiansTab";

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
