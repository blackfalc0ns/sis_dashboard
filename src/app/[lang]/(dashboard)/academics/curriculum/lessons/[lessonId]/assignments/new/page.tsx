import AssignmentBuilderPage from "@/features/academics/curriculum/pages/AssignmentBuilderPage";

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { lessonId } = await params;
  return <AssignmentBuilderPage lessonId={lessonId} />;
}
