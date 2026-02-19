"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { mockApplications } from "@/data/mockAdmissions";
import TestsTab from "@/components/features/admissions/components/tabs/TestsTab";

export default function ApplicationTestsPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const application = useMemo(
    () => mockApplications.find((app) => app.id === applicationId),
    [applicationId],
  );

  if (!application) return null;

  return <TestsTab application={application} onScheduleTest={() => {}} />;
}
