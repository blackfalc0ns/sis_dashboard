import * as studentsService from "@/services/studentsService";
import PersonalInfoTab from "@/components/features/students-guardians/components/tabs/student/PersonalInfoTab";

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
