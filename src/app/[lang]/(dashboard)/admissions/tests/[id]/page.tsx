import TestDetailsPage from "@/features/admissions/tests/pages/TestDetailsPage";

interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function TestDetailsRoute({ params }: PageProps) {
  const { id } = await params;
  return <TestDetailsPage testId={id} />;
}
