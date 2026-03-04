import * as studentsService from "@/services/studentsService";
import TimelineTab from "@/components/features/students-guardians/components/tabs/student/TimelineTab";

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
