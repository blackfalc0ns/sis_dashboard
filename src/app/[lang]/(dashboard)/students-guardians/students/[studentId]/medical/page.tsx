import * as studentsService from "@/services/studentsService";
import MedicalTab from "@/components/features/students-guardians/components/tabs/student/MedicalTab";

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
