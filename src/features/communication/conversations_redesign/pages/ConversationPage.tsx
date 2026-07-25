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
  ConversationFiltersState,
  ConversationFormValues,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";
import CreateConversationDialog from "@/features/communication/components/conversations/CreateConversationDialog";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";

function filterConversations(
  conversations: ConversationListItemModel[],
  filter: ConversationRedesignFilter,
  typeFilter?: string,
) {
  let result = conversations;

  // Type filter
  if (typeFilter) {
    result = result.filter((c) => c.type === typeFilter);
  }

  if (filter === "unread") {
    return result.filter(
      (conversation) => (conversation.unreadCount ?? 0) > 0,
    );
  }

  if (filter === "pinned") {
    return result.filter((conversation) => conversation.isPinned);
  }

  if (filter === "archived" || filter === "closed") {
    return result.filter((conversation) => conversation.status === filter);
  }

  if (filter === "active") {
    return result.filter((conversation) => conversation.status === "active");
  }

  return result;
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
      type: "all",
    });
    // The hook owns its initial fetch; this aligns it with the redesign default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTypeFilter = conversationsState.filters.type ?? "all";
  const typeFilter = selectedTypeFilter === "all" ? "" : selectedTypeFilter;

  const handleBackToList = useCallback(() => {
    setShowMobileThread(false);
    setSelectedConversationId(null);
    userClosedRef.current = true;
  }, []);

  const visibleConversations = useMemo(
    () =>
      filterConversations(conversationsState.conversations, filter, typeFilter),
    [conversationsState.conversations, filter, typeFilter],
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

    // If the currently selected conversation was removed from the visible list
    // (e.g., deleted or filtered out), deselect it. But do NOT auto-select another one.
    if (
      selectedConversationId &&
      !visibleConversations.some((item) => item.id === selectedConversationId)
    ) {
    void Promise.resolve().then(() => setSelectedConversationId(null));
    void Promise.resolve().then(() => setShowMobileThread(false));
    }
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

  const handleTypeFilterChange = (type: string) => {
    conversationsState.setFilters((current) => ({
      ...current,
      type: (type || "all") as ConversationFiltersState["type"],
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
    <main className="relative h-[100dvh] overflow-hidden bg-slate-50 text-slate-950">
      <div className="flex h-full min-h-0">
        <ConversationSidebar
          className={`${showMobileThread ? "hidden" : "flex"} w-full md:flex md:w-[360px] md:shrink-0`}
          conversations={conversationsState.conversations}
          filter={filter}
          typeFilter={typeFilter}
          isLoading={conversationsState.isLoading}
          isRefreshing={conversationsState.isRefreshing}
          onCreateConversation={() => setIsCreateOpen(true)}
          onFilterChange={handleFilterChange}
          onTypeFilterChange={handleTypeFilterChange}
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
          loadMore={conversationsState.loadMore}
          hasMore={conversationsState.hasMore}
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
