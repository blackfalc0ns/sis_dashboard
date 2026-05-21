import {
  type ChangeEvent,
  type ComponentType,
  Fragment,
  type FormEvent,
  type MouseEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Angry,
  Check,
  CheckCheck,
  Clock,
  Edit3,
  FileText,
  Frown,
  Heart,
  Laugh,
  Mic,
  Paperclip,
  Send,
  Smile,
  SmilePlus,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import type { ReactionType } from "@/features/communication/types/message.types";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { CenteredState } from "@/features/communication/conversations_redesign/components/PanelLayout";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import type { MessageAttachment, MessageReaction } from "@/features/communication/types/message.types";
import {
  actorName,
  displayNameForUserId,
  getAvatarUrl,
} from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  formatFileSize,
  formatMessageDateSeparator,
  formatTime,
  isOwnMessage,
  localDateKey,
  messageSenderUserId,
} from "@/features/communication/conversations_redesign/utils/formatters";

/* ------------------------------------------------------------------ */
/* Reaction picker options                                             */
/* ------------------------------------------------------------------ */

const REACTION_OPTIONS: {
  type: ReactionType;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  color: string;
}[] = [
  { type: "thumbs_up", icon: ThumbsUp, label: "👍 Thumbs Up", color: "text-blue-600" },
  { type: "love", icon: Heart, label: "❤️ Love", color: "text-rose-500" },
  { type: "laugh", icon: Laugh, label: "😂 Laugh", color: "text-amber-500" },
  { type: "wow", icon: SmilePlus, label: "😮 Wow", color: "text-amber-600" },
  { type: "sad", icon: Frown, label: "😢 Sad", color: "text-indigo-500" },
  { type: "angry", icon: Angry, label: "😡 Angry", color: "text-red-600" },
  { type: "thumbs_down", icon: ThumbsDown, label: "👎 Thumbs Down", color: "text-slate-600" },
  { type: "like", icon: ThumbsUp, label: "👍 Like", color: "text-blue-500" },
];

export function MessagesPanel({
  allowAttachments,
  allowReactions,
  attachmentsByMessageId,
  currentUserId,
  currentUserName,
  error,
  hasOlderMessages,
  isLoading,
  isLoadingOlder,
  labels,
  locale,
  messages,
  onAddReaction,
  onAttachFile,
  onDeleteAttachment,
  onDeleteMessage,
  onEditMessage,
  onLoadOlder,
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
  hasOlderMessages: boolean;
  isLoading: boolean;
  isLoadingOlder: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  messages: ConversationMessage[];
  onAddReaction: (messageId: string, type: ReactionType) => Promise<unknown>;
  onAttachFile: (messageId: string, file: File) => Promise<unknown>;
  onDeleteAttachment: (
    messageId: string,
    attachmentId: string,
  ) => Promise<unknown>;
  onDeleteMessage: (messageId: string) => Promise<unknown>;
  onEditMessage: (messageId: string, body: string) => Promise<unknown>;
  onLoadOlder: () => void;
  onRemoveReaction: (messageId: string) => Promise<unknown>;
  readSummary: { readCount?: number; unreadCount?: number };
  reactionsByMessageId: Record<string, MessageReaction[]>;
  typingUsers: Array<{ userId: string; name?: string }>;
  userDisplayNames: UserDisplayNameMap;
  uploadingMessageId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);

  // Scroll to bottom on initial load and when new messages arrive at the bottom
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;

    if (isInitialLoadRef.current) {
      // Initial load — scroll to bottom immediately
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
      prevMessageCountRef.current = messages.length;
      return;
    }

    // If messages were added at the bottom (new message), scroll to bottom
    if (messages.length > prevMessageCountRef.current) {
      const wasNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (wasNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Detect scroll to top for loading older messages
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasOlderMessages && !isLoadingOlder) {
        onLoadOlder();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasOlderMessages, isLoadingOlder, onLoadOlder]);

  // Preserve scroll position when older messages are prepended
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    // If scroll is at the very top after prepend, nudge it down to show new content
    if (container.scrollTop === 0 && messages.length > 0 && !isInitialLoadRef.current) {
      // The browser will have already adjusted; we just need to not auto-scroll to bottom
    }
  }, [messages]);

  if (isLoading) {
    return <CenteredState label={labels.loadingMessages} />;
  }

  if (error) {
    return <CenteredState label={error} />;
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-5 md:gap-6">
        {/* Loading older messages indicator */}
        {isLoadingOlder ? (
          <div className="flex justify-center py-3">
            <span className="text-xs text-slate-500">{labels.loading}</span>
          </div>
        ) : null}

        {!hasOlderMessages && messages.length > 0 ? (
          <div className="flex justify-center py-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
              {labels.noMessagesYet}
            </span>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <CenteredState label={labels.noMessagesYetFull} />
        ) : null}

        {messages.map((message, index) => {
          const own = isOwnMessage(message, currentUserId);
          const messageDateKey = localDateKey(message.createdAt);
          const previousMessageDateKey = localDateKey(
            messages[index - 1]?.createdAt,
          );
          const shouldShowDateSeparator =
            Boolean(messageDateKey) && messageDateKey !== previousMessageDateKey;

          return (
            <Fragment key={message.clientMessageId ?? message.id}>
              {shouldShowDateSeparator ? (
                <div className="self-center rounded-full bg-slate-200 px-4 py-1 text-xs font-medium text-slate-700">
                  {formatMessageDateSeparator(message.createdAt, locale, labels)}
                </div>
              ) : null}
              <MessageBubble
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
                onAddReaction={(type: ReactionType) => onAddReaction(message.id, type)}
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
            </Fragment>
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
  onAddReaction: (type: ReactionType) => Promise<unknown>;
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
  const groupedReactions = reactions.reduce<Record<string, MessageReaction[]>>(
    (groups, reaction) => {
      const key = reaction.type || "like";
      return { ...groups, [key]: [...(groups[key] ?? []), reaction] };
    },
    {},
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
  const readByOthersCount = (message.readByUserIds ?? []).filter(
    (id) => id !== currentUserId,
  ).length;
  // For own messages: only show blue checks when someone ELSE has read it
  // For others' messages: not applicable (checks only show on own messages)
  // readByOthersCount comes from realtime events (explicit other-user reads)
  // message.readCount from API includes self-reads, so for own messages we subtract 1
  const apiReadByOthers = typeof message.readCount === "number"
    ? Math.max(0, message.readCount - 1)
    : 0;
  const isRead = isOwn
    ? readByOthersCount > 0 || apiReadByOthers > 0
    : false;

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

  const handleReaction = async (type: ReactionType) => {
    if (!allowReactions) return;
    setIsActionPending(true);
    try {
      await onAddReaction(type);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRemoveReaction = async () => {
    if (!allowReactions) return;
    setIsActionPending(true);
    try {
      await onRemoveReaction();
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
        className={`flex max-w-[min(560px,78vw)] flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {!isOwn ? (
          <div className="mb-1 ms-1 text-xs font-medium text-slate-600">
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
            {edited ? <span>{labels.edited}</span> : null}
            <span>{formatTime(message.createdAt, locale)}</span>
            {isOwn ? (
              <MessageStatusIcon
                deliveryStatus={message.deliveryStatus}
                isRead={isRead}
                isOwn={isOwn}
              />
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

        {Object.keys(groupedReactions).length > 0 ? (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {Object.entries(groupedReactions).map(([type, items]) => {
              const meta = REACTION_OPTIONS.find((r) => r.type === type);
              const Icon = meta?.icon ?? ThumbsUp;
              const isOwnType = items.some(
                (r) =>
                  r.userId === currentUserId ||
                  r.actor?.userId === currentUserId ||
                  r.actor?.id === currentUserId,
              );
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    void (isOwnType
                      ? handleRemoveReaction()
                      : handleReaction(type as ReactionType))
                  }
                  disabled={isActionPending || !allowReactions}
                  className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs shadow-sm transition disabled:opacity-60 ${
                    isOwnType
                      ? "border-primary-200 bg-primary-50 text-primary"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                  title={meta?.label ?? type}
                >
                  <Icon className="h-3 w-3" aria-hidden />
                  <span>{items.length}</span>
                </button>
              );
            })}
          </div>
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
  onAddReaction: (type: ReactionType) => Promise<unknown>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handleClickOutside = (event: Event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  if (!allowAttachments && !allowReactions) return null;
  return (
    <div className="relative flex translate-y-[-6px] items-center gap-1 opacity-0 transition group-hover:opacity-100">
      {allowReactions ? (
        <>
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-primary"
            aria-label={labels.reactionAdded}
          >
            <Smile className="h-4 w-4" />
          </button>
          {showPicker ? (
            <div
              ref={pickerRef}
              className="absolute bottom-full z-50 mb-2 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              {REACTION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setShowPicker(false);
                      void onAddReaction(option.type);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:scale-110"
                    title={option.label}
                    aria-label={option.label}
                  >
                    <Icon className={`h-4 w-4 ${option.color}`} aria-hidden />
                  </button>
                );
              })}
            </div>
          ) : null}
        </>
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
    (file as Record<string, unknown> | undefined)?.displayName as string ||
    attachment.url?.split("/").pop() ||
    labels.attachment;
  const size = formatFileSize(
    attachment.size ||
    file?.size ||
    (file as Record<string, unknown> | undefined)?.sizeBytes as string | undefined,
  );
  const fileId = attachment.fileId || file?.id;
  const href = attachment.url || file?.url || (fileId ? `${process.env.NEXT_PUBLIC_API_URL || "https://api.moazez.sa/api/v1"}/files/${fileId}/download` : undefined);
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
      {fileId ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleDownload();
          }}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
            isOwn
              ? "text-white/80 hover:bg-white/10"
              : "text-primary hover:bg-primary/10"
          }`}
          aria-label="Download"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={(event) => void handleDelete(event)}
          disabled={isDeleting}
          className={`ms-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:opacity-60 ${
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

  const handleDownload = async () => {
    if (!fileId) return;
    try {
      const { apiClient: client } = await import("@/lib/api");
      // Fetch the file as a blob (axios follows the 307 redirect to S3)
      const response = await client.get(`/files/${fileId}/download`, {
        responseType: "blob",
      });
      // Create a download link from the blob
      const blob = new Blob([response.data as BlobPart]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open the URL directly (might work for public files)
      if (href) window.open(href, "_blank");
    }
  };

  return content;
}

/* ------------------------------------------------------------------ */
/* Message status checks (WhatsApp-style)                              */
/* ------------------------------------------------------------------ */

function MessageStatusIcon({
  deliveryStatus,
  isRead,
  isOwn,
}: {
  deliveryStatus?: string;
  isRead: boolean;
  isOwn: boolean;
}) {
  if (!isOwn) return null;

  // Pending — clock icon
  if (deliveryStatus === "pending") {
    return <Clock className="h-3.5 w-3.5" style={{ opacity: 0.6 }} />;
  }

  // Failed — red indicator
  if (deliveryStatus === "failed") {
    return (
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
        !
      </span>
    );
  }

  // Read — double blue check (override parent color)
  if (isRead) {
    return <CheckCheck className="h-4 w-4" style={{ color: "#38bdf8" }} />;
  }

  // Sent/delivered — double check (visible on both light and dark backgrounds)
  return <CheckCheck className="h-4 w-4" style={{ opacity: 0.7 }} />;
}

export function MessageComposer({
  disabled,
  labels,
  maxLength,
  onSend,
  onSendWithAttachment,
  onStopTyping,
  onTyping,
}: {
  disabled: boolean;
  labels: ConversationRedesignLabels;
  maxLength?: number;
  onSend: (body: string) => Promise<unknown>;
  onSendWithAttachment: (file: File, caption: string) => Promise<unknown>;
  onStopTyping: () => void;
  onTyping: () => void;
}) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || disabled) return;

    // If there's a pending file, send message + attachment together
    if (pendingFile) {
      setIsSubmitting(true);
      try {
        await onSendWithAttachment(pendingFile, body.trim());
        setBody("");
        setPendingFile(null);
        onStopTyping();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Normal text-only send
    const trimmed = body.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onSend(trimmed);
      setBody("");
      onStopTyping();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;
    setPendingFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      // Microphone permission denied or not available
    }
  };

  const stopAndSendRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;

    // Stop recording and wait for data
    const audioBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        resolve(blob);
      };
      mediaRecorder.stop();
    });

    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (audioBlob.size === 0) return;

    // Create a File from the blob and send as attachment
    const extension = mediaRecorder.mimeType.includes("webm") ? "webm" : "ogg";
    const audioFile = new File(
      [audioBlob],
      `voice-note-${Date.now()}.${extension}`,
      { type: mediaRecorder.mimeType },
    );

    setIsSubmitting(true);
    try {
      await onSendWithAttachment(audioFile, "🎤");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const canSend = Boolean(pendingFile) || Boolean(body.trim());
  const showMicButton = !canSend && !pendingFile && !isRecording;

  // Recording UI
  if (isRecording) {
    return (
      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4">
          <button
            type="button"
            onClick={cancelRecording}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-700"
            aria-label={labels.cancel}
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-xs text-red-600">{labels.recording}</span>
          </div>
          <button
            type="button"
            onClick={() => void stopAndSendRecording()}
            disabled={isSubmitting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-hover disabled:opacity-60"
            aria-label={labels.send}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="shrink-0 border-t border-slate-200 bg-white p-4"
    >
      {/* File preview bar */}
      {pendingFile ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
            {pendingFile.name}
          </span>
          <span className="shrink-0 text-xs text-slate-500">
            {pendingFile.size < 1024 * 1024
              ? `${Math.max(1, Math.round(pendingFile.size / 1024))} KB`
              : `${(pendingFile.size / 1024 / 1024).toFixed(1)} MB`}
          </span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label={labels.cancel}
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
      ) : null}

      <div className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3">
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
          onChange={(event) => void handleFileSelect(event)}
        />
        <div className="min-w-0 flex-1">
          <Input
            value={body}
            onBlur={onStopTyping}
            onChange={(event) => {
              setBody(event.target.value);
              onTyping();
            }}
            placeholder={pendingFile ? labels.addCaption : labels.writeMessage}
            maxLength={maxLength}
            disabled={disabled || isSubmitting}
            className="h-12 border-0 bg-transparent px-0 py-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <EmojiPickerButton
          disabled={disabled || isSubmitting}
          labels={labels}
          onSelect={(emoji) => setBody((prev) => prev + emoji)}
        />
        {showMicButton ? (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={disabled || isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"
            aria-label={labels.voiceNote}
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || isSubmitting || !canSend}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-500 transition enabled:bg-primary enabled:text-white enabled:hover:bg-hover"
            aria-label={labels.send}
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
}

export function ReadOnlyComposer({ labels }: { labels: ConversationRedesignLabels }) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
        {labels.readOnlyComposer}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Emoji Picker                                                        */
/* ------------------------------------------------------------------ */

import EmojiPicker, { type EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";

function EmojiPickerButton({
  disabled,
  labels,
  onSelect,
}: {
  disabled: boolean;
  labels: ConversationRedesignLabels;
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-primary"
        aria-label={labels.emoji}
        disabled={disabled}
      >
        <Smile className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute bottom-full end-0 z-50 mb-2">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.LIGHT}
            width={350}
            height={400}
            searchPlaceHolder={labels.emoji}
            lazyLoadEmojis
          />
        </div>
      ) : null}
    </div>
  );
}

