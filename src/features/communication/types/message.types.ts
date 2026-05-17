import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationFile,
  CommunicationId,
  CommunicationQueryParams,
  CommunicationRecord,
} from "./communication.types";

export type MessageStatus = "sent" | "edited" | "deleted" | "hidden" | string;
export type MessageKind = "text" | "attachment" | "system" | string;
export type ReactionType = "like" | "love" | "thanks" | "seen" | string;

export interface Message extends CommunicationRecord {
  id: CommunicationId;
  conversationId?: CommunicationId;
  senderId?: CommunicationId;
  sender?: CommunicationActor;
  body?: string;
  kind?: MessageKind;
  status?: MessageStatus;
  attachments?: MessageAttachment[];
  reactionsCount?: number;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
  deletedAt?: CommunicationDateTime | null;
}

export interface SendMessagePayload extends CommunicationRecord {
  body?: string;
  kind?: MessageKind;
  attachmentIds?: CommunicationId[];
  parentMessageId?: CommunicationId;
}

export interface UpdateMessagePayload extends CommunicationRecord {
  body?: string;
}

export type ListMessagesParams = CommunicationQueryParams & {
  before?: CommunicationId;
  after?: CommunicationId;
  page?: number;
  limit?: number;
};

export interface MessageReaction extends CommunicationRecord {
  id: CommunicationId;
  messageId?: CommunicationId;
  userId?: CommunicationId;
  type: ReactionType;
  actor?: CommunicationActor;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface MessageAttachment extends CommunicationRecord {
  id: CommunicationId;
  messageId?: CommunicationId;
  fileId?: CommunicationId;
  file?: CommunicationFile;
  name?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  createdAt?: CommunicationDateTime;
}

export interface LinkAttachmentPayload extends CommunicationRecord {
  fileId: CommunicationId;
  caption?: string;
}
