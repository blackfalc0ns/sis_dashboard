import { mockApplications } from "@/data/mockAdmissions";
import GuardiansTab from "@/features/admissions/applications/components/tabs/GuardiansTab";

export default async function ApplicationGuardiansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = mockApplications.find((app) => app.id === id);

  if (!application) return null;

  return <GuardiansTab application={application} />;
}
