import ClassroomReinforcementSummaryPage from "@/features/reinforcement/pages/ClassroomReinforcementSummaryPage";

interface PageProps {
  params: Promise<{
    classroomId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { classroomId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ClassroomReinforcementSummaryPage classroomId={classroomId} />
    </main>
  );
}
