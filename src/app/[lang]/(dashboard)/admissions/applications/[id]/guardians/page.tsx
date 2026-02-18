"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { mockApplications } from "@/data/mockAdmissions";
import GuardiansTab from "@/components/admissions/application-tabs/GuardiansTab";

export default function ApplicationGuardiansPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const application = useMemo(
    () => mockApplications.find((app) => app.id === applicationId),
    [applicationId],
  );

  if (!application) return null;

  return <GuardiansTab application={application} />;
}
