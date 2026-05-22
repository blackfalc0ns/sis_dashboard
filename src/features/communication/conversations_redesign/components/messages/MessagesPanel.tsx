import { Fragment, useEffect, useRef, useState } from "react";
import { CenteredState } from "@/features/communication/conversations_redesign/components/PanelLayout";
import { displayNameForUserId } from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  formatMessageDateSeparator,
  isOwnMessage,
  localDateKey,
  messageSenderUserId,
} from "@/features/communication/conversations_redesign/utils/formatters";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import type {
  MessageAttachment,
  MessageReaction,
  ReactionType,
} from "@/features/communication/types/message.types";
import { MessageBubble } from "./MessageBubble";

export function MessagesPanel({
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
  onStartEdit,
  onLoadOlder,
  onInfo,
  onRemoveReaction,
  onReply,
  onReport,
  reactionsByMessageId,
  typingUsers,
  userDisplayNames,
  uploadingMessageId,
}: {
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
  onStartEdit: (messageId: string, body: string) => void;
  onLoadOlder: () => void;
  onInfo: (messageId: string) => void;
  onRemoveReaction: (messageId: string) => Promise<unknown>;
  onReply: (message: ConversationMessage) => void;
  onReport: (messageId: string) => void;
  reactionsByMessageId: Record<string, MessageReaction[]>;
  typingUsers: Array<{ userId: string; name?: string }>;
  userDisplayNames: UserDisplayNameMap;
  uploadingMessageId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);
  const [isScrollReady, setIsScrollReady] = useState(false);

  // Scroll to bottom on initial load and when new messages arrive at the bottom
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;

    if (isInitialLoadRef.current) {
      // Initial load — scroll to bottom immediately
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
      prevMessageCountRef.current = messages.length;
      // Show content after scroll is positioned
      setIsScrollReady(true);
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
    <div ref={scrollRef} dir="ltr" className={`h-full overflow-y-auto px-4 py-8 ${isScrollReady ? "opacity-100" : "opacity-0"}`}>
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-0.5">
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

          // Group consecutive messages from the same sender
          const prevMessage = messages[index - 1];
          const prevSenderId = prevMessage
            ? messageSenderUserId(prevMessage)
            : null;
          const currentSenderId = messageSenderUserId(message);
          const isFirstInGroup =
            !prevMessage ||
            prevSenderId !== currentSenderId ||
            shouldShowDateSeparator;

          return (
            <Fragment key={message.clientMessageId ?? message.id}>
              {shouldShowDateSeparator ? (
                <div className="self-center rounded-full bg-slate-200 px-4 py-1 text-xs font-medium text-slate-700">
                  {formatMessageDateSeparator(message.createdAt, locale, labels)}
                </div>
              ) : null}
              <MessageBubble
                allowReactions={allowReactions}
                attachments={
                  attachmentsByMessageId[message.id] ?? message.attachments ?? []
                }
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                isFirstInGroup={isFirstInGroup}
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
                onStartEdit={() => onStartEdit(message.id, message.body ?? "")}
                onInfo={(msgId) => onInfo(msgId)}
                onRemoveReaction={() => onRemoveReaction(message.id)}
                onReply={(msg) => onReply(msg)}
                onReport={(msgId) => onReport(msgId)}
                allMessages={messages}
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
