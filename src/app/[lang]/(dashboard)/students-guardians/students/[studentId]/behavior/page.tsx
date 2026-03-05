import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import BehaviorTab from "@/features/students-guardians/students/components/tabs/BehaviorTab";

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
