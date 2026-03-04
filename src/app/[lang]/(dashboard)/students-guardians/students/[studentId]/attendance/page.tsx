import * as studentsService from "@/services/studentsService";
import AttendanceTab from "@/components/features/students-guardians/components/tabs/student/AttendanceTab";

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
