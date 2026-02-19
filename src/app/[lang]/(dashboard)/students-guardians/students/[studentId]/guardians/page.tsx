"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import GuardiansTab from "@/components/features/students-guardians/components/tabs/student/GuardiansTab";

export default function StudentGuardiansPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <GuardiansTab student={student} />;
}
