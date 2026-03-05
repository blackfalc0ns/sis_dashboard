// FILE: src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/students/page.tsx

import StudentsTab from "@/features/students-guardians/guardians/components/tabs/StudentsTab";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { notFound } from "next/navigation";

interface GuardianStudentsPageProps {
  params: Promise<{
    guardianId: string;
    lang: string;
  }>;
}

export default async function GuardianStudentsPage({
  params,
}: GuardianStudentsPageProps) {
  const { guardianId } = await params;
  const guardian = studentsService
    .getAllGuardians()
    .find((g) => g.guardianId === guardianId);

  if (!guardian) {
    notFound();
  }

  return <StudentsTab guardian={guardian} />;
}
