"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import WithdrawalTab from "@/components/students-guardians/profile-tabs/WithdrawalTab";

export default function StudentWithdrawalPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <WithdrawalTab student={student} />;
}
