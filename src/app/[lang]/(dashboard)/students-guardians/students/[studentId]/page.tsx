import * as studentsService from "@/services/studentsService";
import OverviewTab from "@/components/features/students-guardians/components/tabs/student/OverviewTab";

export default async function StudentOverviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);

  if (!student) {
    return null;
  }

  return <OverviewTab student={student} />;
}
