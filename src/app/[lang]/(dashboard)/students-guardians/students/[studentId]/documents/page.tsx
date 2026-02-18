"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import DocumentsTab from "@/components/students-guardians/profile-tabs/DocumentsTab";

export default function StudentDocumentsPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <DocumentsTab student={student} />;
}
