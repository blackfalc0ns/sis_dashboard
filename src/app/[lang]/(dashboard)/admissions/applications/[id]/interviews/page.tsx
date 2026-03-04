import { mockApplications } from "@/data/mockAdmissions";
import InterviewsTab from "@/components/features/admissions/components/tabs/InterviewsTab";

export default async function ApplicationInterviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = mockApplications.find((app) => app.id === id);

  if (!application) return null;

  return (
    <InterviewsTab application={application} onScheduleInterview={() => {}} />
  );
}
