import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import TimelineTab from "@/features/students-guardians/students/components/tabs/TimelineTab";

export default async function StudentTimelinePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <TimelineTab student={student} />;
}
