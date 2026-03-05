import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import PersonalInfoTab from "@/features/students-guardians/students/components/tabs/PersonalInfoTab";

export default async function StudentPersonalInfoPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <PersonalInfoTab student={student} />;
}
