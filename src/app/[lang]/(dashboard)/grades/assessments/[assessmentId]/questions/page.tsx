import AssessmentQuestionsPage from "@/features/grades/assessments/pages/AssessmentQuestionsPage";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { assessmentId } = await params;
  return <AssessmentQuestionsPage assessmentId={assessmentId} mode="edit" />;
}
