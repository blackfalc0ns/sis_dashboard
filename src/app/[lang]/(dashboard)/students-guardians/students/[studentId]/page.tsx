import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import OverviewTab from "@/features/students-guardians/students/components/tabs/OverviewTab";

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
