import ConversationsPage from "@/features/communication/conversations_redesign/pages/ConversationPage";

interface PageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { conversationId } = await params;

  return (
    <main className="min-w-0 overflow-x-hidden">
      <ConversationsPage initialConversationId={conversationId} />
    </main>
  );
}
