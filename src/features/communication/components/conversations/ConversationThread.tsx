"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Alert } from "@mui/material";
import Button from "@/components/ui/button/Button";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import { useAuth } from "@/hooks/use-auth";
import { useCommunicationPolicy } from "@/features/communication/hooks/useCommunicationPolicy";
import { useConversation } from "@/features/communication/hooks/useConversation";
import { useConversationMessages } from "@/features/communication/hooks/useConversationMessages";
import { useConversationParticipants } from "@/features/communication/hooks/useConversationParticipants";
import { useConversationRealtime } from "@/features/communication/hooks/useConversationRealtime";
import { useMessageAttachments } from "@/features/communication/hooks/useMessageAttachments";
import { useMessageReactions } from "@/features/communication/hooks/useMessageReactions";
import { usePresence } from "@/features/communication/hooks/usePresence";
import { useTypingIndicator } from "@/features/communication/hooks/useTypingIndicator";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import MessageReadReceipts from "./MessageReadReceipts";
import ParticipantsPanel from "./ParticipantsPanel";
import TypingIndicator from "./TypingIndicator";

export interface ConversationThreadProps {
  conversationId: string;
}

const labels = {
  en: {
    back: "Back to conversations",
    loading: "Loading conversation...",
    refresh: "Refresh",
    errorTitle: "Unable to load thread",
    untitled: "Untitled conversation",
    participants: "Participants",
    addParticipant: "Add Participant",
    userId: "User ID",
    role: "Role",
    noParticipants: "No participants loaded.",
    communicationDisabled: "Communication is currently disabled by policy.",
    composerPlaceholder: "Write a message...",
    send: "Send",
    maxMessageLength: "Message is {count}/{max} characters.",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    deleted: "Message deleted",
    pending: "Pending",
    failed: "Failed",
    edited: "Edited",
    like: "Like",
    love: "Love",
    thanks: "Thanks",
    seen: "Seen",
    removeReaction: "Remove",
    attachFile: "Attach",
    fileTooLarge: "File must be {size}MB or smaller.",
    uploadFailed: "Unable to upload attachment.",
    download: "Open attachment",
    removeAttachment: "Remove attachment",
    read: "Read",
    unread: "Unread",
    typing: "is typing",
    noMessages: "No messages yet. Start the conversation.",
  },
  ar: {
    back: "العودة إلى المحادثات",
    loading: "جار تحميل المحادثة...",
    refresh: "تحديث",
    errorTitle: "تعذر تحميل المحادثة",
    untitled: "محادثة بدون عنوان",
    participants: "المشاركون",
    addParticipant: "إضافة مشارك",
    userId: "معرف المستخدم",
    role: "الدور",
    noParticipants: "لم يتم تحميل مشاركين.",
    communicationDisabled: "التواصل معطل حاليا حسب السياسة.",
    composerPlaceholder: "اكتب رسالة...",
    send: "إرسال",
    maxMessageLength: "الرسالة {count}/{max} حرفا.",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    deleted: "تم حذف الرسالة",
    pending: "قيد الإرسال",
    failed: "فشل",
    edited: "تم التعديل",
    like: "إعجاب",
    love: "مفضلة",
    thanks: "شكر",
    seen: "تمت المشاهدة",
    removeReaction: "إزالة",
    attachFile: "إرفاق",
    fileTooLarge: "يجب ألا يتجاوز الملف {size} ميجابايت.",
    uploadFailed: "تعذر رفع المرفق.",
    download: "فتح المرفق",
    removeAttachment: "إزالة المرفق",
    read: "مقروء",
    unread: "غير مقروء",
    typing: "يكتب الآن",
    noMessages: "لا توجد رسائل بعد. ابدأ المحادثة.",
  },
};

type LocaleKey = keyof typeof labels;

function conversationTitle(
  locale: LocaleKey,
  conversation: ReturnType<typeof useConversation>["conversation"],
  fallback: string,
) {
  if (!conversation) return fallback;
  const preferred = locale === "ar" ? conversation.titleAr : conversation.titleEn;
  const secondary = locale === "ar" ? conversation.titleEn : conversation.titleAr;
  return preferred || secondary || conversation.title || fallback;
}

export default function ConversationThread({
  conversationId,
}: ConversationThreadProps) {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { user } = useAuth();
  const conversationState = useConversation(conversationId);
  const messagesState = useConversationMessages(conversationId);
  const participantsState = useConversationParticipants(conversationId);
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
  const refreshConversation = conversationState.refresh;
  const refreshMessages = messagesState.refresh;
  const refreshParticipants = participantsState.refresh;
  const refreshReactions = reactionsState.refreshAll;
  const refreshAttachments = attachmentsState.refreshAll;

  const refreshAll = useCallback(() => {
    void refreshConversation();
    void refreshMessages();
    void refreshParticipants();
    void refreshReactions();
    void refreshAttachments();
  }, [
    refreshAttachments,
    refreshConversation,
    refreshMessages,
    refreshParticipants,
    refreshReactions,
  ]);

  useConversationRealtime({
    conversationId,
    onMessageCreated: messagesState.upsertFromRealtime,
    onMessageUpdated: messagesState.patchFromRealtime,
    onMessageDeleted: messagesState.deleteFromRealtime,
    onMessageRead: messagesState.patchReadFromRealtime,
    onTypingStarted: typingState.handleTypingStarted,
    onTypingStopped: typingState.handleTypingStopped,
    onPresenceUpdated: presenceState.handlePresenceUpdated,
    onReconnect: refreshAll,
  });

  useEffect(() => {
    const latestReadable = [...messagesState.messages]
      .reverse()
      .find((message) => message.senderId !== user?.id && message.id);
    if (latestReadable) {
      void messagesState.markRead(latestReadable.id);
    }
  }, [messagesState, user?.id]);

  const isLoading =
    conversationState.isLoading ||
    messagesState.isLoading ||
    participantsState.isLoading;
  const firstError =
    conversationState.error || messagesState.error || participantsState.error;
  const title = conversationTitle(locale, conversationState.conversation, t.untitled);
  const backHref = `/${locale}/communication/conversations`;
  const isCommunicationEnabled = policy?.isEnabled !== false;
  const allowReactions = policy?.allowReactions !== false;
  const allowAttachments = policy?.allowAttachments !== false;
  const allowMessageEdit =
    policy?.allowMessageEdit ?? policy?.allowMessageEditing ?? true;
  const allowMessageDelete =
    policy?.allowMessageDelete ?? policy?.allowMessageDeleting ?? true;
  const maxMessageLength =
    typeof policy?.maxMessageLength === "number" && policy.maxMessageLength > 0
      ? policy.maxMessageLength
      : undefined;

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>

      <CommunicationPageHeader
        title={title}
        description={conversationState.conversation?.type}
        actions={
          <>
            {conversationState.conversation?.status ? (
              <CommunicationStatusChip
                label={conversationState.conversation.status}
                tone={
                  conversationState.conversation.status === "active"
                    ? "success"
                    : "warning"
                }
              />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={refreshAll}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
          </>
        }
      />

      {firstError ? (
        <CommunicationErrorState title={t.errorTitle} message={firstError} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-h-[640px] flex-col rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messagesState.messages.length > 0 ? (
              messagesState.messages.map((message) => {
                const senderUserId = message.sender?.userId ?? message.sender?.id;
                const isOwn =
                  message.senderId === user?.id ||
                  senderUserId === user?.id ||
                  message.sender?.id === user?.id;

                return (
                  <MessageBubble
                    key={message.clientMessageId ?? message.id}
                    message={message}
                    isOwn={Boolean(isOwn)}
                    labels={{
                      edit: t.edit,
                      delete: t.delete,
                      save: t.save,
                      cancel: t.cancel,
                      deleted: t.deleted,
                      pending: t.pending,
                      failed: t.failed,
                      edited: t.edited,
                      like: t.like,
                      love: t.love,
                      thanks: t.thanks,
                      seen: t.seen,
                      removeReaction: t.removeReaction,
                      attachFile: t.attachFile,
                      fileTooLarge: t.fileTooLarge,
                      uploadFailed: t.uploadFailed,
                      download: t.download,
                      removeAttachment: t.removeAttachment,
                    }}
                    currentUserId={user?.id}
                    allowReactions={allowReactions}
                    allowAttachments={allowAttachments}
                    allowMessageEdit={allowMessageEdit}
                    allowMessageDelete={allowMessageDelete}
                    maxAttachmentSizeMb={policy?.maxAttachmentSizeMb}
                    reactions={
                      reactionsState.reactionsByMessageId[message.id] ?? []
                    }
                    attachments={
                      attachmentsState.attachmentsByMessageId[message.id] ??
                      message.attachments ??
                      []
                    }
                    isUploadingAttachment={
                      attachmentsState.uploadingMessageId === message.id
                    }
                    onEdit={messagesState.edit}
                    onDelete={messagesState.remove}
                    onAddReaction={reactionsState.addReaction}
                    onRemoveReaction={reactionsState.removeMyReaction}
                    onUploadAttachment={attachmentsState.attachFile}
                    onDeleteAttachment={attachmentsState.removeAttachment}
                  />
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {t.noMessages}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {!isCommunicationEnabled ? (
              <Alert severity="warning">{t.communicationDisabled}</Alert>
            ) : null}
            <TypingIndicator users={typingState.typingUsers} label={t.typing} />
            <MessageReadReceipts
              readSummary={messagesState.readSummary}
              labels={{ read: t.read, unread: t.unread }}
            />
            <MessageComposer
              placeholder={t.composerPlaceholder}
              sendLabel={t.send}
              maxLength={maxMessageLength}
              maxLengthLabel={t.maxMessageLength}
              disabled={
                !isCommunicationEnabled ||
                conversationState.conversation?.status === "closed"
              }
              onTyping={typingState.emitTyping}
              onStopTyping={typingState.stopOwnTyping}
              onSend={messagesState.send}
            />
          </div>
        </section>

        <ParticipantsPanel
          participants={participantsState.participants}
          presenceByUserId={presenceState.presenceByUserId}
          isMutating={participantsState.isMutating}
          onAddParticipant={participantsState.add}
          labels={{
            title: t.participants,
            addParticipant: t.addParticipant,
            userId: t.userId,
            role: t.role,
            empty: t.noParticipants,
          }}
        />
      </div>
    </div>
  );
}
