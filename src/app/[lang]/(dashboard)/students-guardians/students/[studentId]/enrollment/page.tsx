"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import EnrollmentHistoryTab from "@/components/features/students-guardians/components/tabs/student/EnrollmentHistoryTab";

export default function StudentEnrollmentHistoryPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <EnrollmentHistoryTab student={student} />;
}
