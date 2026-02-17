import TestDetailsPage from "@/components/admissions/pages/TestDetailsPage";

interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function TestDetailsRoute({ params }: PageProps) {
  const { id } = await params;
  return <TestDetailsPage testId={id} />;
}
