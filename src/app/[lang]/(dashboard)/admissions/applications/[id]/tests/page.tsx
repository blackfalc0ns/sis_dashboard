import ApplicationTabContent from "@/features/admissions/applications/components/ApplicationTabContent";

export default async function ApplicationTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationTabContent applicationId={id} tab="tests" />;
}
