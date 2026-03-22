import { mockApplications } from "@/data/mockAdmissions";
import { DetailsTab } from "@/features/admissions";

export default async function ApplicationTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = mockApplications.find((app) => app.id === id);

  if (!application) return null;

  return <DetailsTab application={application} />;
}
