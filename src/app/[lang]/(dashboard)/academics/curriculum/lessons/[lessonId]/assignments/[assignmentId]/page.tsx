import AssignmentBuilderPage from "@/features/academics/curriculum/pages/AssignmentBuilderPage";

interface PageProps {
  params: Promise<{
    lessonId: string;
    assignmentId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { lessonId, assignmentId } = await params;
  return <AssignmentBuilderPage lessonId={lessonId} assignmentId={assignmentId} />;
}
