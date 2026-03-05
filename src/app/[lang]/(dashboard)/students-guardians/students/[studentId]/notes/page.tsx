import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import NotesTab from "@/features/students-guardians/students/components/tabs/NotesTab";

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
