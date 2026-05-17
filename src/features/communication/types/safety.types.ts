import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationId,
  CommunicationQueryParams,
  CommunicationRecord,
} from "./communication.types";

export type MessageReportStatus =
  | "open"
  | "in_review"
  | "resolved"
  | "dismissed"
  | string;

export type ModerationActionType = "hide" | "unhide" | "delete" | string;
export type RestrictionStatus =
  | "active"
  | "lifted"
  | "revoked"
  | "expired"
  | string;
export type RestrictionType =
  | "group_create_disabled"
  | "message_send_disabled"
  | "attachment_upload_disabled"
  | "reaction_disabled"
  | string;

export interface CreateMessageReportPayload extends CommunicationRecord {
  reason?: string;
  details?: string;
}

export interface MessageReport extends CommunicationRecord {
  id: CommunicationId;
  messageId?: CommunicationId;
  reporterId?: CommunicationId;
  reporter?: CommunicationActor;
  reason?: string;
  details?: string;
  status?: MessageReportStatus;
  resolutionNote?: string;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type ListMessageReportsParams = CommunicationQueryParams & {
  messageId?: CommunicationId;
  status?: MessageReportStatus;
  limit?: number;
  page?: number;
};

export interface UpdateMessageReportPayload extends CommunicationRecord {
  status?: MessageReportStatus;
  resolutionNote?: string;
}

export interface CreateModerationActionPayload extends CommunicationRecord {
  action?: ModerationActionType;
  reason?: string;
}

export interface ModerationAction extends CommunicationRecord {
  id: CommunicationId;
  messageId?: CommunicationId;
  moderatorId?: CommunicationId;
  moderator?: CommunicationActor;
  action?: ModerationActionType;
  reason?: string;
  createdAt?: CommunicationDateTime;
}

export interface CreateRestrictionPayload extends CommunicationRecord {
  targetUserId?: CommunicationId;
  type?: RestrictionType;
  restrictionType?: RestrictionType;
  reason?: string;
  expiresAt?: CommunicationDateTime;
  metadata?: CommunicationRecord;
}

export interface Restriction extends CommunicationRecord {
  id: CommunicationId;
  targetUserId?: CommunicationId;
  targetUser?: CommunicationActor;
  type?: RestrictionType;
  restrictionType?: RestrictionType;
  createdById?: CommunicationId;
  createdBy?: CommunicationActor;
  reason?: string;
  status?: RestrictionStatus;
  expiresAt?: CommunicationDateTime | null;
  metadata?: CommunicationRecord;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type ListRestrictionsParams = CommunicationQueryParams & {
  targetUserId?: CommunicationId;
  activeOnly?: boolean;
  status?: RestrictionStatus;
  limit?: number;
  page?: number;
};

export type UpdateRestrictionPayload = Partial<CreateRestrictionPayload> &
  CommunicationRecord;

export interface CreateBlockPayload extends CommunicationRecord {
  targetUserId?: CommunicationId;
  reason?: string;
}

export interface UserBlock extends CommunicationRecord {
  id: CommunicationId;
  blockerUserId?: CommunicationId;
  targetUserId?: CommunicationId;
  targetUser?: CommunicationActor;
  reason?: string;
  createdAt?: CommunicationDateTime;
}

export type ListBlocksParams = CommunicationQueryParams & {
  targetUserId?: CommunicationId;
  limit?: number;
  page?: number;
};
