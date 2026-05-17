import ConversationThreadPage from "@/features/communication/pages/ConversationThreadPage";

interface PageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { conversationId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ConversationThreadPage conversationId={conversationId} />
    </main>
  );
}
