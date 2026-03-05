import InterviewDetailsPage from "@/features/admissions/interviews/pages/InterviewDetailsPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <InterviewDetailsPage interviewId={id} />;
}
