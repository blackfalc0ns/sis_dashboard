import ApplicationDetailsPage from "@/components/admissions/pages/ApplicationDetailsPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ApplicationDetailsPage applicationId={id} />;
}
