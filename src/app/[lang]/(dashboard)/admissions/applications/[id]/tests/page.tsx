import { mockApplications } from "@/data/mockAdmissions";
import TestsTab from "@/components/features/admissions/components/tabs/TestsTab";

export default async function ApplicationTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = mockApplications.find((app) => app.id === id);

  if (!application) return null;

  return <TestsTab application={application} onScheduleTest={() => {}} />;
}
