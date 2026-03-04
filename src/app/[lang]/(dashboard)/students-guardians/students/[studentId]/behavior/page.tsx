import * as studentsService from "@/services/studentsService";
import BehaviorTab from "@/components/features/students-guardians/components/tabs/student/BehaviorTab";

export default async function StudentBehaviorPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <BehaviorTab student={student} />;
}
