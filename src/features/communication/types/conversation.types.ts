import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationId,
  CommunicationQueryParams,
  CommunicationRecord,
} from "./communication.types";

export type ConversationStatus = "active" | "closed" | "archived" | string;
export type ConversationType = "direct" | "group" | "classroom" | string;
export type ParticipantRole = "owner" | "admin" | "member" | string;

export interface Conversation extends CommunicationRecord {
  id: CommunicationId;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  type?: ConversationType;
  status?: ConversationStatus;
  participantsCount?: number;
  unreadCount?: number;
  lastMessageAt?: CommunicationDateTime | null;
  createdBy?: CommunicationActor;
  createdById?: CommunicationId;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface CreateConversationPayload extends CommunicationRecord {
  title?: string;
  titleAr?: string;
  titleEn?: string;
  type?: ConversationType;
  participantIds?: CommunicationId[];
  scopeType?: string;
  scopeId?: CommunicationId;
}

export type UpdateConversationPayload = Partial<CreateConversationPayload> &
  CommunicationRecord;

export type ListConversationsParams = CommunicationQueryParams & {
  status?: ConversationStatus;
  type?: ConversationType;
  search?: string;
  page?: number;
  limit?: number;
};

export interface ConversationParticipant extends CommunicationRecord {
  id: CommunicationId;
  conversationId?: CommunicationId;
  userId?: CommunicationId;
  role?: ParticipantRole;
  actor?: CommunicationActor;
  joinedAt?: CommunicationDateTime;
  leftAt?: CommunicationDateTime | null;
}

export interface AddParticipantPayload extends CommunicationRecord {
  userId?: CommunicationId;
  participantId?: CommunicationId;
  role?: ParticipantRole;
}

export interface MarkConversationReadPayload extends CommunicationRecord {
  lastReadMessageId?: CommunicationId;
  readAt?: CommunicationDateTime;
}

export type ConversationReadSummaryParams = CommunicationQueryParams & {
  limit?: number;
  page?: number;
};

export interface ConversationReadSummary extends CommunicationRecord {
  conversationId: CommunicationId;
  readCount?: number;
  unreadCount?: number;
  participants?: ConversationParticipant[];
}
