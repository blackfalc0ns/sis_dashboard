"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { mockApplications } from "@/data/mockAdmissions";
import TimelineTab from "@/components/features/admissions/components/tabs/TimelineTab";

export default function ApplicationTimelinePage() {
  const params = useParams();
  const applicationId = params.id as string;

  const application = useMemo(
    () => mockApplications.find((app) => app.id === applicationId),
    [applicationId],
  );

  if (!application) return null;

  return <TimelineTab application={application} />;
}
