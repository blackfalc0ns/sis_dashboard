import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationFile,
  CommunicationId,
  CommunicationRecord,
} from "./communication.types";

export type MessageStatus = "sent" | "hidden" | "deleted";
export type MessageType = "text" | "image" | "file" | "audio" | "video" | "system";
export type MessageKind = MessageType;
export type ReactionType =
  | "like"
  | "love"
  | "laugh"
  | "wow"
  | "sad"
  | "angry"
  | "thumbs_up"
  | "thumbs_down";

export interface Message extends CommunicationRecord {
  id: CommunicationId;
  conversationId?: CommunicationId;
  senderId?: CommunicationId;
  sender?: CommunicationActor;
  body?: string;
  type?: MessageType;
  kind?: MessageKind;
  status?: MessageStatus;
  attachments?: MessageAttachment[];
  reactionsCount?: number;
  replyToMessageId?: CommunicationId;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
  deletedAt?: CommunicationDateTime | null;
}

export interface SendMessagePayload {
  type?: "text";
  body?: string;
  content?: string;
  clientMessageId?: string;
  replyToMessageId?: CommunicationId;
  metadata?: CommunicationRecord | null;
}

export interface UpdateMessagePayload {
  body?: string;
  content?: string;
}

export type ListMessagesParams = {
  type?: MessageType;
  status?: MessageStatus;
  before?: string;
  after?: string;
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

export interface LinkAttachmentPayload {
  fileId: CommunicationId;
  caption?: string;
  sortOrder?: number;
}
