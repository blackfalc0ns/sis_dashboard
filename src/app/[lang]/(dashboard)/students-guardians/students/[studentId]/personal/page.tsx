"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import PersonalInfoTab from "@/components/features/students-guardians/components/tabs/student/PersonalInfoTab";

export default function StudentPersonalInfoPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <PersonalInfoTab student={student} />;
}
