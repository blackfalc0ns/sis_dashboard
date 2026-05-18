"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  Lock,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  UserPlus,
  X,
} from "lucide-react";
import ConversationSidebar, {
  type ConversationDemoFilter,
  statusForDemoFilter,
} from "@/features/communication/conversation_demo/components/sidebar";
import { searchUsers } from "@/features/communication/api/communication-selectors.service";
import type { CommunicationSelectorOption } from "@/features/communication/api/communication-selectors.service";
import { useCommunicationPolicy } from "@/features/communication/hooks/useCommunicationPolicy";
import { useConversation } from "@/features/communication/hooks/useConversation";
import { useConversationInvites } from "@/features/communication/hooks/useConversationInvites";
import type { CreateConversationInviteValues } from "@/features/communication/hooks/useConversationInvites";
import { useConversationJoinRequests } from "@/features/communication/hooks/useConversationJoinRequests";
import type {
  CreateConversationJoinRequestValues,
  ReviewConversationJoinRequestValues,
} from "@/features/communication/hooks/useConversationJoinRequests";
import { useConversationMessages } from "@/features/communication/hooks/useConversationMessages";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import { useConversationParticipants } from "@/features/communication/hooks/useConversationParticipants";
import type { ParticipantFormValues } from "@/features/communication/hooks/useConversationParticipants";
import { useConversationRealtime } from "@/features/communication/hooks/useConversationRealtime";
import { useConversations } from "@/features/communication/hooks/useConversations";
import type {
  ConversationFormValues,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";
import { useMessageAttachments } from "@/features/communication/hooks/useMessageAttachments";
import { useMessageReactions } from "@/features/communication/hooks/useMessageReactions";
import { usePresence } from "@/features/communication/hooks/usePresence";
import { useTypingIndicator } from "@/features/communication/hooks/useTypingIndicator";
import type {
  Conversation,
  ConversationInvite,
  ConversationJoinRequest,
  ConversationParticipant,
  ConversationType,
  ParticipantRole,
} from "@/features/communication/types/conversation.types";
import type {
  CommunicationActor,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  MessageAttachment,
  MessageReaction,
} from "@/features/communication/types/message.types";
import { getConversationPermissionFlags } from "@/features/communication/utils/conversation-permissions";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";
import { useAuth } from "@/hooks/use-auth";

type DetailTab = "messages" | "participants" | "invites" | "joinRequests";

type ToastState = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

const tabs: Array<{ value: DetailTab; label: string }> = [
  { value: "messages", label: "Messages" },
  { value: "participants", label: "Participants" },
  { value: "invites", label: "Invites" },
  { value: "joinRequests", label: "Join Requests" },
];

const conversationTypes: Array<{ value: ConversationType; label: string }> = [
  { value: "direct", label: "Direct" },
  { value: "group", label: "Group" },
  { value: "classroom", label: "Classroom" },
  { value: "school_wide", label: "School Wide" },
  { value: "support", label: "Support" },
];

const fieldInputClass =
  "w-full rounded-lg border border-[#d6e2ef] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-[#8aa0bf] focus:border-[#0288d1] focus:ring-2 focus:ring-[#bfe5fb]";
const modalPrimaryClass =
  "h-10 rounded-lg bg-[#0288d1] px-4 text-sm font-bold text-white transition hover:bg-[#0277bd] disabled:cursor-not-allowed disabled:opacity-60";
const modalSecondaryClass =
  "h-10 rounded-lg border border-[#cbd8e6] bg-white px-4 text-sm font-bold text-[#365a85] transition hover:bg-slate-50";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function actorName(actor?: CommunicationActor | null) {
  return actor?.name || actor?.nameEn || actor?.nameAr || actor?.userId || actor?.id;
}

function getTitle(conversation?: Conversation | ConversationListItemModel | null) {
  if (!conversation) return "Conversation";
  return conversation.titleEn || conversation.title || conversation.titleAr || "Untitled conversation";
}

function getAvatarUrl(value?: Conversation | ConversationListItemModel | CommunicationActor | null) {
  if (!value) return undefined;
  const record = value as CommunicationRecord;
  return (
    stringValue(record.avatarUrl) ||
    stringValue(record.avatar) ||
    stringValue(record.imageUrl) ||
    stringValue(record.photoUrl)
  );
}

function initials(name?: string | null) {
  const source = name?.trim() || "?";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatRelativeDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 3600000));
  if (diffHours < 24) return `about ${diffHours} hours ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 31) return `${diffDays} days ago`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths} months ago`;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFileSize(value?: number) {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function conversationIsReadOnly(conversation?: Conversation | null) {
  if (!conversation) return false;
  const record = conversation as CommunicationRecord;
  return Boolean(record.isReadOnly || record.readOnly || conversation.status === "closed");
}

function participantUserId(participant: ConversationParticipant) {
  return participant.userId || participant.actor?.userId || participant.actor?.id || "";
}

function currentUserName(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return "";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.id;
}

function isOwnMessage(message: ConversationMessage, currentUserId?: string | null) {
  if (!currentUserId) return false;
  const senderUserId = message.sender?.userId || message.sender?.id;
  return message.senderId === currentUserId || senderUserId === currentUserId;
}

function filterConversations(
  conversations: ConversationListItemModel[],
  filter: ConversationDemoFilter,
) {
  if (filter === "unread") {
    return conversations.filter((conversation) => (conversation.unreadCount ?? 0) > 0);
  }

  if (filter === "pinned") {
    return conversations.filter((conversation) => conversation.isPinned);
  }

  return conversations;
}

export default function ConversationPage() {
  const conversationsState = useConversations();
  const [filter, setFilter] = useState<ConversationDemoFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    conversationsState.setFilters({
      search: "",
      status: "all",
    });
    // The hook owns its initial fetch; this aligns it with the demo default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleConversations = useMemo(
    () => filterConversations(conversationsState.conversations, filter),
    [conversationsState.conversations, filter],
  );

  useEffect(() => {
    if (selectedConversationId && visibleConversations.some((item) => item.id === selectedConversationId)) {
      return;
    }
    setSelectedConversationId(visibleConversations[0]?.id ?? null);
  }, [selectedConversationId, visibleConversations]);

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

  const handleFilterChange = (nextFilter: ConversationDemoFilter) => {
    setFilter(nextFilter);
    conversationsState.setFilters((current) => ({
      ...current,
      status: statusForDemoFilter(nextFilter),
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
      setToast({ tone: "success", message: "Conversation created." });
    } catch (error) {
      setToast({
        tone: "error",
        message: communicationErrorMessage(error, "Unable to create conversation."),
      });
    }
  };

  return (
    <main className="relative h-[calc(100vh-92px)] min-h-[680px] overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="flex h-full min-h-0">
        <ConversationSidebar
          className={`${showMobileThread ? "hidden" : "flex"} w-full md:flex md:w-[360px]`}
          conversations={conversationsState.conversations}
          filter={filter}
          isLoading={conversationsState.isLoading}
          isRefreshing={conversationsState.isRefreshing}
          onCreateConversation={() => setIsCreateOpen(true)}
          onFilterChange={handleFilterChange}
          onRefresh={() => void conversationsState.refresh()}
          onSearchChange={handleSearchChange}
          onSelect={(conversationId) => {
            setSelectedConversationId(conversationId);
            setShowMobileThread(true);
          }}
          search={search}
          selectedConversationId={selectedConversationId}
        />

        <section className={`${showMobileThread ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
          {selectedConversationId ? (
            <ConversationDetail
              key={selectedConversationId}
              conversationId={selectedConversationId}
              onBack={() => setShowMobileThread(false)}
              onToast={setToast}
            />
          ) : (
            <EmptyDetail />
          )}
        </section>
      </div>

      {conversationsState.error ? (
        <ToastMessage
          tone="error"
          message={conversationsState.error}
          onClose={() => conversationsState.setFilters((current) => ({ ...current }))}
        />
      ) : null}

      {toast ? (
        <ToastMessage
          tone={toast.tone}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}

      {isCreateOpen ? (
        <CreateConversationModal
          isSubmitting={conversationsState.isMutating}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateConversation}
        />
      ) : null}
    </main>
  );
}

function ConversationDetail({
  conversationId,
  onBack,
  onToast,
}: {
  conversationId: string;
  onBack: () => void;
  onToast: (toast: ToastState) => void;
}) {
  const { user } = useAuth();
  const conversationState = useConversation(conversationId);
  const messagesState = useConversationMessages(conversationId);
  const [activeTab, setActiveTab] = useState<DetailTab>("messages");
  const [loadedTabs, setLoadedTabs] = useState<Record<DetailTab, boolean>>({
    messages: true,
    participants: false,
    invites: false,
    joinRequests: false,
  });
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinRequestOpen, setIsJoinRequestOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<ConversationJoinRequest | null>(null);

  const shouldLoadParticipants =
    loadedTabs.participants || loadedTabs.invites || loadedTabs.joinRequests;
  const participantsState = useConversationParticipants(conversationId, {
    enabled: shouldLoadParticipants,
  });
  const invitesState = useConversationInvites(conversationId, {
    enabled: loadedTabs.invites,
  });
  const joinRequestsState = useConversationJoinRequests(conversationId, {
    enabled: loadedTabs.joinRequests,
  });
  const presenceState = usePresence();
  const typingState = useTypingIndicator(conversationId);
  const { policy } = useCommunicationPolicy();

  const messageIds = useMemo(
    () =>
      messagesState.messages
        .filter((message) => message.id && message.deliveryStatus !== "pending")
        .map((message) => message.id),
    [messagesState.messages],
  );
  const reactionsState = useMessageReactions(messageIds);
  const attachmentsState = useMessageAttachments(messageIds, policy?.maxAttachmentSizeMb);

  const permissions = useMemo(
    () =>
      getConversationPermissionFlags({
        conversation: conversationState.conversation,
        currentUserId: user?.id,
        participants: participantsState.participants,
      }),
    [conversationState.conversation, participantsState.participants, user?.id],
  );

  const refreshAll = useCallback(() => {
    void conversationState.refresh();
    void messagesState.refresh();
    if (shouldLoadParticipants) void participantsState.refresh();
    if (loadedTabs.invites) void invitesState.refresh();
    if (loadedTabs.joinRequests) void joinRequestsState.refresh();
    void reactionsState.refreshAll();
    void attachmentsState.refreshAll();
  }, [
    attachmentsState,
    conversationState,
    invitesState,
    joinRequestsState,
    loadedTabs.invites,
    loadedTabs.joinRequests,
    messagesState,
    participantsState,
    reactionsState,
    shouldLoadParticipants,
  ]);

  useConversationRealtime({
    conversationId,
    onMessageCreated: messagesState.upsertFromRealtime,
    onMessageDeleted: messagesState.deleteFromRealtime,
    onMessageRead: messagesState.patchReadFromRealtime,
    onMessageUpdated: messagesState.patchFromRealtime,
    onPresenceUpdated: presenceState.handlePresenceUpdated,
    onReconnect: refreshAll,
    onTypingStarted: typingState.handleTypingStarted,
    onTypingStopped: typingState.handleTypingStopped,
  });

  useEffect(() => {
    const latestReadable = [...messagesState.messages]
      .reverse()
      .find((message) => message.senderId !== user?.id && message.id);
    if (latestReadable) void messagesState.markRead(latestReadable.id);
  }, [messagesState, user?.id]);

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab);
    setLoadedTabs((current) => ({
      ...current,
      [tab]: true,
      ...(tab === "invites" || tab === "joinRequests" ? { participants: true } : {}),
    }));
  };

  const runMutation = async <T,>(
    operation: () => Promise<T>,
    successMessage: string,
    fallbackError: string,
  ) => {
    try {
      const result = await operation();
      onToast({ tone: "success", message: successMessage });
      return result;
    } catch (error) {
      onToast({
        tone: "error",
        message: communicationErrorMessage(error, fallbackError),
      });
      throw error;
    }
  };

  const conversation = conversationState.conversation;
  const readOnly = conversationIsReadOnly(conversation);
  const isCommunicationEnabled = policy?.isEnabled !== false;
  const allowReactions = policy?.allowReactions !== false;
  const allowAttachments = policy?.allowAttachments !== false;
  const lastOwnMessage = [...messagesState.messages]
    .reverse()
    .find((message) => isOwnMessage(message, user?.id) && message.id && message.deliveryStatus !== "pending");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8fafc]">
      <ConversationHeader
        conversation={conversation}
        isLoading={conversationState.isLoading}
        onBack={onBack}
        onRefresh={refreshAll}
        readOnly={readOnly}
      />

      <ConversationTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "messages" ? (
          <MessagesPanel
            allowAttachments={allowAttachments}
            allowReactions={allowReactions}
            attachmentsByMessageId={attachmentsState.attachmentsByMessageId}
            currentUserId={user?.id}
            currentUserName={currentUserName(user)}
            error={messagesState.error}
            isLoading={messagesState.isLoading}
            messages={messagesState.messages}
            onAddReaction={(messageId) =>
              runMutation(
                () => reactionsState.addReaction(messageId, "thumbs_up"),
                "Reaction added.",
                "Unable to add reaction.",
              )
            }
            onAttachFile={(messageId, file) =>
              runMutation(
                () => attachmentsState.attachFile(messageId, file),
                "Attachment uploaded.",
                "Unable to upload attachment.",
              )
            }
            reactionsByMessageId={reactionsState.reactionsByMessageId}
            typingUsers={typingState.typingUsers}
            uploadingMessageId={attachmentsState.uploadingMessageId}
          />
        ) : null}

        {activeTab === "participants" ? (
          <ParticipantsPanel
            canManage={permissions.canManageParticipants}
            currentUserId={user?.id}
            error={participantsState.error}
            isLoading={participantsState.isLoading}
            onAddParticipant={() => setIsAddParticipantOpen(true)}
            participants={participantsState.participants}
            presenceByUserId={presenceState.presenceByUserId}
            total={participantsState.total}
          />
        ) : null}

        {activeTab === "invites" ? (
          <InvitesPanel
            canCreate={permissions.canManageInvites}
            error={invitesState.error}
            invites={invitesState.invites}
            isLoading={invitesState.isLoading}
            onCreateInvite={() => setIsInviteOpen(true)}
            onRejectInvite={(invite) =>
              runMutation(
                () => invitesState.reject(invite.id, { reason: "Revoked from conversation demo." }),
                "Invite revoked.",
                "Unable to revoke invite.",
              )
            }
            total={invitesState.total}
          />
        ) : null}

        {activeTab === "joinRequests" ? (
          <JoinRequestsPanel
            canCreate={permissions.canCreateJoinRequest}
            canReview={permissions.canReviewJoinRequests}
            error={joinRequestsState.error}
            isLoading={joinRequestsState.isLoading}
            joinRequests={joinRequestsState.joinRequests}
            onCreateRequest={() => setIsJoinRequestOpen(true)}
            onReject={(request) =>
              runMutation(
                () => joinRequestsState.reject(request.id, { reason: "Rejected from conversation demo." }),
                "Join request rejected.",
                "Unable to reject join request.",
              )
            }
            onReview={setReviewRequest}
            total={joinRequestsState.total}
          />
        ) : null}
      </div>

      {activeTab === "messages" ? (
        readOnly || !isCommunicationEnabled ? (
          <ReadOnlyComposer />
        ) : (
          <MessageComposer
            disabled={messagesState.isMutating}
            maxLength={policy?.maxMessageLength}
            onAttachToLastMessage={(file) => {
              if (!lastOwnMessage?.id) {
                onToast({
                  tone: "info",
                  message: "Send a message first, then attach the file to it.",
                });
                return Promise.resolve();
              }
              return runMutation(
                () => attachmentsState.attachFile(lastOwnMessage.id, file),
                "Attachment uploaded.",
                "Unable to upload attachment.",
              );
            }}
            onSend={(body) =>
              runMutation(
                () => messagesState.send(body),
                "Message sent.",
                "Unable to send message.",
              )
            }
            onStopTyping={typingState.stopOwnTyping}
            onTyping={typingState.emitTyping}
          />
        )
      ) : null}

      {isAddParticipantOpen ? (
        <ParticipantModal
          isSubmitting={participantsState.isMutating}
          onClose={() => setIsAddParticipantOpen(false)}
          onSubmit={(values) =>
            runMutation(
              () => participantsState.add(values),
              "Participant added.",
              "Unable to add participant.",
            ).then(() => setIsAddParticipantOpen(false))
          }
        />
      ) : null}

      {isInviteOpen ? (
        <InviteModal
          isSubmitting={invitesState.isMutating}
          onClose={() => setIsInviteOpen(false)}
          onSubmit={(values) =>
            runMutation(
              () => invitesState.create(values),
              "Invite created.",
              "Unable to create invite.",
            ).then(() => setIsInviteOpen(false))
          }
        />
      ) : null}

      {isJoinRequestOpen ? (
        <JoinRequestModal
          isSubmitting={joinRequestsState.isMutating}
          onClose={() => setIsJoinRequestOpen(false)}
          onSubmit={(values) =>
            runMutation(
              () => joinRequestsState.create(values),
              "Join request created.",
              "Unable to create join request.",
            ).then(() => setIsJoinRequestOpen(false))
          }
        />
      ) : null}

      {reviewRequest ? (
        <ReviewJoinRequestModal
          isSubmitting={joinRequestsState.isMutating}
          request={reviewRequest}
          onApprove={(values) =>
            runMutation(
              () => joinRequestsState.approve(reviewRequest.id, values),
              "Join request approved.",
              "Unable to approve join request.",
            ).then(() => setReviewRequest(null))
          }
          onClose={() => setReviewRequest(null)}
          onReject={(values) =>
            runMutation(
              () => joinRequestsState.reject(reviewRequest.id, values),
              "Join request rejected.",
              "Unable to reject join request.",
            ).then(() => setReviewRequest(null))
          }
        />
      ) : null}
    </div>
  );
}

function ConversationHeader({
  conversation,
  isLoading,
  onBack,
  onRefresh,
  readOnly,
}: {
  conversation: Conversation | null;
  isLoading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  readOnly: boolean;
}) {
  const title = getTitle(conversation);
  const avatar = getAvatarUrl(conversation);
  const participantsCount = conversation?.participantsCount ?? numberValue((conversation as CommunicationRecord | null)?.participants_count);
  const typeLabel = conversation?.type ? conversation.type.replace(/_/g, " ") : "Direct";

  return (
    <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6e87aa] transition hover:bg-slate-100 md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar avatarUrl={avatar} name={title} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-950">
              {isLoading ? "Loading..." : title}
            </h2>
            {readOnly ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#eef3f8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#365a85]">
                <Lock className="h-3 w-3" />
                Read only
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs capitalize text-[#365a85]">
            {typeLabel}
            {participantsCount ? ` • ${participantsCount} Participants` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[#6e87aa]">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-[#0288d1]"
          aria-label="Search messages"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-[#0288d1]"
          aria-label="Refresh conversation"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function ConversationTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  return (
    <nav className="flex h-12 shrink-0 items-end gap-1 border-b border-slate-200 bg-white px-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`h-12 border-b-2 px-4 text-sm font-medium transition ${
            activeTab === tab.value
              ? "border-[#0288d1] text-[#006bb6]"
              : "border-transparent text-[#365a85] hover:text-[#0288d1]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function MessagesPanel({
  allowAttachments,
  allowReactions,
  attachmentsByMessageId,
  currentUserId,
  currentUserName,
  error,
  isLoading,
  messages,
  onAddReaction,
  onAttachFile,
  reactionsByMessageId,
  typingUsers,
  uploadingMessageId,
}: {
  allowAttachments: boolean;
  allowReactions: boolean;
  attachmentsByMessageId: Record<string, MessageAttachment[]>;
  currentUserId?: string | null;
  currentUserName: string;
  error: string | null;
  isLoading: boolean;
  messages: ConversationMessage[];
  onAddReaction: (messageId: string) => Promise<unknown>;
  onAttachFile: (messageId: string, file: File) => Promise<unknown>;
  reactionsByMessageId: Record<string, MessageReaction[]>;
  typingUsers: Array<{ userId: string; name?: string }>;
  uploadingMessageId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, typingUsers.length]);

  if (isLoading) {
    return <CenteredState label="Loading messages..." />;
  }

  if (error) {
    return <CenteredState label={error} />;
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-6">
        <div className="self-center rounded-full bg-[#e4ebf3] px-4 py-1 text-xs font-medium text-[#123156]">
          Today
        </div>

        {messages.length === 0 ? (
          <CenteredState label="No messages yet. Start the conversation." />
        ) : null}

        {messages.map((message) => {
          const own = isOwnMessage(message, currentUserId);
          return (
            <MessageBubble
              key={message.clientMessageId ?? message.id}
              allowAttachments={allowAttachments}
              allowReactions={allowReactions}
              attachments={attachmentsByMessageId[message.id] ?? message.attachments ?? []}
              currentUserName={currentUserName}
              isOwn={own}
              isUploadingAttachment={uploadingMessageId === message.id}
              message={message}
              onAddReaction={() => onAddReaction(message.id)}
              onAttachFile={(file) => onAttachFile(message.id, file)}
              reactions={reactionsByMessageId[message.id] ?? []}
            />
          );
        })}

        {typingUsers.length > 0 ? (
          <div className="flex items-center gap-2 text-xs italic text-[#7c91b0]">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8aa0bf]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#8aa0bf]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#8aa0bf]" />
            </span>
            {typingUsers.map((user) => user.name || user.userId).join(", ")} is typing...
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({
  allowAttachments,
  allowReactions,
  attachments,
  currentUserName,
  isOwn,
  isUploadingAttachment,
  message,
  onAddReaction,
  onAttachFile,
  reactions,
}: {
  allowAttachments: boolean;
  allowReactions: boolean;
  attachments: MessageAttachment[];
  currentUserName: string;
  isOwn: boolean;
  isUploadingAttachment: boolean;
  message: ConversationMessage;
  onAddReaction: () => Promise<unknown>;
  onAttachFile: (file: File) => Promise<unknown>;
  reactions: MessageReaction[];
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const senderName = isOwn
    ? currentUserName || "You"
    : actorName(message.sender) || message.senderId || "Participant";
  const avatar = getAvatarUrl(message.sender);
  const thumbsUpCount = reactions.filter((reaction) => reaction.type === "thumbs_up").length;
  const edited = Boolean(message.updatedAt && message.updatedAt !== message.createdAt);
  const deleted = message.status === "deleted";

  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await onAttachFile(file);
  };

  return (
    <article className={`group flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn ? <Avatar avatarUrl={avatar} name={senderName} size="sm" /> : null}

      {isOwn ? (
        <BubbleActionButton
          allowAttachments={allowAttachments}
          allowReactions={allowReactions}
          fileInputRef={fileInputRef}
          onAddReaction={onAddReaction}
        />
      ) : null}

      <div className={`flex max-w-[min(640px,78vw)] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn ? (
          <div className="mb-1 ml-1 text-xs font-medium text-[#365a85]">
            {senderName}
          </div>
        ) : null}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isOwn
              ? "rounded-br-md bg-[#0288d1] text-white"
              : "rounded-bl-md border border-[#d8e2ed] bg-white text-slate-950"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-6">
            {deleted ? "This message was deleted." : message.body}
          </p>

          {attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <AttachmentCard key={attachment.id} attachment={attachment} isOwn={isOwn} />
              ))}
            </div>
          ) : null}

          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOwn ? "text-white/80" : "text-[#8aa0bf]"}`}>
            {message.deliveryStatus === "pending" ? <span>Sending</span> : null}
            {message.deliveryStatus === "failed" ? <span>Failed</span> : null}
            {edited ? <span>Edited</span> : null}
            <span>{formatTime(message.createdAt)}</span>
            {isOwn && message.deliveryStatus !== "failed" ? (
              <Check className="h-3 w-3" />
            ) : null}
          </div>
        </div>

        {thumbsUpCount > 0 ? (
          <button
            type="button"
            onClick={() => void onAddReaction()}
            className="mt-1 inline-flex h-6 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 text-xs text-[#365a85] shadow-sm"
          >
            <span>👍</span>
            <span>{thumbsUpCount}</span>
          </button>
        ) : null}
        {isUploadingAttachment ? (
          <span className="mt-1 text-xs text-[#6e87aa]">Uploading attachment...</span>
        ) : null}
      </div>

      {!isOwn ? (
        <BubbleActionButton
          allowAttachments={allowAttachments}
          allowReactions={allowReactions}
          fileInputRef={fileInputRef}
          onAddReaction={onAddReaction}
        />
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => void handleAttach(event)}
      />
    </article>
  );
}

function BubbleActionButton({
  allowAttachments,
  allowReactions,
  fileInputRef,
  onAddReaction,
}: {
  allowAttachments: boolean;
  allowReactions: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAddReaction: () => Promise<unknown>;
}) {
  if (!allowAttachments && !allowReactions) return null;
  return (
    <div className="flex translate-y-[-6px] items-center gap-1 opacity-0 transition group-hover:opacity-100">
      {allowReactions ? (
        <button
          type="button"
          onClick={() => void onAddReaction()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#8aa0bf] shadow-sm transition hover:text-[#0288d1]"
          aria-label="Add reaction"
        >
          <Smile className="h-4 w-4" />
        </button>
      ) : null}
      {allowAttachments ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#8aa0bf] shadow-sm transition hover:text-[#0288d1]"
          aria-label="Attach file to message"
        >
          <Paperclip className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function AttachmentCard({
  attachment,
  isOwn,
}: {
  attachment: MessageAttachment;
  isOwn: boolean;
}) {
  const file = attachment.file;
  const name =
    attachment.name ||
    file?.originalName ||
    file?.filename ||
    attachment.url?.split("/").pop() ||
    "Attachment";
  const size = formatFileSize(attachment.size || file?.size);
  const href = attachment.url || file?.url;
  const content = (
    <div
      className={`flex min-w-[260px] items-center gap-3 rounded-lg p-3 ${
        isOwn ? "bg-[#0479b8]" : "bg-[#f1f5f9]"
      }`}
    >
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${isOwn ? "bg-[#09a8f4]" : "bg-white"}`}>
        <FileText className={`h-5 w-5 ${isOwn ? "text-white" : "text-[#0288d1]"}`} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{name}</span>
        {size ? <span className="block text-xs opacity-85">{size}</span> : null}
      </span>
    </div>
  );

  if (!href) return content;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  );
}

function MessageComposer({
  disabled,
  maxLength,
  onAttachToLastMessage,
  onSend,
  onStopTyping,
  onTyping,
}: {
  disabled: boolean;
  maxLength?: number;
  onAttachToLastMessage: (file: File) => Promise<unknown>;
  onSend: (body: string) => Promise<unknown>;
  onStopTyping: () => void;
  onTyping: () => void;
}) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isSubmitting || disabled) return;
    setIsSubmitting(true);
    try {
      await onSend(trimmed);
      setBody("");
      onStopTyping();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;
    setIsSubmitting(true);
    try {
      await onAttachToLastMessage(file);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d6e2ef] bg-[#f8fafc] px-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#8aa0bf] transition hover:bg-white hover:text-[#0288d1]"
          aria-label="Attach file"
          disabled={disabled || isSubmitting}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => void handleAttach(event)} />
        <input
          value={body}
          onBlur={onStopTyping}
          onChange={(event) => {
            setBody(event.target.value);
            onTyping();
          }}
          placeholder="Write a message..."
          maxLength={maxLength}
          disabled={disabled || isSubmitting}
          className="h-12 min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 placeholder:text-[#8aa0bf] focus:outline-none focus:ring-0"
        />
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#8aa0bf] transition hover:bg-white hover:text-[#0288d1]"
          aria-label="Emoji"
          disabled={disabled || isSubmitting}
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={disabled || isSubmitting || !body.trim()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#d8e2ee] text-[#6e87aa] transition enabled:bg-[#0288d1] enabled:text-white enabled:hover:bg-[#0277bd]"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}

function ReadOnlyComposer() {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="flex h-12 items-center justify-center rounded-lg border border-[#d6e2ef] bg-[#f8fafc] text-sm text-[#365a85]">
        This conversation is read-only. Only admins can send messages.
      </div>
    </div>
  );
}

function ParticipantsPanel({
  canManage,
  currentUserId,
  error,
  isLoading,
  onAddParticipant,
  participants,
  presenceByUserId,
  total,
}: {
  canManage: boolean;
  currentUserId?: string | null;
  error: string | null;
  isLoading: boolean;
  onAddParticipant: () => void;
  participants: ConversationParticipant[];
  presenceByUserId: Record<string, { isOnline?: boolean }>;
  total: number;
}) {
  return (
    <PanelLayout
      action={
        canManage ? (
          <ActionButton icon={<UserPlus className="h-4 w-4" />} onClick={onAddParticipant}>
            Add Participant
          </ActionButton>
        ) : null
      }
      title={`Participants (${total || participants.length})`}
    >
      {isLoading ? <PanelState label="Loading participants..." /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-[#d6e2ef] bg-white shadow-sm">
          {participants.length === 0 ? <PanelState label="No participants loaded." /> : null}
          {participants.map((participant) => {
            const name = actorName(participant.actor) || participant.userId || "Participant";
            const isCurrentUser = currentUserId && participantUserId(participant) === currentUserId;
            const isOnline = Boolean(presenceByUserId[participantUserId(participant)]?.isOnline);
            return (
              <div key={participant.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar avatarUrl={getAvatarUrl(participant.actor)} name={name} online={isOnline} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-950">{name}</p>
                      {participant.role === "owner" ? <StatusPill tone="blue">Owner</StatusPill> : null}
                      {participant.status === "muted" ? <StatusPill tone="orange">Muted</StatusPill> : null}
                      {isCurrentUser ? <StatusPill tone="green">You</StatusPill> : null}
                    </div>
                    <p className="text-xs text-[#365a85]">
                      Joined {formatRelativeDate(participant.joinedAt) || "recently"}
                    </p>
                  </div>
                </div>
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8aa0bf] hover:bg-slate-100">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </PanelLayout>
  );
}

function InvitesPanel({
  canCreate,
  error,
  invites,
  isLoading,
  onCreateInvite,
  onRejectInvite,
  total,
}: {
  canCreate: boolean;
  error: string | null;
  invites: ConversationInvite[];
  isLoading: boolean;
  onCreateInvite: () => void;
  onRejectInvite: (invite: ConversationInvite) => Promise<unknown>;
  total: number;
}) {
  return (
    <PanelLayout
      action={
        canCreate ? (
          <ActionButton icon={<Plus className="h-4 w-4" />} onClick={onCreateInvite}>
            Create Invite
          </ActionButton>
        ) : null
      }
      title={`Invites (${total || invites.length})`}
    >
      {isLoading ? <PanelState label="Loading invites..." /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-[#d6e2ef] bg-white shadow-sm">
          {invites.length === 0 ? <PanelState label="No invites yet." /> : null}
          {invites.map((invite) => {
            const name = actorName(invite.invitedUser) || invite.invitedUserId || "Invited user";
            return (
              <div key={invite.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar avatarUrl={getAvatarUrl(invite.invitedUser)} name={name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{name}</p>
                    <p className="text-xs text-[#365a85]">
                      Expires: {formatDate(invite.expiresAt) || "No expiration"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone={invite.status === "accepted" ? "green" : invite.status === "pending" ? "orange" : "red"}>
                    {invite.status || "pending"}
                  </StatusPill>
                  {invite.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => void onRejectInvite(invite)}
                      className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </PanelLayout>
  );
}

function JoinRequestsPanel({
  canCreate,
  canReview,
  error,
  isLoading,
  joinRequests,
  onCreateRequest,
  onReject,
  onReview,
  total,
}: {
  canCreate: boolean;
  canReview: boolean;
  error: string | null;
  isLoading: boolean;
  joinRequests: ConversationJoinRequest[];
  onCreateRequest: () => void;
  onReject: (request: ConversationJoinRequest) => Promise<unknown>;
  onReview: (request: ConversationJoinRequest) => void;
  total: number;
}) {
  return (
    <PanelLayout
      action={
        canCreate ? (
          <ActionButton icon={<Plus className="h-4 w-4" />} onClick={onCreateRequest}>
            Create Request
          </ActionButton>
        ) : null
      }
      title={`Join Requests (${total || joinRequests.length})`}
    >
      {isLoading ? <PanelState label="Loading join requests..." /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-[#d6e2ef] bg-white shadow-sm">
          {joinRequests.length === 0 ? <PanelState label="No join requests yet." /> : null}
          {joinRequests.map((request) => {
            const name = actorName(request.user) || request.userId || "Requester";
            return (
              <div key={request.id} className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-5 last:border-b-0">
                <div className="flex min-w-0 gap-3">
                  <Avatar avatarUrl={getAvatarUrl(request.user)} name={name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{name}</p>
                    {request.note ? (
                      <p className="mt-2 rounded bg-[#f3f6f9] px-3 py-2 text-sm italic text-[#365a85]">
                        &quot;{request.note}&quot;
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[#6e87aa]">
                      Requested {formatRelativeDate(request.createdAt) || "recently"}
                    </p>
                  </div>
                </div>
                {canReview && request.status === "pending" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void onReject(request)}
                      className="h-9 rounded-lg border border-[#cbd8e6] bg-white px-3 text-sm font-medium text-[#123156] hover:bg-slate-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => onReview(request)}
                      className="h-9 rounded-lg bg-[#0288d1] px-4 text-sm font-bold text-white hover:bg-[#0277bd]"
                    >
                      Review
                    </button>
                  </div>
                ) : (
                  <StatusPill tone={request.status === "approved" ? "green" : request.status === "rejected" ? "red" : "orange"}>
                    {request.status || "pending"}
                  </StatusPill>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </PanelLayout>
  );
}

function PanelLayout({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-[768px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#eef8ff] px-3 text-sm font-bold text-[#0288d1] transition hover:bg-[#dff4ff]"
    >
      {icon}
      {children}
    </button>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "green" | "orange" | "red";
}) {
  const classes = {
    blue: "bg-[#dff4ff] text-[#0277bd]",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${classes[tone]}`}>
      {children}
    </span>
  );
}

function PanelState({ label }: { label: string }) {
  return <div className="px-4 py-6 text-center text-sm text-[#6e87aa]">{label}</div>;
}

function CenteredState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center text-sm text-[#6e87aa]">
      {label}
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex h-full items-center justify-center bg-[#f8fafc] text-sm text-[#6e87aa]">
      Select a conversation to start.
    </div>
  );
}

function Avatar({
  avatarUrl,
  name,
  online,
  size = "md",
}: {
  avatarUrl?: string;
  name?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-11 w-11 text-sm",
  };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#d8edf9] to-[#79b9dc] font-bold text-[#014d75] ${sizes[size]}`}
      style={
        avatarUrl
          ? {
              backgroundImage: `url("${avatarUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      aria-hidden="true"
    >
      {!avatarUrl ? initials(name) : null}
      {online ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#00b86b]" />
      ) : null}
    </div>
  );
}

function ToastMessage({
  message,
  onClose,
  tone,
}: {
  message: string;
  onClose: () => void;
  tone: "success" | "error" | "info";
}) {
  const classes = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`absolute bottom-5 left-1/2 z-50 flex max-w-[min(520px,90vw)] -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${classes[tone]}`}>
      <span>{message}</span>
      <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/60" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function CreateConversationModal({
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ConversationFormValues) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ConversationType>("group");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  return (
    <Modal title="Create Conversation" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit({ title, type, isReadOnly, isPinned });
        }}
      >
        <FieldLabel label="Title">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className={fieldInputClass}
            placeholder="Conversation title"
          />
        </FieldLabel>
        <FieldLabel label="Type">
          <select value={type} onChange={(event) => setType(event.target.value as ConversationType)} className={fieldInputClass}>
            {conversationTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm text-[#365a85]">
          <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
          Pin conversation
        </label>
        <label className="flex items-center gap-2 text-sm text-[#365a85]">
          <input type="checkbox" checked={isReadOnly} onChange={(event) => setIsReadOnly(event.target.checked)} />
          Read only
        </label>
        <ModalActions isSubmitting={isSubmitting} onClose={onClose} submitLabel="Create" />
      </form>
    </Modal>
  );
}

function ParticipantModal({
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ParticipantFormValues) => Promise<unknown>;
}) {
  const [user, setUser] = useState<CommunicationSelectorOption | null>(null);
  const [role, setRole] = useState<ParticipantRole>("member");

  return (
    <Modal title="Add Participant" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!user) return;
          void onSubmit({ userId: user.id, role, status: "active" });
        }}
      >
        <FieldLabel label="User">
          <UserSearchInput value={user} onChange={setUser} />
        </FieldLabel>
        <FieldLabel label="Role">
          <select value={role} onChange={(event) => setRole(event.target.value as ParticipantRole)} className={fieldInputClass}>
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="read_only">Read only</option>
          </select>
        </FieldLabel>
        <ModalActions isSubmitting={isSubmitting} onClose={onClose} submitLabel="Add" />
      </form>
    </Modal>
  );
}

function InviteModal({
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateConversationInviteValues) => Promise<unknown>;
}) {
  const [user, setUser] = useState<CommunicationSelectorOption | null>(null);
  const [expiresAt, setExpiresAt] = useState("");

  return (
    <Modal title="Create Invite" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!user) return;
          void onSubmit({ invitedUserId: user.id, expiresAt });
        }}
      >
        <FieldLabel label="User">
          <UserSearchInput value={user} onChange={setUser} />
        </FieldLabel>
        <FieldLabel label="Expires at">
          <input
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className={fieldInputClass}
            type="datetime-local"
          />
        </FieldLabel>
        <ModalActions isSubmitting={isSubmitting} onClose={onClose} submitLabel="Create" />
      </form>
    </Modal>
  );
}

function JoinRequestModal({
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateConversationJoinRequestValues) => Promise<unknown>;
}) {
  const [note, setNote] = useState("");

  return (
    <Modal title="Create Join Request" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit({ note });
        }}
      >
        <FieldLabel label="Note">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={`${fieldInputClass} min-h-24 resize-none`}
            placeholder="Why do you want to join?"
          />
        </FieldLabel>
        <ModalActions isSubmitting={isSubmitting} onClose={onClose} submitLabel="Create" />
      </form>
    </Modal>
  );
}

function ReviewJoinRequestModal({
  isSubmitting,
  onApprove,
  onClose,
  onReject,
  request,
}: {
  isSubmitting: boolean;
  onApprove: (values?: ReviewConversationJoinRequestValues) => Promise<unknown>;
  onClose: () => void;
  onReject: (values?: ReviewConversationJoinRequestValues) => Promise<unknown>;
  request: ConversationJoinRequest;
}) {
  const [reason, setReason] = useState("");
  const name = actorName(request.user) || request.userId || "Requester";

  return (
    <Modal title="Review Join Request" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-[#f8fafc] p-3">
          <Avatar avatarUrl={getAvatarUrl(request.user)} name={name} />
          <div>
            <p className="text-sm font-bold text-slate-950">{name}</p>
            {request.note ? <p className="mt-1 text-sm italic text-[#365a85]">&quot;{request.note}&quot;</p> : null}
          </div>
        </div>
        <FieldLabel label="Reason">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={`${fieldInputClass} min-h-20 resize-none`}
            placeholder="Optional review reason"
          />
        </FieldLabel>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={modalSecondaryClass}>
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onReject({ reason })}
            className="h-10 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onApprove({ reason })}
            className={modalPrimaryClass}
          >
            Approve
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UserSearchInput({
  onChange,
  value,
}: {
  onChange: (option: CommunicationSelectorOption | null) => void;
  value: CommunicationSelectorOption | null;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [options, setOptions] = useState<CommunicationSelectorOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchUsers(query).then(setOptions).catch(() => setOptions([]));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={fieldInputClass}
        placeholder="Search users..."
      />
      {isOpen && options.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[#d6e2ef] bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option);
                setQuery(option.label);
                setIsOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[#eef8ff]"
            >
              <span className="block font-semibold text-slate-950">{option.label}</span>
              {option.description ? <span className="block text-xs text-[#6e87aa]">{option.description}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/20 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d6e2ef] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[#6e87aa] hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[#365a85]">{label}</span>
      {children}
    </label>
  );
}

function ModalActions({
  isSubmitting,
  onClose,
  submitLabel,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onClose} className={modalSecondaryClass}>
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting} className={modalPrimaryClass}>
        {submitLabel}
      </button>
    </div>
  );
}
