import GradeSubmissionPage from "@/features/grades/submissions/pages/GradeSubmissionPage";

export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return <GradeSubmissionPage submissionId={submissionId} />;
}
