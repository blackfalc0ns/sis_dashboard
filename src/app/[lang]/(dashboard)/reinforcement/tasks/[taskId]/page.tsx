import ReinforcementTaskDetailPage from "@/features/reinforcement/pages/ReinforcementTaskDetailPage";

interface PageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { taskId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ReinforcementTaskDetailPage taskId={taskId} />
    </main>
  );
}
