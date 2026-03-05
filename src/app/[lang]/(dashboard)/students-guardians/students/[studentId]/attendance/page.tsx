import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import AttendanceTab from "@/features/students-guardians/students/components/tabs/AttendanceTab";

export default async function StudentAttendancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  console.log("studentId", studentId);
  const student = studentsService.getStudentById(studentId);
  if (!student) return null;
  return <AttendanceTab student={student} />;
}
