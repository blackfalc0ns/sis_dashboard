"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { mockApplications } from "@/data/mockAdmissions";
import InterviewsTab from "@/components/features/admissions/components/tabs/InterviewsTab";

export default function ApplicationInterviewsPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const application = useMemo(
    () => mockApplications.find((app) => app.id === applicationId),
    [applicationId],
  );

  if (!application) return null;

  return (
    <InterviewsTab application={application} onScheduleInterview={() => {}} />
  );
}
