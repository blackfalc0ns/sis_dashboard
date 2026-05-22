"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import ConversationSidebar, {
  type ConversationRedesignFilter,
  statusForRedesignFilter,
} from "@/features/communication/conversations_redesign/components/sidebar";
import ConversationDetail from "@/features/communication/conversations_redesign/components/ConversationDetail";
import { EmptyDetail } from "@/features/communication/conversations_redesign/components/PanelLayout";
import { ToastMessage } from "@/features/communication/conversations_redesign/components/ToastMessage";
import { labelsForLocale } from "@/features/communication/conversations_redesign/labels";
import type { ToastState } from "@/features/communication/conversations_redesign/types";
import { createConversationDialogLabels } from "@/features/communication/conversations_redesign/utils/dialogLabels";
import { useConversations } from "@/features/communication/hooks/useConversations";
import type {
  ConversationFormValues,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";
import CreateConversationDialog from "@/features/communication/components/conversations/CreateConversationDialog";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";

function filterConversations(
  conversations: ConversationListItemModel[],
  filter: ConversationRedesignFilter,
) {
  if (filter === "unread") {
    return conversations.filter(
      (conversation) => (conversation.unreadCount ?? 0) > 0,
    );
  }

  if (filter === "pinned") {
    return conversations.filter((conversation) => conversation.isPinned);
  }

  return conversations;
}

export interface ConversationPageProps {
  initialConversationId?: string | null;
}

export default function ConversationPage({
  initialConversationId = null,
}: ConversationPageProps) {
  const locale = useLocale();
  const labels = labelsForLocale(locale);
  const conversationsState = useConversations();
  const initialConversationIdRef = useRef(initialConversationId);
  const userClosedRef = useRef(false);
  const [filter, setFilter] = useState<ConversationRedesignFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(initialConversationId);
  const [showMobileThread, setShowMobileThread] = useState(
    Boolean(initialConversationId),
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    conversationsState.setFilters({
      search: "",
      status: "all",
    });
    // The hook owns its initial fetch; this aligns it with the redesign default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh is handled by the 15s polling interval in useConversations
  // and by the back-navigation handler — no need for aggressive focus refresh

  const handleBackToList = useCallback(() => {
    setShowMobileThread(false);
    setSelectedConversationId(null);
    userClosedRef.current = true;
    // Refresh list when navigating back from a conversation
    void conversationsState.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleConversations = useMemo(
    () => filterConversations(conversationsState.conversations, filter),
    [conversationsState.conversations, filter],
  );

  useEffect(() => {
    if (!initialConversationId) return;
    if (initialConversationIdRef.current === initialConversationId) return;
    initialConversationIdRef.current = initialConversationId;
    setSelectedConversationId(initialConversationId);
    setShowMobileThread(true);
    conversationsState.markAsRead(initialConversationId);
  }, [initialConversationId, conversationsState]);

  useEffect(() => {
    // Don't auto-select if user explicitly closed the conversation
    if (userClosedRef.current) return;

    if (initialConversationId && selectedConversationId === initialConversationId) {
      return;
    }

    if (
      selectedConversationId &&
      visibleConversations.some((item) => item.id === selectedConversationId)
    ) {
      return;
    }
    setSelectedConversationId(visibleConversations[0]?.id ?? null);
  }, [initialConversationId, selectedConversationId, visibleConversations]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    conversationsState.setFilters((current) => ({
      ...current,
      search: value,
    }));
  };

  const handleFilterChange = (nextFilter: ConversationRedesignFilter) => {
    setFilter(nextFilter);
    conversationsState.setFilters((current) => ({
      ...current,
      status: statusForRedesignFilter(nextFilter),
    }));
  };

  const handleCreateConversation = async (values: ConversationFormValues) => {
    try {
      const created = await conversationsState.create(values);
      if (created?.id) {
        setSelectedConversationId(created.id);
        setShowMobileThread(true);
      }
      setIsCreateOpen(false);
      setToast({ tone: "success", message: labels.createConversation });
    } catch (error) {
      setToast({
        tone: "error",
        message: communicationErrorMessage(
          error,
          labels.unableToCreateConversation,
        ),
      });
    }
  };

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-slate-50 text-slate-950 md:min-h-[680px]">
      <div className="flex h-full min-h-0">
        <ConversationSidebar
          className={`${showMobileThread ? "hidden" : "flex"} w-full md:flex md:w-[360px] md:shrink-0`}
          conversations={conversationsState.conversations}
          filter={filter}
          isLoading={conversationsState.isLoading}
          isRefreshing={conversationsState.isRefreshing}
          onCreateConversation={() => setIsCreateOpen(true)}
          onFilterChange={handleFilterChange}
          onRefresh={() => void conversationsState.refresh()}
          onSearchChange={handleSearchChange}
          onSelect={(conversationId) => {
            userClosedRef.current = false;
            setSelectedConversationId(conversationId);
            setShowMobileThread(true);
            conversationsState.markAsRead(conversationId);
          }}
          search={search}
          selectedConversationId={selectedConversationId}
        />

        <section
          className={`${showMobileThread ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}
        >
          {selectedConversationId ? (
            <ConversationDetail
              key={selectedConversationId}
              conversationId={selectedConversationId}
              onBack={handleBackToList}
              labels={labels}
              onToast={setToast}
            />
          ) : (
            <EmptyDetail label={labels.selectConversation} />
          )}
        </section>
      </div>

      {conversationsState.error ? (
        <ToastMessage
          tone="error"
          message={conversationsState.error}
          closeLabel={labels.dismiss}
          onClose={() =>
            conversationsState.setFilters((current) => ({ ...current }))
          }
        />
      ) : null}

      {toast ? (
        <ToastMessage
          tone={toast.tone}
          message={toast.message}
          closeLabel={labels.dismiss}
          onClose={() => setToast(null)}
        />
      ) : null}

      {isCreateOpen ? (
        <CreateConversationDialog
          labels={createConversationDialogLabels(labels)}
          open={isCreateOpen}
          isSubmitting={conversationsState.isMutating}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateConversation}
        />
      ) : null}
    </main>
  );
}

