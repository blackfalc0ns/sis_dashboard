"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import BehaviorTab from "@/components/features/students-guardians/components/tabs/student/BehaviorTab";

export default function StudentBehaviorPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <BehaviorTab student={student} />;
}
