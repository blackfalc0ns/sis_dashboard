"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import AttendanceTab from "@/components/students-guardians/profile-tabs/AttendanceTab";

export default function StudentAttendancePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <AttendanceTab student={student} />;
}
