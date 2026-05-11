import ApplicationTabContent from "@/features/admissions/applications/components/ApplicationTabContent";

export default async function ApplicationTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationTabContent applicationId={id} tab="timeline" />;
}
