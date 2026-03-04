import * as studentsService from "@/services/studentsService";
import NotesTab from "@/components/features/students-guardians/components/tabs/student/NotesTab";

export default async function StudentNotesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <NotesTab student={student} />;
}
