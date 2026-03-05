import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import DocumentsTab from "@/features/students-guardians/students/components/tabs/DocumentsTab";

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
