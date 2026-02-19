"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import OverviewTab from "@/components/features/students-guardians/components/tabs/student/OverviewTab";

export default function StudentOverviewPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const student = useMemo(() => {
    return studentsService.getStudentById(studentId);
  }, [studentId]);

  if (!student) {
    return null;
  }

  return <OverviewTab student={student} />;
}
