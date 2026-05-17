export type CommunicationId = string;
export type CommunicationDateTime = string;

export type CommunicationQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type CommunicationQueryParams = Record<
  string,
  CommunicationQueryValue | CommunicationQueryValue[]
>;

export type CommunicationRecord = Record<string, unknown>;

export interface CommunicationMeta extends CommunicationRecord {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface CommunicationEnvelope<T> extends CommunicationRecord {
  data?: T;
  item?: T;
  result?: T;
  payload?: T;
  message?: string;
  meta?: CommunicationMeta;
}

export interface CommunicationList<T> extends CommunicationRecord {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type CommunicationResponse<T> = T | CommunicationEnvelope<T>;

export type CommunicationListResponse<T> = CommunicationResponse<
  CommunicationList<T> | T[]
>;

export interface CommunicationActor extends CommunicationRecord {
  id: CommunicationId;
  userId?: CommunicationId;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface CommunicationPolicy extends CommunicationRecord {
  id?: CommunicationId;
  schoolId?: CommunicationId;
  isEnabled?: boolean;
  allowAnnouncements?: boolean;
  allowConversations?: boolean;
  allowAdminToAnyone?: boolean;
  allowDirectStaffToStaff?: boolean;
  allowTeacherCreatedGroups?: boolean;
  allowAttachments?: boolean;
  allowReactions?: boolean;
  allowMessageEdit?: boolean;
  allowMessageDelete?: boolean;
  allowMessageEditing?: boolean;
  allowMessageDeleting?: boolean;
  allowReadReceipts?: boolean;
  allowDeliveryReceipts?: boolean;
  moderationEnabled?: boolean;
  moderationMode?: string;
  maxGroupMembers?: number;
  maxMessageLength?: number;
  maxAttachmentSizeMb?: number;
  allowedAttachmentMimeTypes?: string[];
  metadata?: CommunicationRecord;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type UpdateCommunicationPolicyPayload = Partial<CommunicationPolicy> &
  CommunicationRecord;

export interface CommunicationAdminOverview extends CommunicationRecord {
  announcementsCount?: number;
  conversationsCount?: number;
  unreadNotificationsCount?: number;
  openReportsCount?: number;
  activeRestrictionsCount?: number;
  activeBlocksCount?: number;
}

export interface CommunicationFile extends CommunicationRecord {
  id: CommunicationId;
  fileId?: CommunicationId;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type UploadFileExtraFields = Record<
  string,
  string | Blob | number | boolean | null | undefined
>;
