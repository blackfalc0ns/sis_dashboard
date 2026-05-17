import AnnouncementDetailsPage from "@/features/communication/pages/AnnouncementDetailsPage";

interface PageProps {
  params: Promise<{
    announcementId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { announcementId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <AnnouncementDetailsPage announcementId={announcementId} />
    </main>
  );
}
