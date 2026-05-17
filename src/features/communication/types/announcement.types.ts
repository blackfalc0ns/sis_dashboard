import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationId,
  CommunicationQueryParams,
  CommunicationRecord,
} from "./communication.types";

export type AnnouncementStatus = "draft" | "published" | "archived" | string;
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent" | string;

export interface AnnouncementTarget extends CommunicationRecord {
  scopeType?: string;
  scopeId?: CommunicationId;
  academicYearId?: CommunicationId;
  termId?: CommunicationId;
}

export interface Announcement extends CommunicationRecord {
  id: CommunicationId;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  body?: string;
  bodyAr?: string;
  bodyEn?: string;
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  targets?: AnnouncementTarget[];
  author?: CommunicationActor;
  authorId?: CommunicationId;
  publishedAt?: CommunicationDateTime | null;
  archivedAt?: CommunicationDateTime | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface CreateAnnouncementPayload extends CommunicationRecord {
  title?: string;
  titleAr?: string;
  titleEn?: string;
  body?: string;
  bodyAr?: string;
  bodyEn?: string;
  priority?: AnnouncementPriority;
  targets?: AnnouncementTarget[];
}

export type UpdateAnnouncementPayload = Partial<CreateAnnouncementPayload> &
  CommunicationRecord;

export type ListAnnouncementsParams = CommunicationQueryParams & {
  status?: AnnouncementStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export interface AnnouncementReadSummary extends CommunicationRecord {
  announcementId: CommunicationId;
  readCount?: number;
  unreadCount?: number;
  totalRecipients?: number;
  readers?: CommunicationActor[];
}
