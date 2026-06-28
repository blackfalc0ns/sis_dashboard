"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useCommunicationSocket } from "@/features/communication/hooks/useCommunicationSocket";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
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

function isAnnouncementNotification(notification: Record<string, unknown>) {
  const deepLink = recordValue(notification.deepLink) ?? recordValue(notification.deep_link);
  const sourceType =
    stringValue(notification.sourceType) ?? stringValue(notification.source_type);
  const sourceModule =
    stringValue(notification.sourceModule) ?? stringValue(notification.source_module);
  const type = stringValue(notification.type);

  return (
    deepLink?.type === "announcement" ||
    type?.toLowerCase() === "announcement_published" ||
    sourceModule?.toLowerCase() === "announcements" ||
    Boolean(sourceType?.toLowerCase().includes("announcement"))
  );
}

/**
 * Global message notification listener.
 * Renders floating toasts + plays sound for new messages across the dashboard.
 * Mount this once at the layout level.
 *
 * The backend broadcasts message and announcement events at the user level via
 * `notification.created` and `announcement.published`, so no conversation room
 * joining or HTTP prefetch is required.
 */
export default function GlobalMessageNotifications() {
  const { socket } = useCommunicationSocket();
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { notifications, notify, dismiss } = useMessageNotifications(null);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as Record<string, unknown>;
      const notification = (record.notification ?? record.data ?? record) as Record<
        string,
        unknown
      >;

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

      // Resolve conversationId for message-type notifications so the toast
      // navigates directly to the conversation instead of the notifications page.
      const deepLink = recordValue(notification.deepLink);
      const conversationId =
        (deepLink?.type === "conversation_message"
          ? stringValue(deepLink.conversationId as string)
          : undefined) ??
        stringValue(notification.conversationId as string) ??
        notificationId;
      const targetUrl = isAnnouncementNotification(notification)
        ? `/${locale}/communication/notifications?notificationId=${encodeURIComponent(notificationId)}`
        : undefined;

      notify({
        conversationId,
        targetUrl,
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

    socket.on(COMMUNICATION_SOCKET_EVENTS.notificationCreated, handleNotification);
    socket.on(COMMUNICATION_SOCKET_EVENTS.announcementPublished, handleAnnouncement);

    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.notificationCreated, handleNotification);
      socket.off(COMMUNICATION_SOCKET_EVENTS.announcementPublished, handleAnnouncement);
    };
  }, [socket, notify, user?.id]);

  return (
    <NotificationToastContainer
      notifications={notifications}
      onDismiss={dismiss}
      onClick={(notification) => {
        dismiss(notification.id);
        const target = notification.targetUrl ?? notification.conversationId;

        if (target.startsWith(`/${locale}/`)) {
          router.push(target);
          return;
        }

        if (
          target.includes("-") &&
          !target.startsWith("notif-") &&
          !target.startsWith("announcement-")
        ) {
          router.push(
            `/${locale}/communication/conversations?conversationId=${target}`,
          );
        } else {
          router.push(`/${locale}/communication/notifications`);
        }
      }}
    />
  );
}
