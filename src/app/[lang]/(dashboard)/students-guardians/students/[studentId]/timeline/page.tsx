"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import TimelineTab from "@/components/students-guardians/profile-tabs/TimelineTab";

export default function StudentTimelinePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <TimelineTab student={student} />;
}
