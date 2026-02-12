// FILE: src/app/[lang]/students-guardians/students/[studentId]/page.tsx

"use client";

import { useParams } from "next/navigation";
import StudentProfilePage from "@/components/students-guardians/StudentProfilePage";
import SideBarTopNav from "@/components/layout/SideBarTopNav";

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.studentId as string;

  return (
    <SideBarTopNav>
      <StudentProfilePage studentId={studentId} />
    </SideBarTopNav>
  );
}
