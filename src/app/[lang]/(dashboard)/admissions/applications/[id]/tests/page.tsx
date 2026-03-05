"use client";

import { useEffect, useState } from "react";
import { mockApplications } from "@/data/mockAdmissions";
import TestsTab from "@/features/admissions/applications/components/tabs/TestsTab";
import type { Application } from "@/features/admissions/types/admissions";

export default function ApplicationTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      const app = mockApplications.find((app) => app.id === id);
      setApplication(app || null);
    });
  }, [params]);

  if (!application) return null;

  return <TestsTab application={application} onScheduleTest={() => {}} />;
}
