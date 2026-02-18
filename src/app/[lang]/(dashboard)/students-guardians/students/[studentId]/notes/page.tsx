"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import * as studentsService from "@/services/studentsService";
import NotesTab from "@/components/students-guardians/profile-tabs/NotesTab";

export default function StudentNotesPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const student = useMemo(
    () => studentsService.getStudentById(studentId),
    [studentId],
  );
  if (!student) return null;
  return <NotesTab student={student} />;
}
