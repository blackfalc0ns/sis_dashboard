import InterviewDetailsPage from "@/components/features/admissions/components/pages/InterviewDetailsPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <InterviewDetailsPage interviewId={id} />;
}
