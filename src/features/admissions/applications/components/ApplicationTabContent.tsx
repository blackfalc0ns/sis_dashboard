"use client";

import { useEffect, useState } from "react";
import type { Application } from "@/features/admissions/types/admissions";
import { fetchApplicationById } from "@/features/admissions/applications/services/applicationsApiService";
import DetailsTab from "@/features/admissions/applications/components/tabs/DetailsTab";
import GuardiansTab from "@/features/admissions/applications/components/tabs/GuardiansTab";
import DocumentsTab from "@/features/admissions/applications/components/tabs/DocumentsTab";
import TestsTab from "@/features/admissions/applications/components/tabs/TestsTab";
import InterviewsTab from "@/features/admissions/applications/components/tabs/InterviewsTab";
import TimelineTab from "@/features/admissions/applications/components/tabs/TimelineTab";

type ApplicationTab =
  | "details"
  | "guardians"
  | "documents"
  | "tests"
  | "interviews"
  | "timeline";

interface ApplicationTabContentProps {
  applicationId: string;
  tab: ApplicationTab;
}

export default function ApplicationTabContent({
  applicationId,
  tab,
}: ApplicationTabContentProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchApplicationById(applicationId)
      .then((nextApplication) => {
        if (!cancelled) setApplication(nextApplication);
      })
      .catch((error) => {
        console.error("Failed to load application tab:", error);
        if (!cancelled) setApplication(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading application...</p>;
  }

  if (!application) {
    return <p className="text-sm text-gray-500">Application not found</p>;
  }

  if (tab === "details") return <DetailsTab application={application} />;
  if (tab === "guardians") return <GuardiansTab application={application} />;
  if (tab === "documents") return <DocumentsTab application={application} />;
  if (tab === "tests") {
    return <TestsTab application={application} onScheduleTest={() => {}} />;
  }
  if (tab === "interviews") {
    return (
      <InterviewsTab
        application={application}
        onScheduleInterview={() => {}}
      />
    );
  }
  return <TimelineTab application={application} />;
}
