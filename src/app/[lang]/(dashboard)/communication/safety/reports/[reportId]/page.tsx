import MessageReportDetailsPage from "@/features/communication/pages/MessageReportDetailsPage";

interface PageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { reportId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <MessageReportDetailsPage reportId={reportId} />
    </main>
  );
}
