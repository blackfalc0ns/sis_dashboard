import type {
  CommunicationDateTime,
  CommunicationId,
  CommunicationQueryParams,
  CommunicationRecord,
} from "./communication.types";

export type CommunicationNotificationStatus = "unread" | "read" | string;
export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "read"
  | string;

export interface CommunicationNotification extends CommunicationRecord {
  id: CommunicationId;
  userId?: CommunicationId;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  body?: string;
  bodyAr?: string;
  bodyEn?: string;
  status?: CommunicationNotificationStatus;
  type?: string;
  entityType?: string;
  entityId?: CommunicationId;
  readAt?: CommunicationDateTime | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type ListNotificationsParams = CommunicationQueryParams & {
  status?: CommunicationNotificationStatus;
  limit?: number;
  page?: number;
};

export interface NotificationDelivery extends CommunicationRecord {
  id: CommunicationId;
  notificationId?: CommunicationId;
  userId?: CommunicationId;
  channel?: string;
  status?: NotificationDeliveryStatus;
  sentAt?: CommunicationDateTime | null;
  deliveredAt?: CommunicationDateTime | null;
  readAt?: CommunicationDateTime | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type ListNotificationDeliveriesParams = CommunicationQueryParams & {
  status?: NotificationDeliveryStatus;
  limit?: number;
  page?: number;
};
