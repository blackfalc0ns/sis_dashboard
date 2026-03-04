import { mockApplications } from "@/data/mockAdmissions";
import TimelineTab from "@/components/features/admissions/components/tabs/TimelineTab";

export default async function ApplicationTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = mockApplications.find((app) => app.id === id);

  if (!application) return null;

  return <TimelineTab application={application} />;
}
