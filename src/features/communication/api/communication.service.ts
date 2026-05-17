import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/lib/api";
import type {
  Announcement,
  AnnouncementReadSummary,
  CreateAnnouncementPayload,
  ListAnnouncementsParams,
  UpdateAnnouncementPayload,
} from "@/features/communication/types/announcement.types";
import type {
  AddParticipantPayload,
  Conversation,
  ConversationParticipant,
  ConversationReadSummary,
  ConversationReadSummaryParams,
  CreateConversationPayload,
  ListConversationsParams,
  MarkConversationReadPayload,
  UpdateConversationPayload,
} from "@/features/communication/types/conversation.types";
import type {
  CommunicationAdminOverview,
  CommunicationListResponse,
  CommunicationPolicy,
  CommunicationQueryParams,
  CommunicationQueryValue,
  CommunicationResponse,
  UpdateCommunicationPolicyPayload,
} from "@/features/communication/types/communication.types";
import type {
  LinkAttachmentPayload,
  ListMessagesParams,
  Message,
  MessageAttachment,
  MessageReaction,
  ReactionType,
  SendMessagePayload,
  UpdateMessagePayload,
} from "@/features/communication/types/message.types";
import type {
  CommunicationNotification,
  ListNotificationDeliveriesParams,
  ListNotificationsParams,
  NotificationDelivery,
} from "@/features/communication/types/notification.types";
import type {
  CreateBlockPayload,
  CreateMessageReportPayload,
  CreateModerationActionPayload,
  CreateRestrictionPayload,
  ListBlocksParams,
  ListMessageReportsParams,
  ListRestrictionsParams,
  MessageReport,
  ModerationAction,
  Restriction,
  UpdateMessageReportPayload,
  UpdateRestrictionPayload,
  UserBlock,
} from "@/features/communication/types/safety.types";

const COMMUNICATION_ENDPOINT = "/communication";

type DeleteResponse = CommunicationResponse<{ success?: boolean }>;

function compactParams(
  params?: CommunicationQueryParams,
): Record<string, string | number | boolean | string[]> | undefined {
  if (!params) return undefined;

  const compacted = Object.entries(params).reduce<
    Record<string, string | number | boolean | string[]>
  >((acc, [key, value]) => {
    if (Array.isArray(value)) {
      const values = value
        .filter(
          (item): item is Exclude<CommunicationQueryValue, null | undefined> =>
            item !== undefined && item !== null && item !== "",
        )
        .map(String);

      if (values.length > 0) {
        acc[key] = values;
      }

      return acc;
    }

    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }

    return acc;
  }, {});

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

const queryConfig = (params?: CommunicationQueryParams) => ({
  params: compactParams(params),
});

export function getPolicy(): Promise<CommunicationResponse<CommunicationPolicy>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/policies`);
}

export function updatePolicy(
  payload: UpdateCommunicationPolicyPayload,
): Promise<CommunicationResponse<CommunicationPolicy>> {
  return apiPatch(`${COMMUNICATION_ENDPOINT}/policies`, payload);
}

export function getAdminOverview(): Promise<
  CommunicationResponse<CommunicationAdminOverview>
> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/admin/overview`);
}

export function createAnnouncement(
  payload: CreateAnnouncementPayload,
): Promise<CommunicationResponse<Announcement>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/announcements`, payload);
}

export function getAnnouncements(
  params?: ListAnnouncementsParams,
): Promise<CommunicationListResponse<Announcement>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/announcements`, queryConfig(params));
}

export function getAnnouncement(
  announcementId: string,
): Promise<CommunicationResponse<Announcement>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/announcements/${announcementId}`);
}

export function updateAnnouncement(
  announcementId: string,
  payload: UpdateAnnouncementPayload,
): Promise<CommunicationResponse<Announcement>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}`,
    payload,
  );
}

export function publishAnnouncement(
  announcementId: string,
): Promise<CommunicationResponse<Announcement>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/publish`,
  );
}

export function markAnnouncementRead(
  announcementId: string,
): Promise<CommunicationResponse<AnnouncementReadSummary>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/read`,
  );
}

export function getAnnouncementReadSummary(
  announcementId: string,
): Promise<CommunicationResponse<AnnouncementReadSummary>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/read-summary`,
  );
}

export function archiveAnnouncement(
  announcementId: string,
): Promise<CommunicationResponse<Announcement>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/archive`,
  );
}

export function createConversation(
  payload: CreateConversationPayload,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/conversations`, payload);
}

export function getConversations(
  params?: ListConversationsParams,
): Promise<CommunicationListResponse<Conversation>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/conversations`, queryConfig(params));
}

export function getConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/conversations/${conversationId}`);
}

export function updateConversation(
  conversationId: string,
  payload: UpdateConversationPayload,
): Promise<CommunicationResponse<Conversation>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}`,
    payload,
  );
}

export function closeConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/close`);
}

export function reopenConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/reopen`,
  );
}

export function archiveConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/archive`,
  );
}

export function addParticipant(
  conversationId: string,
  payload: AddParticipantPayload,
): Promise<CommunicationResponse<ConversationParticipant>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants`,
    payload,
  );
}

export function getParticipants(
  conversationId: string,
): Promise<CommunicationListResponse<ConversationParticipant>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants`,
  );
}

export function sendMessage(
  conversationId: string,
  payload: SendMessagePayload,
): Promise<CommunicationResponse<Message>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/messages`,
    payload,
  );
}

export function getMessages(
  conversationId: string,
  params?: ListMessagesParams,
): Promise<CommunicationListResponse<Message>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/messages`,
    queryConfig(params),
  );
}

export function getMessage(
  messageId: string,
): Promise<CommunicationResponse<Message>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/messages/${messageId}`);
}

export function updateMessage(
  messageId: string,
  payload: UpdateMessagePayload,
): Promise<CommunicationResponse<Message>> {
  return apiPatch(`${COMMUNICATION_ENDPOINT}/messages/${messageId}`, payload);
}

export function deleteMessage(messageId: string): Promise<DeleteResponse> {
  return apiDelete(`${COMMUNICATION_ENDPOINT}/messages/${messageId}`);
}

export function markMessageRead(
  messageId: string,
): Promise<CommunicationResponse<Message>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/read`);
}

export function markConversationRead(
  conversationId: string,
  payload?: MarkConversationReadPayload,
): Promise<CommunicationResponse<ConversationReadSummary>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/read`,
    payload,
  );
}

export function getConversationReadSummary(
  conversationId: string,
  params?: ConversationReadSummaryParams,
): Promise<CommunicationResponse<ConversationReadSummary>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/read-summary`,
    queryConfig(params),
  );
}

export function getNotifications(
  params?: ListNotificationsParams,
): Promise<CommunicationListResponse<CommunicationNotification>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/notifications`, queryConfig(params));
}

export function markAllNotificationsRead(): Promise<
  CommunicationResponse<{ updatedCount?: number }>
> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/notifications/read-all`);
}

export function getNotificationDeliveries(
  params?: ListNotificationDeliveriesParams,
): Promise<CommunicationListResponse<NotificationDelivery>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/notification-deliveries`,
    queryConfig(params),
  );
}

export function upsertReaction(
  messageId: string,
  type: ReactionType,
): Promise<CommunicationResponse<MessageReaction>> {
  return apiPut(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/reactions`, {
    type,
  });
}

export function getReactions(
  messageId: string,
): Promise<CommunicationListResponse<MessageReaction>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/reactions`);
}

export function deleteMyReaction(messageId: string): Promise<DeleteResponse> {
  return apiDelete(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/reactions/me`,
  );
}

export function linkAttachment(
  messageId: string,
  payload: LinkAttachmentPayload,
): Promise<CommunicationResponse<MessageAttachment>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/attachments`,
    payload,
  );
}

export function getAttachments(
  messageId: string,
): Promise<CommunicationListResponse<MessageAttachment>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/attachments`);
}

export function deleteAttachment(
  messageId: string,
  attachmentId: string,
): Promise<DeleteResponse> {
  return apiDelete(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/attachments/${attachmentId}`,
  );
}

export function createMessageReport(
  messageId: string,
  payload: CreateMessageReportPayload,
): Promise<CommunicationResponse<MessageReport>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/reports`,
    payload,
  );
}

export function getMessageReports(
  params?: ListMessageReportsParams,
): Promise<CommunicationListResponse<MessageReport>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/message-reports`, queryConfig(params));
}

export function getMessageReport(
  reportId: string,
): Promise<CommunicationResponse<MessageReport>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/message-reports/${reportId}`);
}

export function updateMessageReport(
  reportId: string,
  payload: UpdateMessageReportPayload,
): Promise<CommunicationResponse<MessageReport>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/message-reports/${reportId}`,
    payload,
  );
}

export function createModerationAction(
  messageId: string,
  payload: CreateModerationActionPayload,
): Promise<CommunicationResponse<ModerationAction>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/moderation-actions`,
    payload,
  );
}

export function getModerationActions(
  messageId: string,
): Promise<CommunicationListResponse<ModerationAction>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/moderation-actions`,
  );
}

export function createRestriction(
  payload: CreateRestrictionPayload,
): Promise<CommunicationResponse<Restriction>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/restrictions`, payload);
}

export function getRestrictions(
  params?: ListRestrictionsParams,
): Promise<CommunicationListResponse<Restriction>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/restrictions`, queryConfig(params));
}

export function updateRestriction(
  restrictionId: string,
  payload: UpdateRestrictionPayload,
): Promise<CommunicationResponse<Restriction>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/restrictions/${restrictionId}`,
    payload,
  );
}

export function deleteRestriction(
  restrictionId: string,
): Promise<DeleteResponse> {
  return apiDelete(`${COMMUNICATION_ENDPOINT}/restrictions/${restrictionId}`);
}

export function createBlock(
  payload: CreateBlockPayload,
): Promise<CommunicationResponse<UserBlock>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/blocks`, payload);
}

export function getBlocks(
  params?: ListBlocksParams,
): Promise<CommunicationListResponse<UserBlock>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/blocks`, queryConfig(params));
}

export function deleteBlock(blockId: string): Promise<DeleteResponse> {
  return apiDelete(`${COMMUNICATION_ENDPOINT}/blocks/${blockId}`);
}

export const communicationService = {
  getPolicy,
  updatePolicy,
  getAdminOverview,
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  markAnnouncementRead,
  getAnnouncementReadSummary,
  archiveAnnouncement,
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  closeConversation,
  reopenConversation,
  archiveConversation,
  addParticipant,
  getParticipants,
  sendMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage,
  markMessageRead,
  markConversationRead,
  getConversationReadSummary,
  getNotifications,
  markAllNotificationsRead,
  getNotificationDeliveries,
  upsertReaction,
  getReactions,
  deleteMyReaction,
  linkAttachment,
  getAttachments,
  deleteAttachment,
  createMessageReport,
  getMessageReports,
  getMessageReport,
  updateMessageReport,
  createModerationAction,
  getModerationActions,
  createRestriction,
  getRestrictions,
  updateRestriction,
  deleteRestriction,
  createBlock,
  getBlocks,
  deleteBlock,
};
