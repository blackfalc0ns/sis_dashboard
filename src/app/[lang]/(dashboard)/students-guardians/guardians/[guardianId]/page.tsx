// FILE: src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/page.tsx

import OverviewTab from "@/components/students-guardians/guardian-tabs/OverviewTab";
import * as studentsService from "@/services/studentsService";
import { notFound } from "next/navigation";

interface GuardianProfilePageProps {
  params: Promise<{
    guardianId: string;
    lang: string;
  }>;
}

export default async function GuardianProfile({
  params,
}: GuardianProfilePageProps) {
  const { guardianId } = await params;
  const guardian = studentsService
    .getAllGuardians()
    .find((g) => g.guardianId === guardianId);

  if (!guardian) {
    notFound();
  }

  return <OverviewTab guardian={guardian} />;
}
