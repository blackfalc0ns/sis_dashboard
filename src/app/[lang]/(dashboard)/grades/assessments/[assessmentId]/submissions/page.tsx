import AssessmentSubmissionsPage from "@/features/grades/submissions/pages/AssessmentSubmissionsPage";

export default async function Page({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  return <AssessmentSubmissionsPage assessmentId={assessmentId} />;
}
