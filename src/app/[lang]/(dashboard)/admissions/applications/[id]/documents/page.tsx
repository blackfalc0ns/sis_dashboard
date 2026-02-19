"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { mockApplications } from "@/data/mockAdmissions";
import DocumentsTab from "@/components/features/admissions/components/tabs/DocumentsTab";

export default function ApplicationDocumentsPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const application = useMemo(
    () => mockApplications.find((app) => app.id === applicationId),
    [applicationId],
  );

  if (!application) return null;

  return <DocumentsTab application={application} />;
}
