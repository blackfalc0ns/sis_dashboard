import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import MedicalTab from "@/features/students-guardians/students/components/tabs/MedicalTab";

export default async function StudentMedicalPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <MedicalTab student={student} />;
}
