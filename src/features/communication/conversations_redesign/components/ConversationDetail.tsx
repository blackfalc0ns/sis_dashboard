"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type {
  DetailTab,
  ToastState,
  UserDisplayNameMap,
} from "@/features/communication/conversations_redesign/types";
import {
  createInviteDialogLabels,
  createJoinRequestDialogLabels,
  editParticipantDialogLabels,
  leaveConversationDialogLabels,
  participantDialogLabels,
  rejectInviteDialogLabels,
  removeParticipantDialogLabels,
  reviewJoinRequestDialogLabels,
} from "@/features/communication/conversations_redesign/utils/dialogLabels";
import { useCommunicationPolicy } from "@/features/communication/hooks/useCommunicationPolicy";
import { useConversation } from "@/features/communication/hooks/useConversation";
import { useConversationInvites } from "@/features/communication/hooks/useConversationInvites";
import { useConversationJoinRequests } from "@/features/communication/hooks/useConversationJoinRequests";
import { useConversationMessages } from "@/features/communication/hooks/useConversationMessages";
import { useConversationParticipants } from "@/features/communication/hooks/useConversationParticipants";
import type {
  ParticipantFormValues,
  ParticipantRoleChangeValues,
} from "@/features/communication/hooks/useConversationParticipants";
import { useConversationRealtime } from "@/features/communication/hooks/useConversationRealtime";
import { useMessageAttachments } from "@/features/communication/hooks/useMessageAttachments";
import { useMessageReactions } from "@/features/communication/hooks/useMessageReactions";
import { usePresence } from "@/features/communication/hooks/usePresence";
import { useTypingIndicator } from "@/features/communication/hooks/useTypingIndicator";
import type {
  ConversationInvite,
  ConversationJoinRequest,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";
import AddParticipantDialog from "@/features/communication/components/conversations/AddParticipantDialog";
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
import {
  actorName,
  addDisplayName,
  currentUserName,
  displayNameForUserId,
  stringValue,
} from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  conversationIsReadOnly,
} from "@/features/communication/conversations_redesign/utils/formatters";
import ConversationHeader from "@/features/communication/conversations_redesign/components/ConversationHeader";
import ConversationTabs from "@/features/communication/conversations_redesign/components/ConversationTabs";
import EditConversationDialog from "@/features/communication/conversations_redesign/components/EditConversationDialog";
import {
  MessageComposer,
  MessagesPanel,
  ReadOnlyComposer,
} from "@/features/communication/conversations_redesign/components/MessagesPanel";
import ParticipantsPanel from "@/features/communication/conversations_redesign/components/ParticipantsPanel";
import InvitesPanel from "@/features/communication/conversations_redesign/components/InvitesPanel";
import JoinRequestsPanel from "@/features/communication/conversations_redesign/components/JoinRequestsPanel";
import {
  archiveConversation,
  closeConversation,
  markConversationRead,
  reopenConversation,
  updateConversation,
} from "@/features/communication/api/communication.service";
import type { UpdateConversationPayload } from "@/features/communication/types/conversation.types";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";

export default function ConversationDetail({
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
  const [isEditConversationOpen, setIsEditConversationOpen] = useState(false);
  const [isMutatingConversation, setIsMutatingConversation] = useState(false);
  const [isConfirmArchiveOpen, setIsConfirmArchiveOpen] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    senderName: string;
    body: string;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    body: string;
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

  const messageIds = useMemo(() => {
    const ids = messagesState.messages
      .filter((message) => message.id && message.deliveryStatus !== "pending")
      .map((message) => message.id);
    return ids;
  }, [messagesState.messages]);

  // Stabilize the messageIds array reference — only change when IDs actually differ
  const prevMessageIdsRef = useRef<string[]>([]);
  const stableMessageIds = useMemo(() => {
    const prev = prevMessageIdsRef.current;
    if (
      prev.length === messageIds.length &&
      prev.every((id, i) => id === messageIds[i])
    ) {
      return prev;
    }
    prevMessageIdsRef.current = messageIds;
    return messageIds;
  }, [messageIds]);

  const reactionsState = useMessageReactions(stableMessageIds);
  const attachmentMessages = useMemo(
    () =>
      messagesState.messages.filter(
        (message) => message.id && message.deliveryStatus !== "pending",
      ),
    [messagesState.messages],
  );
  const attachmentsState = useMessageAttachments(
    attachmentMessages,
    policy?.maxAttachmentSizeMb,
  );
  const userDisplayNames = useMemo<UserDisplayNameMap>(() => {
    const names: UserDisplayNameMap = {};

    participantsState.participants.forEach((participant) => {
      addDisplayName(
        names,
        [participant.userId, participant.actor?.userId, participant.actor?.id],
        participant.user?.displayName || actorName(participant.actor),
      );
    });

    messagesState.messages.forEach((message) => {
      addDisplayName(
        names,
        [message.senderId, message.sender?.userId, message.sender?.id],
        actorName(message.sender),
      );
    });

    invitesState.invites.forEach((invite) => {
      addDisplayName(
        names,
        [
          invite.invitedUserId,
          invite.invitedUser?.userId,
          invite.invitedUser?.id,
        ],
        actorName(invite.invitedUser),
      );
    });

    joinRequestsState.joinRequests.forEach((request) => {
      addDisplayName(
        names,
        [request.userId, request.user?.userId, request.user?.id],
        actorName(request.user),
      );
    });

    if (user?.id) {
      const authUserRecord = user as unknown as Record<string, unknown>;
      addDisplayName(
        names,
        [user.id, stringValue(authUserRecord.userId)],
        currentUserName(user, labels),
      );
    }

    return names;
  }, [
    invitesState.invites,
    joinRequestsState.joinRequests,
    labels,
    messagesState.messages,
    participantsState.participants,
    user,
  ]);

  const permissions = useMemo(
    () =>
      getConversationPermissionFlags({
        conversation: conversationState.conversation,
        currentUserId: user?.id,
        participants: participantsState.participants,
      }),
    [conversationState.conversation, participantsState.participants, user?.id],
  );

  // Toast error handlers for details loading hooks
  useEffect(() => {
    if (conversationState.error) {
      onToast({ tone: "error", message: conversationState.error });
    }
  }, [conversationState.error, onToast]);

  useEffect(() => {
    if (messagesState.error) {
      onToast({ tone: "error", message: messagesState.error });
    }
  }, [messagesState.error, onToast]);

  useEffect(() => {
    if (participantsState.error) {
      onToast({ tone: "error", message: participantsState.error });
    }
  }, [participantsState.error, onToast]);

  useEffect(() => {
    if (invitesState.error) {
      onToast({ tone: "error", message: invitesState.error });
    }
  }, [invitesState.error, onToast]);

  useEffect(() => {
    if (joinRequestsState.error) {
      onToast({ tone: "error", message: joinRequestsState.error });
    }
  }, [joinRequestsState.error, onToast]);

  const refreshAll = useCallback(() => {
    void conversationState.refresh();
    void messagesState.refresh();
    if (shouldLoadParticipants) void participantsState.refresh();
    if (loadedTabs.invites) void invitesState.refresh();
    if (loadedTabs.joinRequests) void joinRequestsState.refresh();
    void reactionsState.refreshAll();
  }, [
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

  const ignoreReactionRealtimeRefresh = useCallback(() => undefined, []);

  useConversationRealtime({
    conversationId,
    onMessageCreated: messagesState.upsertFromRealtime,
    onMessageDeleted: messagesState.deleteFromRealtime,
    onMessageRead: messagesState.patchReadFromRealtime,
    onMessageUpdated: messagesState.patchFromRealtime,
    onReactionDeleted: ignoreReactionRealtimeRefresh,
    onReactionUpserted: ignoreReactionRealtimeRefresh,
    onPresenceUpdated: presenceState.handlePresenceUpdated,
    onReconnect: refreshAll,
    onTypingStarted: typingState.handleTypingStarted,
    onTypingStopped: typingState.handleTypingStopped,
  });

  const lastMarkedReadRef = useRef<string | null>(null);

  // WhatsApp-style: mark conversation as read when new messages from others appear
  useEffect(() => {
    const latestFromOther = [...messagesState.messages]
      .reverse()
      .find((message) => message.senderId !== user?.id && message.id);
    if (!latestFromOther) return;
    // Only call markConversationRead if there's a new unread message we haven't marked yet
    if (latestFromOther.id !== lastMarkedReadRef.current) {
      lastMarkedReadRef.current = latestFromOther.id;
      void markConversationRead(conversationId).catch(() => undefined);
    }
  }, [messagesState.messages, user?.id, conversationId]);

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

  // Determine current user's participant status
  const currentUserParticipant = participantsState.participants.find(
    (p) => {
      const pUserId = p.userId ?? p.actor?.userId ?? p.actor?.id;
      return pUserId === user?.id;
    },
  );
  const currentUserStatus = currentUserParticipant?.status;
  const mutedUntil = currentUserParticipant?.mutedUntil;
  const isMuted = currentUserStatus === "muted" ||
    (mutedUntil != null && new Date(mutedUntil) > new Date());
  const isBlocked = currentUserStatus === "blocked";
  const isRemovedOrLeft = currentUserStatus === "left" || currentUserStatus === "removed";
  const canSendMessages = !readOnly && !isMuted && !isBlocked && !isRemovedOrLeft && isCommunicationEnabled;

  const handleArchiveConversation = () => {
    setIsConfirmArchiveOpen(true);
  };

  const executeArchiveConversation = async () => {
    setIsConfirmArchiveOpen(false);
    setIsMutatingConversation(true);
    try {
      await archiveConversation(conversationId);
      onToast({ tone: "success", message: labels.conversationArchived });
      void conversationState.refresh();
    } catch (error) {
      onToast({
        tone: "error",
        message: communicationErrorMessage(error, labels.unableToArchiveConversation),
      });
    } finally {
      setIsMutatingConversation(false);
    }
  };

  const handleCloseConversation = () => {
    setIsConfirmCloseOpen(true);
  };

  const executeCloseConversation = async () => {
    setIsConfirmCloseOpen(false);
    setIsMutatingConversation(true);
    try {
      await closeConversation(conversationId);
      onToast({ tone: "success", message: labels.conversationClosed });
      void conversationState.refresh();
    } catch (error) {
      onToast({
        tone: "error",
        message: communicationErrorMessage(error, labels.unableToCloseConversation),
      });
    } finally {
      setIsMutatingConversation(false);
    }
  };

  const handleReopenConversation = async () => {
    setIsMutatingConversation(true);
    try {
      await reopenConversation(conversationId);
      onToast({ tone: "success", message: labels.conversationReopened });
      void conversationState.refresh();
    } catch (error) {
      onToast({
        tone: "error",
        message: communicationErrorMessage(error, labels.unableToReopenConversation),
      });
    } finally {
      setIsMutatingConversation(false);
    }
  };

  const handleEditConversation = async (values: UpdateConversationPayload) => {
    setIsMutatingConversation(true);
    try {
      await updateConversation(conversationId, values);
      onToast({ tone: "success", message: labels.conversationUpdated });
      setIsEditConversationOpen(false);
      void conversationState.refresh();
    } catch (error) {
      onToast({
        tone: "error",
        message: communicationErrorMessage(error, labels.unableToUpdateConversation),
      });
    } finally {
      setIsMutatingConversation(false);
    }
  };

  const handleMuteToggle = async () => {
    if (!currentUserParticipant) return;
    const newMutedUntil = isMuted ? null : "2099-12-31T23:59:59.000Z";
    try {
      const { updateParticipant } = await import(
        "@/features/communication/api/communication.service"
      );
      await updateParticipant(conversationId, currentUserParticipant.id, {
        mutedUntil: newMutedUntil,
      });
      onToast({
        tone: "success",
        message: isMuted ? labels.unmuteConversation : labels.muteConversation,
      });
      void participantsState.refresh();
    } catch (error) {
      onToast({
        tone: "error",
        message: communicationErrorMessage(error, labels.unableToUpdateConversation),
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <ConversationHeader
        conversation={conversation}
        isMuted={isMuted}
        isLoading={conversationState.isLoading}
        labels={labels}
        onArchive={handleArchiveConversation}
        onBack={onBack}
        onClose={handleCloseConversation}
        onEdit={() => setIsEditConversationOpen(true)}
        onMuteToggle={handleMuteToggle}
        onRefresh={refreshAll}
        onReopen={handleReopenConversation}
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
            allowReactions={allowReactions}
            attachmentsByMessageId={attachmentsState.attachmentsByMessageId}
            currentUserId={user?.id}
            currentUserName={currentUserName(user, labels)}
            error={null}
            hasOlderMessages={messagesState.hasOlderMessages}
            isLoading={messagesState.isLoading}
            isLoadingOlder={messagesState.isLoadingOlder}
            labels={labels}
            locale={locale}
            messages={messagesState.messages}
            onAddReaction={(messageId, type) =>
              runMutation(
                () => reactionsState.addReaction(messageId, type),
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
            onStartEdit={(messageId, body) => {
              setEditingMessage({ id: messageId, body });
              setReplyTo(null);
            }}
            onLoadOlder={() => void messagesState.loadOlderMessages()}
            onRemoveReaction={(messageId) =>
              runMutation(
                () => reactionsState.removeMyReaction(messageId),
                labels.reactionRemoved,
                labels.unableToRemoveReaction,
              )
            }
            onReply={(message) => {
              const record = message as Record<string, unknown>;
              const senderName =
                (message.sender?.name as string) ??
                (typeof record.senderUserId === "string"
                  ? displayNameForUserId(record.senderUserId as string, userDisplayNames, labels.someone)
                  : labels.someone);
              setReplyTo({
                id: message.id,
                senderName,
                body: message.body ?? "",
              });
            }}
            onInfo={async (messageId) => {
              try {
                const { getMessage } = await import(
                  "@/features/communication/api/communication.service"
                );
                const response = await getMessage(messageId);
                const msg = response as Record<string, unknown>;
                const data = (msg?.data ?? msg?.item ?? msg) as Record<string, unknown>;
                const readCount = typeof data?.readCount === "number" ? data.readCount : 0;
                onToast({
                  tone: "info",
                  message: `${labels.readByList}: ${readCount}`,
                });
              } catch {
                onToast({ tone: "info", message: `${labels.readByList}: —` });
              }
            }}
            onReport={async (messageId) => {
              try {
                const { createMessageReport } = await import(
                  "@/features/communication/api/communication.service"
                );
                await createMessageReport(messageId, { reason: "inappropriate_content" });
                onToast({ tone: "success", message: labels.reportSent });
              } catch (error) {
                onToast({
                  tone: "error",
                  message: communicationErrorMessage(error, labels.unableToReport),
                });
              }
            }}
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
            error={null}
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
            error={null}
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
            error={null}
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
        !canSendMessages ? (
          <ReadOnlyComposer labels={labels} />
        ) : (
          <MessageComposer
            disabled={messagesState.isMutating}
            editingMessage={editingMessage}
            labels={labels}
            maxLength={policy?.maxMessageLength}
            onCancelEdit={() => setEditingMessage(null)}
            onCancelReply={() => setReplyTo(null)}
            onEditMessage={(messageId, body) =>
              runMutation(
                () => messagesState.edit(messageId, body),
                labels.messageUpdated,
                labels.unableToUpdateMessage,
              )
            }
            onSend={async (body) => {
              const result = await runMutation(
                () => messagesState.send(body, replyTo ? { replyToMessageId: replyTo.id } : undefined),
                labels.messageSent,
                labels.unableToSendMessage,
              );
              setReplyTo(null);
              return result;
            }}
            onSendVoice={async (file) => {
              const result = await runMutation(
                () =>
                  messagesState.sendMedia({
                    type: "voice",
                    files: [file],
                    caption: labels.voiceNote,
                    ...(replyTo ? { replyToMessageId: replyTo.id } : {}),
                  }),
                labels.messageSent,
                labels.unableToSendMessage,
              );
              setReplyTo(null);
              return result;
            }}
            onSendWithAttachment={async (files, caption) => {
              try {
                const messageBody = caption || "📎";
                const messageId = await messagesState.send(
                  messageBody,
                  replyTo ? { replyToMessageId: replyTo.id } : undefined,
                );
                if (messageId) {
                  for (const file of files) {
                    await attachmentsState.attachFile(messageId, file);
                  }
                  onToast({ tone: "success", message: labels.attachmentUploaded });
                }
                setReplyTo(null);
              } catch (error) {
                onToast({
                  tone: "error",
                  message: communicationErrorMessage(
                    error,
                    labels.unableToUploadAttachment,
                  ),
                });
              }
            }}
            onStopTyping={typingState.stopOwnTyping}
            onTyping={typingState.emitTyping}
            replyTo={replyTo}
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

      {isEditConversationOpen ? (
        <EditConversationDialog
          conversation={conversation}
          labels={labels}
          open={isEditConversationOpen}
          isSubmitting={isMutatingConversation}
          onClose={() => setIsEditConversationOpen(false)}
          onSubmit={handleEditConversation}
        />
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmArchiveOpen}
        onClose={() => setIsConfirmArchiveOpen(false)}
        onConfirm={executeArchiveConversation}
        title={labels.archiveConversation || "Archive"}
        description={labels.archiveConversationConfirm}
        confirmLabel={labels.archiveConversation || "Archive"}
        cancelLabel={labels.cancel}
        loading={isMutatingConversation}
        severity="danger"
      />

      <ConfirmDialog
        isOpen={isConfirmCloseOpen}
        onClose={() => setIsConfirmCloseOpen(false)}
        onConfirm={executeCloseConversation}
        title={labels.closeConversation || "Close"}
        description={labels.closeConversationConfirm}
        confirmLabel={labels.closeConversation || "Close"}
        cancelLabel={labels.cancel}
        loading={isMutatingConversation}
        severity="danger"
      />
    </div>
  );
}

