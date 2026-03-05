"use client";

import { useEffect, useState } from "react";
import { mockApplications } from "@/data/mockAdmissions";
import InterviewsTab from "@/features/admissions/applications/components/tabs/InterviewsTab";
import type { Application } from "@/features/admissions/types/admissions";

export default function ApplicationInterviewsPage({
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

  return (
    <InterviewsTab application={application} />
  );
}
