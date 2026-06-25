"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useCommunicationSocket } from "@/features/communication/hooks/useCommunicationSocket";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { getConversations } from "@/features/communication/api/communication.service";
import { useMessageNotifications } from "@/features/communication/hooks/useMessageNotifications";
import { NotificationToastContainer } from "@/features/communication/components/NotificationToast";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function notificationMessageId(notification: Record<string, unknown>) {
  const deepLink = recordValue(notification.deepLink);
  const type = stringValue(notification.type);

  if (deepLink?.type === "conversation_message") {
    return (
      stringValue(deepLink.messageId) ??
      stringValue(notification.sourceId) ??
      stringValue(notification.source_id)
    );
  }

  if (type?.startsWith("message_")) {
    return stringValue(notification.sourceId) ?? stringValue(notification.source_id);
  }

  return undefined;
}

/**
 * Global message notification listener.
 * Renders floating toasts + plays sound for new messages across the dashboard.
 * Mount this once at the layout level.
 */
export default function GlobalMessageNotifications() {
  const { socket, joinConversation } = useCommunicationSocket();
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { notifications, notify, dismiss } = useMessageNotifications(null);
  const joinedRef = useRef(false);
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id || joinedRef.current) return;
    joinedRef.current = true;

    void getConversations({ limit: 50 })
      .then((response) => {
        const record = response as Record<string, unknown>;
        const items =
          (record.items as Array<{ id?: string }>) ??
          (record.data as Record<string, unknown>)?.items ??
          (Array.isArray(response) ? response : []);

        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (item?.id) joinConversation(item.id);
          });
        }
      })
      .catch(() => {
        // Socket notifications still work for rooms already joined elsewhere.
      });
  }, [user?.id, joinConversation]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as Record<string, unknown>;
      const message = (record.message ?? record.data ?? record) as Record<
        string,
        unknown
      >;
      const messageId = stringValue(message.id) ?? stringValue(message.messageId);
      if (messageId && notifiedMessageIdsRef.current.has(messageId)) return;

      const senderUserId =
        (message.senderUserId as string) ??
        (message.senderId as string) ??
        (message.userId as string);
      const senderName =
        (message.senderName as string) ??
        ((message.sender as Record<string, unknown>)?.name as string) ??
        "New message";
      const body =
        (message.body as string) ?? (message.content as string) ?? "";
      const conversationId =
        (message.conversationId as string) ?? (record.conversationId as string);

      if (!conversationId) return;
      if (messageId) notifiedMessageIdsRef.current.add(messageId);

      notify({
        conversationId,
        senderName,
        senderUserId,
        body,
        currentUserId: user?.id,
      });
    };

    const handleNotification = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as Record<string, unknown>;
      const notification = (record.notification ?? record.data ?? record) as Record<
        string,
        unknown
      >;
      const messageId = notificationMessageId(notification);
      if (messageId && notifiedMessageIdsRef.current.has(messageId)) return;

      const title =
        (notification.title as string) ??
        (notification.subject as string) ??
        "Notification";
      const body =
        (notification.body as string) ??
        (notification.message as string) ??
        (notification.content as string) ??
        "";
      const notificationId =
        stringValue(notification.notificationId) ??
        stringValue(notification.id) ??
        `notif-${Date.now()}`;

      if (messageId) notifiedMessageIdsRef.current.add(messageId);

      notify({
        conversationId: notificationId,
        senderName: title,
        body,
        currentUserId: user?.id,
      });
    };

    const handleAnnouncement = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as Record<string, unknown>;
      const announcement = (record.announcement ?? record.data ?? record) as Record<
        string,
        unknown
      >;
      const title =
        (announcement.title as string) ??
        (announcement.titleEn as string) ??
        "Announcement";
      const body =
        (announcement.body as string) ?? (announcement.content as string) ?? "";

      notify({
        conversationId: `announcement-${Date.now()}`,
        senderName: title,
        body,
        currentUserId: user?.id,
      });
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleNewMessage);
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.notificationCreated,
      handleNotification,
    );
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.announcementPublished,
      handleAnnouncement,
    );

    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleNewMessage);
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        handleNotification,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.announcementPublished,
        handleAnnouncement,
      );
    };
  }, [socket, notify, user?.id]);

  return (
    <NotificationToastContainer
      notifications={notifications}
      onDismiss={dismiss}
      onClick={(conversationId) => {
        dismiss(conversationId);
        if (conversationId.includes("-") && !conversationId.startsWith("notif-")) {
          router.push(
            `/${locale}/communication/conversations?conversationId=${conversationId}`,
          );
        } else {
          router.push(`/${locale}/communication/notifications`);
        }
      }}
    />
  );
}
