"use client";

import { useEffect, useState } from "react";
import { mockApplications } from "@/data/mockAdmissions";
import InterviewsTab from "@/features/admissions/applications/components/tabs/InterviewsTab";
import ScheduleInterviewModal from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import type { Application } from "@/features/admissions/types/admissions";

export default function ApplicationInterviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [application, setApplication] = useState<Application | null>(null);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      const app = mockApplications.find((app) => app.id === id);
      setApplication(app || null);
    });
  }, [params]);

  if (!application) return null;

  return (
    <>
      <InterviewsTab
        application={application}
        onScheduleInterview={() => setIsScheduleInterviewOpen(true)}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        onSubmit={(data) => {
          console.log("Schedule interview:", data);
          setIsScheduleInterviewOpen(false);
        }}
        studentName={application.studentName}
        guardianName={application.guardianName}
        guardianPhone={application.guardianPhone}
      />
    </>
  );
}
