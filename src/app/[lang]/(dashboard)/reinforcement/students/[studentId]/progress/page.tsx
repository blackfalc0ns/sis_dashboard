import StudentReinforcementProgressPage from "@/features/reinforcement/pages/StudentReinforcementProgressPage";

interface PageProps {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { studentId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <StudentReinforcementProgressPage studentId={studentId} />
    </main>
  );
}
