import { mockApplications } from "@/data/mockAdmissions";
import DocumentsTab from "@/features/admissions/applications/components/tabs/DocumentsTab";

export default async function ApplicationDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = mockApplications.find((app) => app.id === id);

  if (!application) return null;

  return <DocumentsTab application={application} />;
}
