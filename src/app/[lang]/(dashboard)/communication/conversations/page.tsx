import ConversationsPage from "@/features/communication/conversations_redesign/pages/ConversationPage";

interface PageProps {
  searchParams?: Promise<{
    conversationId?: string | string[];
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const conversationIdParam = params?.conversationId;
  const conversationId = Array.isArray(conversationIdParam)
    ? conversationIdParam[0]
    : conversationIdParam;

  return (
    <main className="min-w-0 overflow-x-hidden h-screen">
      <ConversationsPage initialConversationId={conversationId ?? null} />
    </main>
  );
}
