"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
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
  Edit3,
  FileText,
  Lock,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smile,
  ThumbsUp,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import ConversationSidebar, {
  type ConversationRedesignFilter,
  statusForRedesignFilter,
} from "@/features/communication/conversations_redesign/components/sidebar";
import {
  labelsForLocale,
  type ConversationRedesignLabels,
} from "@/features/communication/conversations_redesign/labels";
import { useCommunicationPolicy } from "@/features/communication/hooks/useCommunicationPolicy";
import { useConversation } from "@/features/communication/hooks/useConversation";
import { useConversationInvites } from "@/features/communication/hooks/useConversationInvites";
import { useConversationJoinRequests } from "@/features/communication/hooks/useConversationJoinRequests";
import { useConversationMessages } from "@/features/communication/hooks/useConversationMessages";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import { useConversationParticipants } from "@/features/communication/hooks/useConversationParticipants";
import type {
  ParticipantFormValues,
  ParticipantRoleChangeValues,
} from "@/features/communication/hooks/useConversationParticipants";
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
} from "@/features/communication/types/conversation.types";
import type {
  CommunicationActor,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  MessageAttachment,
  MessageReaction,
} from "@/features/communication/types/message.types";
import AddParticipantDialog from "@/features/communication/components/conversations/AddParticipantDialog";
import CreateConversationDialog from "@/features/communication/components/conversations/CreateConversationDialog";
import CreateInviteDialog from "@/features/communication/components/conversations/CreateInviteDialog";
import CreateJoinRequestDialog from "@/features/communication/components/conversations/CreateJoinRequestDialog";
import EditParticipantRoleDialog, {
  type ParticipantDialogMode,
} from "@/features/communication/components/conversations/EditParticipantRoleDialog";
import LeaveConversationDialog from "@/features/communication/components/conversations/LeaveConversationDialog";
import RejectInviteDialog from "@/features/communication/components/conversations/RejectInviteDialog";
import RemoveParticipantDialog from "@/features/communication/components/conversations/RemoveParticipantDialog";
import ReviewJoinRequestDialog, {
  type ReviewJoinRequestMode,
} from "@/features/communication/components/conversations/ReviewJoinRequestDialog";
import { getConversationPermissionFlags } from "@/features/communication/utils/conversation-permissions";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";
import { useAuth } from "@/hooks/use-auth";

type DetailTab = "messages" | "participants" | "invites" | "joinRequests";

type ToastState = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

type UserDisplayNameMap = Record<string, string>;

const tabs: Array<{
  value: DetailTab;
  labelKey: "messages" | "participants" | "invites" | "joinRequests";
}> = [
  { value: "messages", labelKey: "messages" },
  { value: "participants", labelKey: "participants" },
  { value: "invites", labelKey: "invites" },
  { value: "joinRequests", labelKey: "joinRequests" },
];

function createConversationDialogLabels(labels: ConversationRedesignLabels) {
  return {
    createTitle: labels.createConversation,
    editTitle: labels.editConversation,
    title: labels.title,
    type: labels.type,
    description: labels.description,
    academicYearId: labels.academicYearId,
    termId: labels.termId,
    stageId: labels.stageId,
    gradeId: labels.gradeId,
    sectionId: labels.sectionId,
    classroomId: labels.classroomId,
    subjectId: labels.subjectId,
    avatarFileId: labels.avatarFileId,
    isReadOnly: labels.readOnly,
    isPinned: labels.pinned,
    group: labels.group,
    classroom: labels.classroom,
    direct: labels.direct,
    cancel: labels.cancel,
    create: labels.create,
    save: labels.save,
    titleRequired: labels.titleRequired,
    classroomRequired: labels.classroomRequired,
  };
}

function participantDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.addParticipant,
    userId: labels.user,
    role: labels.role,
    status: labels.status,
    mutedUntil: labels.mutedUntil,
    cancel: labels.cancel,
    add: labels.add,
    userRequired: labels.userRequired,
    owner: labels.owner,
    admin: labels.admin,
    moderator: labels.moderator,
    member: labels.member,
    readOnly: labels.readOnlyRole,
    system: labels.system,
    active: labels.active,
    invited: labels.invited,
    left: labels.left,
    removed: labels.removed,
    muted: labels.muted,
    blocked: labels.blocked,
  };
}

function editParticipantDialogLabels(labels: ConversationRedesignLabels) {
  return {
    ...participantDialogLabels(labels),
    editTitle: labels.editParticipantTitle,
    promoteTitle: labels.promoteParticipantTitle,
    demoteTitle: labels.demoteParticipantTitle,
    targetRole: labels.targetRole,
    save: labels.save,
    promote: labels.promote,
    demote: labels.demote,
  };
}

function removeParticipantDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.removeParticipantTitle,
    description: labels.removeParticipantDescription,
    cancel: labels.cancel,
    remove: labels.removeParticipant,
  };
}

function leaveConversationDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.leaveConversationTitle,
    description: labels.leaveConversationDescription,
    cancel: labels.cancel,
    leave: labels.leaveConversation,
  };
}

function createInviteDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.createInvite,
    invitedUserId: labels.invitedUser,
    expiresAt: labels.expiresAt,
    cancel: labels.cancel,
    create: labels.create,
    userRequired: labels.userRequired,
  };
}

function rejectInviteDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.rejectInviteTitle,
    description: labels.rejectInviteDescription,
    reason: labels.reason,
    cancel: labels.cancel,
    reject: labels.rejectInvite,
  };
}

function createJoinRequestDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.createJoinRequest,
    note: labels.note,
    cancel: labels.cancel,
    create: labels.create,
  };
}

function reviewJoinRequestDialogLabels(labels: ConversationRedesignLabels) {
  return {
    approveTitle: labels.reviewJoinRequest,
    rejectTitle: labels.rejectJoinRequest,
    approveDescription: labels.approveJoinRequestDescription,
    rejectDescription: labels.rejectJoinRequestDescription,
    reason: labels.reason,
    cancel: labels.cancel,
    approve: labels.approveRequest,
    reject: labels.rejectRequest,
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function actorName(actor?: CommunicationActor | null) {
  return actor?.name || actor?.nameEn || actor?.nameAr;
}

function displayNameForUserId(
  userId: string | null | undefined,
  userDisplayNames: UserDisplayNameMap,
  fallback: string,
) {
  if (!userId) return fallback;
  return userDisplayNames[userId] || fallback;
}

function getTitle(
  labels: ConversationRedesignLabels,
  conversation?: Conversation | ConversationListItemModel | null,
) {
  if (!conversation) return labels.untitledConversation;
  return (
    conversation.titleEn ||
    conversation.title ||
    conversation.titleAr ||
    labels.untitledConversation
  );
}

function getAvatarUrl(
  value?: Conversation | ConversationListItemModel | CommunicationActor | null,
) {
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

function formatTime(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatRelativeDate(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 3600000));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffHours < 24) return formatter.format(-diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 31) return formatter.format(-diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return formatter.format(-diffMonths, "month");
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
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
  return Boolean(
    record.isReadOnly || record.readOnly || conversation.status === "closed",
  );
}

function participantUserId(participant: ConversationParticipant) {
  return (
    participant.userId ||
    participant.actor?.userId ||
    participant.actor?.id ||
    ""
  );
}

function currentUserName(
  user: ReturnType<typeof useAuth>["user"],
  labels: ConversationRedesignLabels,
) {
  if (!user) return "";
  return (
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.username ||
    user.email ||
    labels.you
  );
}

function conversationTypeLabel(
  type: Conversation["type"] | undefined,
  labels: ConversationRedesignLabels,
) {
  if (type === "group") return labels.group;
  if (type === "classroom") return labels.classroom;
  if (type === "direct") return labels.direct;
  return type?.replace(/_/g, " ") || labels.direct;
}

function statusLabel(
  status: string | null | undefined,
  labels: ConversationRedesignLabels,
) {
  const normalized = status || "pending";
  const statusLabels: Record<string, string> = {
    active: labels.active,
    accepted: labels.accepted,
    approved: labels.approved,
    expired: labels.expired,
    pending: labels.pending,
    rejected: labels.rejected,
  };
  return statusLabels[normalized] ?? normalized;
}

function isOwnMessage(
  message: ConversationMessage,
  currentUserId?: string | null,
) {
  if (!currentUserId) return false;
  const senderUserId = message.sender?.userId || message.sender?.id;
  return message.senderId === currentUserId || senderUserId === currentUserId;
}

function messageSenderUserId(message: ConversationMessage) {
  return message.senderId || message.sender?.userId || message.sender?.id || "";
}

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
  }, [initialConversationId]);

  useEffect(() => {
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
    <main className="relative h-[calc(100vh-92px)] min-h-[680px] overflow-hidden bg-slate-50 text-slate-950">
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

        <section
          className={`${showMobileThread ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}
        >
          {selectedConversationId ? (
            <ConversationDetail
              key={selectedConversationId}
              conversationId={selectedConversationId}
              onBack={() => setShowMobileThread(false)}
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

function ConversationDetail({
  conversationId,
  labels,
  onBack,
  onToast,
}: {
  conversationId: string;
  labels: ConversationRedesignLabels;
  onBack: () => void;
  onToast: (toast: ToastState) => void;
}) {
  const locale = useLocale();
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
  const [participantEditState, setParticipantEditState] = useState<{
    mode: ParticipantDialogMode;
    participant: ConversationParticipant;
  } | null>(null);
  const [participantToRemove, setParticipantToRemove] =
    useState<ConversationParticipant | null>(null);
  const [isLeaveConversationOpen, setIsLeaveConversationOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinRequestOpen, setIsJoinRequestOpen] = useState(false);
  const [rejectInvite, setRejectInvite] = useState<ConversationInvite | null>(
    null,
  );
  const [reviewRequest, setReviewRequest] = useState<{
    mode: ReviewJoinRequestMode;
    request: ConversationJoinRequest;
  } | null>(null);

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
  const attachmentsState = useMessageAttachments(
    messageIds,
    policy?.maxAttachmentSizeMb,
  );
  const userDisplayNames = useMemo<UserDisplayNameMap>(() => ({}), []);

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
      ...(tab === "invites" || tab === "joinRequests"
        ? { participants: true }
        : {}),
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
    .find(
      (message) =>
        isOwnMessage(message, user?.id) &&
        message.id &&
        message.deliveryStatus !== "pending",
    );

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <ConversationHeader
        conversation={conversation}
        isLoading={conversationState.isLoading}
        labels={labels}
        onBack={onBack}
        onRefresh={refreshAll}
        readOnly={readOnly}
      />

      <ConversationTabs
        activeTab={activeTab}
        labels={labels}
        onTabChange={handleTabChange}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "messages" ? (
          <MessagesPanel
            allowAttachments={allowAttachments}
            allowReactions={allowReactions}
            attachmentsByMessageId={attachmentsState.attachmentsByMessageId}
            currentUserId={user?.id}
            currentUserName={currentUserName(user, labels)}
            error={messagesState.error}
            isLoading={messagesState.isLoading}
            labels={labels}
            locale={locale}
            messages={messagesState.messages}
            onAddReaction={(messageId) =>
              runMutation(
                () => reactionsState.addReaction(messageId, "thumbs_up"),
                labels.reactionAdded,
                labels.unableToAddReaction,
              )
            }
            onAttachFile={(messageId, file) =>
              runMutation(
                () => attachmentsState.attachFile(messageId, file),
                labels.attachmentUploaded,
                labels.unableToUploadAttachment,
              )
            }
            onDeleteAttachment={(messageId, attachmentId) =>
              runMutation(
                () =>
                  attachmentsState.removeAttachment(messageId, attachmentId),
                labels.attachmentDeleted,
                labels.unableToDeleteAttachment,
              )
            }
            onDeleteMessage={(messageId) =>
              runMutation(
                () => messagesState.remove(messageId),
                labels.messageDeleted,
                labels.unableToDeleteMessage,
              )
            }
            onEditMessage={(messageId, body) =>
              runMutation(
                () => messagesState.edit(messageId, body),
                labels.messageUpdated,
                labels.unableToUpdateMessage,
              )
            }
            onRemoveReaction={(messageId) =>
              runMutation(
                () => reactionsState.removeMyReaction(messageId),
                labels.reactionRemoved,
                labels.unableToRemoveReaction,
              )
            }
            readSummary={messagesState.readSummary}
            reactionsByMessageId={reactionsState.reactionsByMessageId}
            typingUsers={typingState.typingUsers}
            userDisplayNames={userDisplayNames}
            uploadingMessageId={attachmentsState.uploadingMessageId}
          />
        ) : null}

        {activeTab === "participants" ? (
          <ParticipantsPanel
            canLeaveConversation={permissions.canLeaveConversation}
            canManage={permissions.canManageParticipants}
            currentUserId={user?.id}
            error={participantsState.error}
            isLoading={participantsState.isLoading}
            labels={labels}
            locale={locale}
            onAddParticipant={() => setIsAddParticipantOpen(true)}
            onDemoteParticipant={(participant) =>
              setParticipantEditState({ mode: "demote", participant })
            }
            onEditParticipant={(participant) =>
              setParticipantEditState({ mode: "edit", participant })
            }
            onLeaveConversation={() => setIsLeaveConversationOpen(true)}
            onPromoteParticipant={(participant) =>
              setParticipantEditState({ mode: "promote", participant })
            }
            onRemoveParticipant={setParticipantToRemove}
            participants={participantsState.participants}
            presenceByUserId={presenceState.presenceByUserId}
            total={participantsState.total}
            userDisplayNames={userDisplayNames}
          />
        ) : null}

        {activeTab === "invites" ? (
          <InvitesPanel
            canCreate={permissions.canManageInvites}
            canManage={permissions.canManageInvites}
            currentUserId={user?.id}
            error={invitesState.error}
            invites={invitesState.invites}
            isLoading={invitesState.isLoading}
            isMutating={invitesState.isMutating}
            labels={labels}
            locale={locale}
            onAcceptInvite={(invite) =>
              runMutation(
                () => invitesState.accept(invite.id),
                labels.inviteAccepted,
                labels.unableToAcceptInvite,
              )
            }
            onCreateInvite={() => setIsInviteOpen(true)}
            onRejectInvite={setRejectInvite}
            total={invitesState.total}
            userDisplayNames={userDisplayNames}
          />
        ) : null}

        {activeTab === "joinRequests" ? (
          <JoinRequestsPanel
            canCreate={permissions.canCreateJoinRequest}
            canReview={permissions.canReviewJoinRequests}
            error={joinRequestsState.error}
            isLoading={joinRequestsState.isLoading}
            joinRequests={joinRequestsState.joinRequests}
            labels={labels}
            locale={locale}
            onCreateRequest={() => setIsJoinRequestOpen(true)}
            onReject={(request) =>
              setReviewRequest({ mode: "reject", request })
            }
            onReview={(request) =>
              setReviewRequest({ mode: "approve", request })
            }
            total={joinRequestsState.total}
            userDisplayNames={userDisplayNames}
          />
        ) : null}
      </div>

      {activeTab === "messages" ? (
        readOnly || !isCommunicationEnabled ? (
          <ReadOnlyComposer labels={labels} />
        ) : (
          <MessageComposer
            disabled={messagesState.isMutating}
            labels={labels}
            maxLength={policy?.maxMessageLength}
            onAttachToLastMessage={(file) => {
              if (!lastOwnMessage?.id) {
                onToast({
                  tone: "info",
                  message: labels.sendMessageBeforeAttach,
                });
                return Promise.resolve();
              }
              return runMutation(
                () => attachmentsState.attachFile(lastOwnMessage.id, file),
                labels.attachmentUploaded,
                labels.unableToUploadAttachment,
              );
            }}
            onSend={(body) =>
              runMutation(
                () => messagesState.send(body),
                labels.messageSent,
                labels.unableToSendMessage,
              )
            }
            onStopTyping={typingState.stopOwnTyping}
            onTyping={typingState.emitTyping}
          />
        )
      ) : null}

      {isAddParticipantOpen ? (
        <AddParticipantDialog
          labels={participantDialogLabels(labels)}
          open={isAddParticipantOpen}
          isSubmitting={participantsState.isMutating}
          onClose={() => setIsAddParticipantOpen(false)}
          onSubmit={(values) =>
            runMutation(
              () => participantsState.add(values),
              labels.participantAdded,
              labels.unableToAddParticipant,
            ).then(() => setIsAddParticipantOpen(false))
          }
        />
      ) : null}

      {participantEditState ? (
        <EditParticipantRoleDialog
          labels={editParticipantDialogLabels(labels)}
          mode={participantEditState.mode}
          open={Boolean(participantEditState)}
          participant={participantEditState.participant}
          isSubmitting={participantsState.isMutating}
          onClose={() => setParticipantEditState(null)}
          onSubmit={(values) => {
            const { mode, participant } = participantEditState;
            const operation =
              mode === "edit"
                ? () =>
                    participantsState.update(
                      participant.id,
                      values as ParticipantFormValues,
                    )
                : mode === "promote"
                  ? () =>
                      participantsState.promote(
                        participant.id,
                        values as ParticipantRoleChangeValues,
                      )
                  : () =>
                      participantsState.demote(
                        participant.id,
                        values as ParticipantRoleChangeValues,
                      );
            const successMessage =
              mode === "edit"
                ? labels.participantUpdated
                : mode === "promote"
                  ? labels.participantPromoted
                  : labels.participantDemoted;
            const fallbackError =
              mode === "edit"
                ? labels.unableToUpdateParticipant
                : mode === "promote"
                  ? labels.unableToPromoteParticipant
                  : labels.unableToDemoteParticipant;

            return runMutation(operation, successMessage, fallbackError).then(
              () => setParticipantEditState(null),
            );
          }}
        />
      ) : null}

      {participantToRemove ? (
        <RemoveParticipantDialog
          labels={removeParticipantDialogLabels(labels)}
          open={Boolean(participantToRemove)}
          participant={participantToRemove}
          isSubmitting={participantsState.isMutating}
          onClose={() => setParticipantToRemove(null)}
          onConfirm={() =>
            runMutation(
              () => participantsState.remove(participantToRemove.id),
              labels.participantRemoved,
              labels.unableToRemoveParticipant,
            ).then(() => setParticipantToRemove(null))
          }
        />
      ) : null}

      {isLeaveConversationOpen ? (
        <LeaveConversationDialog
          labels={leaveConversationDialogLabels(labels)}
          open={isLeaveConversationOpen}
          isSubmitting={participantsState.isMutating}
          onClose={() => setIsLeaveConversationOpen(false)}
          onConfirm={() =>
            runMutation(
              () => participantsState.leave(),
              labels.conversationLeft,
              labels.unableToLeaveConversation,
            ).then(() => setIsLeaveConversationOpen(false))
          }
        />
      ) : null}

      {isInviteOpen ? (
        <CreateInviteDialog
          labels={createInviteDialogLabels(labels)}
          open={isInviteOpen}
          isSubmitting={invitesState.isMutating}
          onClose={() => setIsInviteOpen(false)}
          onSubmit={(values) =>
            runMutation(
              () => invitesState.create(values),
              labels.inviteCreated,
              labels.unableToCreateInvite,
            ).then(() => setIsInviteOpen(false))
          }
        />
      ) : null}

      {rejectInvite ? (
        <RejectInviteDialog
          invite={rejectInvite}
          labels={rejectInviteDialogLabels(labels)}
          open={Boolean(rejectInvite)}
          isSubmitting={invitesState.isMutating}
          onClose={() => setRejectInvite(null)}
          onSubmit={(values) =>
            runMutation(
              () => invitesState.reject(rejectInvite.id, values),
              labels.inviteRejected,
              labels.unableToRejectInvite,
            ).then(() => setRejectInvite(null))
          }
        />
      ) : null}

      {isJoinRequestOpen ? (
        <CreateJoinRequestDialog
          labels={createJoinRequestDialogLabels(labels)}
          open={isJoinRequestOpen}
          isSubmitting={joinRequestsState.isMutating}
          onClose={() => setIsJoinRequestOpen(false)}
          onSubmit={(values) =>
            runMutation(
              () => joinRequestsState.create(values),
              labels.joinRequestCreated,
              labels.unableToCreateJoinRequest,
            ).then(() => setIsJoinRequestOpen(false))
          }
        />
      ) : null}

      {reviewRequest ? (
        <ReviewJoinRequestDialog
          joinRequest={reviewRequest.request}
          labels={reviewJoinRequestDialogLabels(labels)}
          mode={reviewRequest.mode}
          open={Boolean(reviewRequest)}
          isSubmitting={joinRequestsState.isMutating}
          onClose={() => setReviewRequest(null)}
          onSubmit={(values) => {
            const isReject = reviewRequest.mode === "reject";
            return runMutation(
              () =>
                isReject
                  ? joinRequestsState.reject(reviewRequest.request.id, values)
                  : joinRequestsState.approve(reviewRequest.request.id, values),
              isReject
                ? labels.joinRequestRejected
                : labels.joinRequestApproved,
              isReject
                ? labels.unableToRejectJoinRequest
                : labels.unableToApproveJoinRequest,
            ).then(() => setReviewRequest(null));
          }}
        />
      ) : null}
    </div>
  );
}

function ConversationHeader({
  conversation,
  isLoading,
  labels,
  onBack,
  onRefresh,
  readOnly,
}: {
  conversation: Conversation | null;
  isLoading: boolean;
  labels: ConversationRedesignLabels;
  onBack: () => void;
  onRefresh: () => void;
  readOnly: boolean;
}) {
  const title = conversation
    ? getTitle(labels, conversation)
    : labels.untitledConversation;
  const avatar = getAvatarUrl(conversation);
  const participantsCount =
    conversation?.participantsCount ??
    numberValue(
      (conversation as CommunicationRecord | null)?.participants_count,
    );
  const typeLabel = conversationTypeLabel(conversation?.type, labels);

  return (
    <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 md:hidden"
          aria-label={labels.backToConversations}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar avatarUrl={avatar} name={title} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-950">
              {isLoading ? labels.loading : title}
            </h2>
            {readOnly ? (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                <Lock className="h-3 w-3" />
                {labels.readOnly}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs capitalize text-slate-600">
            {typeLabel}
            {participantsCount
              ? ` • ${participantsCount} ${labels.participantsCount}`
              : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-slate-500">
        <button
          type="button"
          disabled
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-primary"
          aria-label={labels.searchMessages}
          title={labels.messageSearchUnavailable}
        >
          {/* TODO: Wire this to backend-supported message search when that API is available. */}
          <Search className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-primary"
          aria-label={labels.refreshConversation}
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function ConversationTabs({
  activeTab,
  labels,
  onTabChange,
}: {
  activeTab: DetailTab;
  labels: ConversationRedesignLabels;
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
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-primary"
          }`}
        >
          {labels[tab.labelKey]}
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
  labels,
  locale,
  messages,
  onAddReaction,
  onAttachFile,
  onDeleteAttachment,
  onDeleteMessage,
  onEditMessage,
  onRemoveReaction,
  readSummary,
  reactionsByMessageId,
  typingUsers,
  userDisplayNames,
  uploadingMessageId,
}: {
  allowAttachments: boolean;
  allowReactions: boolean;
  attachmentsByMessageId: Record<string, MessageAttachment[]>;
  currentUserId?: string | null;
  currentUserName: string;
  error: string | null;
  isLoading: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  messages: ConversationMessage[];
  onAddReaction: (messageId: string) => Promise<unknown>;
  onAttachFile: (messageId: string, file: File) => Promise<unknown>;
  onDeleteAttachment: (
    messageId: string,
    attachmentId: string,
  ) => Promise<unknown>;
  onDeleteMessage: (messageId: string) => Promise<unknown>;
  onEditMessage: (messageId: string, body: string) => Promise<unknown>;
  onRemoveReaction: (messageId: string) => Promise<unknown>;
  readSummary: { readCount?: number; unreadCount?: number };
  reactionsByMessageId: Record<string, MessageReaction[]>;
  typingUsers: Array<{ userId: string; name?: string }>;
  userDisplayNames: UserDisplayNameMap;
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
    return <CenteredState label={labels.loadingMessages} />;
  }

  if (error) {
    return <CenteredState label={error} />;
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-6">
        <div className="self-center rounded-full bg-slate-200 px-4 py-1 text-xs font-medium text-slate-700">
          {labels.today}
        </div>

        {messages.length === 0 ? (
          <CenteredState label={labels.noMessagesYetFull} />
        ) : null}

        {messages.map((message) => {
          const own = isOwnMessage(message, currentUserId);
          return (
            <MessageBubble
              key={message.clientMessageId ?? message.id}
              allowAttachments={allowAttachments}
              allowReactions={allowReactions}
              attachments={
                attachmentsByMessageId[message.id] ?? message.attachments ?? []
              }
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isOwn={own}
              isUploadingAttachment={uploadingMessageId === message.id}
              labels={labels}
              locale={locale}
              message={message}
              onAddReaction={() => onAddReaction(message.id)}
              onAttachFile={(file) => onAttachFile(message.id, file)}
              onDeleteAttachment={(attachmentId) =>
                onDeleteAttachment(message.id, attachmentId)
              }
              onDeleteMessage={() => onDeleteMessage(message.id)}
              onEditMessage={(body) => onEditMessage(message.id, body)}
              onRemoveReaction={() => onRemoveReaction(message.id)}
              readSummary={readSummary}
              reactions={reactionsByMessageId[message.id] ?? []}
              userDisplayNames={userDisplayNames}
            />
          );
        })}

        {typingUsers.length > 0 ? (
          <div className="flex items-center gap-2 text-xs italic text-slate-500">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            </span>
            {typingUsers
              .map(
                (user) =>
                  user.name ||
                  displayNameForUserId(
                    user.userId,
                    userDisplayNames,
                    labels.someone,
                  ),
              )
              .join(", ")}{" "}
            {labels.typing}
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
  currentUserId,
  currentUserName,
  isOwn,
  isUploadingAttachment,
  labels,
  locale,
  message,
  onAddReaction,
  onAttachFile,
  onDeleteAttachment,
  onDeleteMessage,
  onEditMessage,
  onRemoveReaction,
  readSummary,
  reactions,
  userDisplayNames,
}: {
  allowAttachments: boolean;
  allowReactions: boolean;
  attachments: MessageAttachment[];
  currentUserId?: string | null;
  currentUserName: string;
  isOwn: boolean;
  isUploadingAttachment: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  message: ConversationMessage;
  onAddReaction: () => Promise<unknown>;
  onAttachFile: (file: File) => Promise<unknown>;
  onDeleteAttachment: (attachmentId: string) => Promise<unknown>;
  onDeleteMessage: () => Promise<unknown>;
  onEditMessage: (body: string) => Promise<unknown>;
  onRemoveReaction: () => Promise<unknown>;
  readSummary: { readCount?: number; unreadCount?: number };
  reactions: MessageReaction[];
  userDisplayNames: UserDisplayNameMap;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(message.body ?? "");
  const [isActionPending, setIsActionPending] = useState(false);
  const senderName = isOwn
    ? currentUserName || labels.you
    : actorName(message.sender) ||
      displayNameForUserId(
        messageSenderUserId(message),
        userDisplayNames,
        labels.participant,
      );
  const avatar = getAvatarUrl(message.sender);
  const thumbsUpCount = reactions.filter(
    (reaction) => reaction.type === "thumbs_up",
  ).length;
  const hasOwnReaction = Boolean(
    currentUserId &&
    reactions.some(
      (reaction) =>
        reaction.type === "thumbs_up" &&
        (reaction.userId === currentUserId ||
          reaction.actor?.userId === currentUserId ||
          reaction.actor?.id === currentUserId),
    ),
  );
  const edited = Boolean(
    message.updatedAt && message.updatedAt !== message.createdAt,
  );
  const deleted = message.status === "deleted";
  const canMutateMessage =
    isOwn &&
    !deleted &&
    message.deliveryStatus !== "pending" &&
    message.deliveryStatus !== "failed";
  const readByCount = (message.readByUserIds ?? []).filter(
    (id) => id !== currentUserId,
  ).length;
  const readIndicator =
    isOwn && message.deliveryStatus === "sent"
      ? readByCount > 0
        ? labels.readBy.replace("{count}", String(readByCount))
        : typeof readSummary.readCount === "number" && readSummary.readCount > 0
          ? labels.readBy.replace("{count}", String(readSummary.readCount))
          : labels.sent
      : null;

  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await onAttachFile(file);
  };

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draftBody.trim();
    if (!trimmed || trimmed === (message.body ?? "").trim()) {
      setIsEditing(false);
      return;
    }
    setIsActionPending(true);
    try {
      await onEditMessage(trimmed);
      setIsEditing(false);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDelete = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(labels.deleteMessageConfirm)
    )
      return;
    setIsActionPending(true);
    try {
      await onDeleteMessage();
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReaction = async () => {
    if (!allowReactions) return;
    setIsActionPending(true);
    try {
      if (hasOwnReaction) {
        await onRemoveReaction();
      } else {
        await onAddReaction();
      }
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <article
      className={`group flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {!isOwn ? (
        <Avatar avatarUrl={avatar} name={senderName} size="sm" />
      ) : null}

      {isOwn ? (
        <BubbleActionButton
          allowAttachments={allowAttachments && canMutateMessage}
          allowReactions={allowReactions}
          fileInputRef={fileInputRef}
          labels={labels}
          onAddReaction={handleReaction}
        />
      ) : null}

      <div
        className={`flex max-w-[min(640px,78vw)] flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {!isOwn ? (
          <div className="mb-1 ml-1 text-xs font-medium text-slate-600">
            {senderName}
          </div>
        ) : null}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isOwn
              ? "rounded-br-md bg-primary text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-950"
          }`}
        >
          {isEditing ? (
            <form
              onSubmit={(event) => void handleEditSubmit(event)}
              className="space-y-2"
            >
              <TextArea
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
                className="min-h-20 w-full min-w-[280px] resize-none rounded-lg border border-white/40 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isActionPending}
                resize="none"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraftBody(message.body ?? "");
                    setIsEditing(false);
                  }}
                  className="px-2 py-1 text-xs font-bold text-slate-600"
                  disabled={isActionPending}
                >
                  {labels.cancel}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="px-2.5 py-1 text-xs font-bold"
                  loading={isActionPending}
                >
                  {labels.save}
                </Button>
              </div>
            </form>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6">
              {deleted ? labels.messageDeleted : message.body}
            </p>
          )}

          {attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  canDelete={canMutateMessage}
                  isOwn={isOwn}
                  labels={labels}
                  onDelete={() => onDeleteAttachment(attachment.id)}
                />
              ))}
            </div>
          ) : null}

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOwn ? "text-white/80" : "text-slate-400"}`}
          >
            {message.deliveryStatus === "pending" ? (
              <span>{labels.sending}</span>
            ) : null}
            {message.deliveryStatus === "failed" ? (
              <span>{labels.failed}</span>
            ) : null}
            {edited ? <span>{labels.edited}</span> : null}
            <span>{formatTime(message.createdAt, locale)}</span>
            {isOwn && message.deliveryStatus !== "failed" ? (
              <Check className="h-3 w-3" />
            ) : null}
          </div>
        </div>

        {canMutateMessage ? (
          <div className="mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setDraftBody(message.body ?? "");
                setIsEditing(true);
              }}
              disabled={isActionPending}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm hover:text-primary disabled:opacity-60"
            >
              <Edit3 className="h-3 w-3" />
              {labels.editMessage}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isActionPending}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-white px-2 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 className="h-3 w-3" />
              {labels.deleteMessage}
            </button>
          </div>
        ) : null}

        {thumbsUpCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleReaction()}
            disabled={isActionPending || !allowReactions}
            className={`mt-1 inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs shadow-sm transition disabled:opacity-60 ${
              hasOwnReaction
                ? "border-primary-200 bg-primary-50 text-primary"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>
              <ThumbsUp className="h-3 w-3" />
            </span>
            <span>{thumbsUpCount}</span>
          </button>
        ) : null}
        {readIndicator ? (
          <span className="mt-1 text-[10px] text-slate-500">
            {readIndicator}
          </span>
        ) : null}
        {isUploadingAttachment ? (
          <span className="mt-1 text-xs text-slate-500">
            {labels.uploadingAttachment}
          </span>
        ) : null}
      </div>

      {!isOwn ? (
        <BubbleActionButton
          allowAttachments={false}
          allowReactions={allowReactions}
          fileInputRef={fileInputRef}
          labels={labels}
          onAddReaction={handleReaction}
        />
      ) : null}

      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        fullWidth={false}
        onChange={(event) => void handleAttach(event)}
      />
    </article>
  );
}

function BubbleActionButton({
  allowAttachments,
  allowReactions,
  fileInputRef,
  labels,
  onAddReaction,
}: {
  allowAttachments: boolean;
  allowReactions: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  labels: ConversationRedesignLabels;
  onAddReaction: () => Promise<unknown>;
}) {
  if (!allowAttachments && !allowReactions) return null;
  return (
    <div className="flex translate-y-[-6px] items-center gap-1 opacity-0 transition group-hover:opacity-100">
      {allowReactions ? (
        <button
          type="button"
          onClick={() => void onAddReaction()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-primary"
          aria-label={labels.reactionAdded}
        >
          <Smile className="h-4 w-4" />
        </button>
      ) : null}
      {allowAttachments ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-primary"
          aria-label={labels.attachFileToMessage}
        >
          <Paperclip className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function AttachmentCard({
  attachment,
  canDelete,
  isOwn,
  labels,
  onDelete,
}: {
  attachment: MessageAttachment;
  canDelete: boolean;
  isOwn: boolean;
  labels: ConversationRedesignLabels;
  onDelete: () => Promise<unknown>;
}) {
  const file = attachment.file;
  const name =
    attachment.name ||
    file?.originalName ||
    file?.filename ||
    attachment.url?.split("/").pop() ||
    labels.attachment;
  const size = formatFileSize(attachment.size || file?.size);
  const href = attachment.url || file?.url;
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (
      typeof window !== "undefined" &&
      !window.confirm(labels.deleteAttachmentConfirm)
    )
      return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const content = (
    <div
      className={`flex min-w-[260px] items-center gap-3 rounded-lg p-3 ${
        isOwn ? "bg-primary-700/50" : "bg-slate-100"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${isOwn ? "bg-primary-400" : "bg-white"}`}
      >
        <FileText
          className={`h-5 w-5 ${isOwn ? "text-white" : "text-primary"}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{name}</span>
        {size ? <span className="block text-xs opacity-85">{size}</span> : null}
      </span>
      {canDelete ? (
        <button
          type="button"
          onClick={(event) => void handleDelete(event)}
          disabled={isDeleting}
          className={`ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:opacity-60 ${
            isOwn
              ? "text-white/80 hover:bg-white/10"
              : "text-rose-700 hover:bg-rose-50"
          }`}
          aria-label={labels.deleteAttachmentConfirm}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  if (!href || canDelete) return content;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  );
}

function MessageComposer({
  disabled,
  labels,
  maxLength,
  onAttachToLastMessage,
  onSend,
  onStopTyping,
  onTyping,
}: {
  disabled: boolean;
  labels: ConversationRedesignLabels;
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
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="shrink-0 border-t border-slate-200 bg-white p-4"
    >
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-primary"
          aria-label={labels.attachFile}
          disabled={disabled || isSubmitting}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <Input
          ref={fileInputRef}
          type="file"
          className="hidden"
          fullWidth={false}
          onChange={(event) => void handleAttach(event)}
        />
        <div className="min-w-0 flex-1">
          <Input
            value={body}
            onBlur={onStopTyping}
            onChange={(event) => {
              setBody(event.target.value);
              onTyping();
            }}
            placeholder={labels.writeMessage}
            maxLength={maxLength}
            disabled={disabled || isSubmitting}
            className="h-12 border-0 bg-transparent px-0 py-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-primary"
          aria-label={labels.emoji}
          disabled={disabled || isSubmitting}
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={disabled || isSubmitting || !body.trim()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-500 transition enabled:bg-primary enabled:text-white enabled:hover:bg-hover"
          aria-label={labels.send}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}

function ReadOnlyComposer({ labels }: { labels: ConversationRedesignLabels }) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
        {labels.readOnlyComposer}
      </div>
    </div>
  );
}

function ParticipantsPanel({
  canLeaveConversation,
  canManage,
  currentUserId,
  error,
  isLoading,
  labels,
  locale,
  onAddParticipant,
  onDemoteParticipant,
  onEditParticipant,
  onLeaveConversation,
  onPromoteParticipant,
  onRemoveParticipant,
  participants,
  presenceByUserId,
  total,
  userDisplayNames,
}: {
  canLeaveConversation: boolean;
  canManage: boolean;
  currentUserId?: string | null;
  error: string | null;
  isLoading: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  onAddParticipant: () => void;
  onDemoteParticipant: (participant: ConversationParticipant) => void;
  onEditParticipant: (participant: ConversationParticipant) => void;
  onLeaveConversation: () => void;
  onPromoteParticipant: (participant: ConversationParticipant) => void;
  onRemoveParticipant: (participant: ConversationParticipant) => void;
  participants: ConversationParticipant[];
  presenceByUserId: Record<string, { isOnline?: boolean }>;
  total: number;
  userDisplayNames: UserDisplayNameMap;
}) {
  return (
    <PanelLayout
      action={
        <div className="flex flex-wrap justify-end gap-2">
          {canLeaveConversation ? (
            <button
              type="button"
              onClick={onLeaveConversation}
              className="inline-flex h-9 items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
            >
              {labels.leaveConversation}
            </button>
          ) : null}
          {canManage ? (
            <ActionButton
              icon={<UserPlus className="h-4 w-4" />}
              onClick={onAddParticipant}
            >
              {labels.addParticipant}
            </ActionButton>
          ) : null}
        </div>
      }
      title={`${labels.participants} (${total || participants.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {participants.length === 0 ? (
            <PanelState label={labels.participants} />
          ) : null}
          {participants.map((participant) => {
            const userId = participantUserId(participant);
            const name =
              actorName(participant.actor) ||
              displayNameForUserId(userId, userDisplayNames, labels.participant);
            const isCurrentUser = currentUserId && userId === currentUserId;
            const isOnline = Boolean(presenceByUserId[userId]?.isOnline);
            const canManageThisParticipant = canManage && !isCurrentUser;
            return (
              <div
                key={participant.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    avatarUrl={getAvatarUrl(participant.actor)}
                    name={name}
                    online={isOnline}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-950">
                        {name}
                      </p>
                      {participant.role === "owner" ? (
                        <StatusPill tone="blue">{labels.owner}</StatusPill>
                      ) : null}
                      {participant.status === "muted" ? (
                        <StatusPill tone="orange">{labels.muted}</StatusPill>
                      ) : null}
                      {isCurrentUser ? (
                        <StatusPill tone="green">{labels.you}</StatusPill>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-600">
                      {labels.joined}{" "}
                      {formatRelativeDate(participant.joinedAt, locale) ||
                        labels.recently}
                    </p>
                  </div>
                </div>
                {canManageThisParticipant ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <ParticipantActionButton
                      onClick={() => onEditParticipant(participant)}
                    >
                      {labels.editParticipant}
                    </ParticipantActionButton>
                    <ParticipantActionButton
                      onClick={() => onPromoteParticipant(participant)}
                    >
                      {labels.promote}
                    </ParticipantActionButton>
                    <ParticipantActionButton
                      onClick={() => onDemoteParticipant(participant)}
                    >
                      {labels.demote}
                    </ParticipantActionButton>
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(participant)}
                      className="h-8 rounded-md border border-rose-200 px-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      {labels.removeParticipant}
                    </button>
                  </div>
                ) : null}
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
  canManage,
  currentUserId,
  error,
  invites,
  isLoading,
  isMutating,
  labels,
  locale,
  onAcceptInvite,
  onCreateInvite,
  onRejectInvite,
  total,
  userDisplayNames,
}: {
  canCreate: boolean;
  canManage: boolean;
  currentUserId?: string | null;
  error: string | null;
  invites: ConversationInvite[];
  isLoading: boolean;
  isMutating: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  onAcceptInvite: (invite: ConversationInvite) => Promise<unknown>;
  onCreateInvite: () => void;
  onRejectInvite: (invite: ConversationInvite) => void;
  total: number;
  userDisplayNames: UserDisplayNameMap;
}) {
  return (
    <PanelLayout
      action={
        canCreate ? (
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            onClick={onCreateInvite}
          >
            {labels.createInvite}
          </ActionButton>
        ) : null
      }
      title={`${labels.invites} (${total || invites.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {invites.length === 0 ? <PanelState label={labels.invites} /> : null}
          {invites.map((invite) => {
            const invitedUserId =
              invite.invitedUserId ||
              invite.invitedUser?.userId ||
              invite.invitedUser?.id ||
              "";
            const name =
              actorName(invite.invitedUser) ||
              displayNameForUserId(
                invitedUserId,
                userDisplayNames,
                labels.invitedUser,
              );
            const isPending = !invite.status || invite.status === "pending";
            const isCurrentUserInvite = Boolean(
              currentUserId && invitedUserId === currentUserId,
            );
            const canRespondToInvite = isPending && isCurrentUserInvite;
            const canRejectInvite =
              isPending && (canManage || isCurrentUserInvite);
            return (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    avatarUrl={getAvatarUrl(invite.invitedUser)}
                    name={name}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {labels.expires}:{" "}
                      {formatDate(invite.expiresAt, locale) ||
                        labels.noExpiration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill
                    tone={
                      invite.status === "accepted"
                        ? "green"
                        : isPending
                          ? "orange"
                          : "red"
                    }
                  >
                    {statusLabel(invite.status, labels)}
                  </StatusPill>
                  {canRespondToInvite ? (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void onAcceptInvite(invite)}
                      className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {labels.acceptInvite}
                    </button>
                  ) : null}
                  {canRejectInvite ? (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void onRejectInvite(invite)}
                      className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {canManage && !isCurrentUserInvite
                        ? labels.revokeInvite
                        : labels.rejectInvite}
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
  labels,
  locale,
  onCreateRequest,
  onReject,
  onReview,
  total,
  userDisplayNames,
}: {
  canCreate: boolean;
  canReview: boolean;
  error: string | null;
  isLoading: boolean;
  joinRequests: ConversationJoinRequest[];
  labels: ConversationRedesignLabels;
  locale: string;
  onCreateRequest: () => void;
  onReject: (request: ConversationJoinRequest) => void;
  onReview: (request: ConversationJoinRequest) => void;
  total: number;
  userDisplayNames: UserDisplayNameMap;
}) {
  return (
    <PanelLayout
      action={
        canCreate ? (
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            onClick={onCreateRequest}
          >
            {labels.createJoinRequest}
          </ActionButton>
        ) : null
      }
      title={`${labels.joinRequests} (${total || joinRequests.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {joinRequests.length === 0 ? (
            <PanelState label={labels.joinRequests} />
          ) : null}
          {joinRequests.map((request) => {
            const name =
              actorName(request.user) ||
              displayNameForUserId(
                request.userId,
                userDisplayNames,
                labels.requester,
              );
            return (
              <div
                key={request.id}
                className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-5 last:border-b-0"
              >
                <div className="flex min-w-0 gap-3">
                  <Avatar avatarUrl={getAvatarUrl(request.user)} name={name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {name}
                    </p>
                    {request.note ? (
                      <p className="mt-2 rounded bg-slate-100 px-3 py-2 text-sm italic text-slate-600">
                        &quot;{request.note}&quot;
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {formatRelativeDate(request.createdAt, locale) ||
                        labels.today}
                    </p>
                  </div>
                </div>
                {canReview && request.status === "pending" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void onReject(request)}
                      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {labels.rejectRequest}
                    </button>
                    <button
                      type="button"
                      onClick={() => onReview(request)}
                      className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-hover"
                    >
                      {labels.reviewJoinRequest}
                    </button>
                  </div>
                ) : (
                  <StatusPill
                    tone={
                      request.status === "approved"
                        ? "green"
                        : request.status === "rejected"
                          ? "red"
                          : "orange"
                    }
                  >
                    {statusLabel(request.status, labels)}
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
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-50 px-3 text-sm font-bold text-primary transition hover:bg-primary-100"
    >
      {icon}
      {children}
    </button>
  );
}

function ParticipantActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 rounded-md border border-slate-200 px-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-primary"
    >
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
    blue: "bg-primary-50 text-primary",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function PanelState({ label }: { label: string }) {
  return (
    <div className="px-4 py-6 text-center text-sm text-slate-500">{label}</div>
  );
}

function CenteredState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
      {label}
    </div>
  );
}

function EmptyDetail({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
      {label}
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
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-100 to-primary-300 font-bold text-primary-900 ${sizes[size]}`}
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
        <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      ) : null}
    </div>
  );
}

function ToastMessage({
  closeLabel,
  message,
  onClose,
  tone,
}: {
  closeLabel: string;
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
    <div
      className={`absolute bottom-5 left-1/2 z-50 flex max-w-[min(520px,90vw)] -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${classes[tone]}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 hover:bg-white/60"
        aria-label={closeLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
