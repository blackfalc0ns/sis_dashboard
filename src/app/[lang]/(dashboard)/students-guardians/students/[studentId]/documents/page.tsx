import * as studentsService from "@/services/studentsService";
import DocumentsTab from "@/components/features/students-guardians/components/tabs/student/DocumentsTab";

export default async function StudentDocumentsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <DocumentsTab student={student} />;
}
