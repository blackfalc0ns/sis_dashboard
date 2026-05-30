"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useCommunicationSocket } from "@/features/communication/hooks/useCommunicationSocket";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { getConversations, getNotifications } from "@/features/communication/api/communication.service";
import { useMessageNotifications } from "@/features/communication/hooks/useMessageNotifications";
import { NotificationToastContainer } from "@/features/communication/components/NotificationToast";

/**
 * Global message notification listener.
 * Renders floating toasts + plays sound for new messages across the entire dashboard.
 * Mount this once at the layout level.
 */
export default function GlobalMessageNotifications() {
  const { socket, joinConversation } = useCommunicationSocket();
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { notifications, notify, dismiss } = useMessageNotifications(null);
  const joinedRef = useRef(false);

  // Join all user's conversation rooms so we receive events globally
  useEffect(() => {
    if (!user?.id || joinedRef.current) return;
    joinedRef.current = true;

    void getConversations({ limit: 50 })
      .then((response) => {
        const record = response as Record<string, unknown>;
        const items =
          (record.items as Array<{ id: string }>) ??
          (record.data as Record<string, unknown>)?.items ??
          (Array.isArray(response) ? response : []);
        if (Array.isArray(items)) {
          items.forEach((item: { id?: string }) => {
            if (item?.id) joinConversation(item.id);
          });
        }
      })
      .catch(() => {
        // Silently fail — notifications just won't work until conversations page is visited
      });
  }, [user?.id, joinConversation]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as Record<string, unknown>;
      const message = (record.message ?? record.data ?? record) as Record<string, unknown>;
      const senderUserId =
        (message.senderUserId as string) ??
        (message.senderId as string) ??
        (message.userId as string);
      const senderName =
        (message.senderName as string) ??
        ((message.sender as Record<string, unknown>)?.name as string) ??
        "New message";
      const body = (message.body as string) ?? (message.content as string) ?? "";
      const conversationId =
        (message.conversationId as string) ?? (record.conversationId as string);

      if (conversationId) {
        notify({
          conversationId,
          senderName,
          senderUserId,
          body,
          currentUserId: user?.id,
        });
      }
    };

    const handleNotification = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as Record<string, unknown>;
      const data = (record.notification ?? record.data ?? record) as Record<string, unknown>;
      const title = (data.title as string) ?? (data.subject as string) ?? "Notification";
      const body = (data.body as string) ?? (data.message as string) ?? (data.content as string) ?? "";
      const notificationId = (data.id as string) ?? `notif-${Date.now()}`;

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
      const data = (record.announcement ?? record.data ?? record) as Record<string, unknown>;
      const title = (data.title as string) ?? (data.titleEn as string) ?? "Announcement";
      const body = (data.body as string) ?? (data.content as string) ?? "";

      notify({
        conversationId: `announcement-${Date.now()}`,
        senderName: title,
        body,
        currentUserId: user?.id,
      });
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleNewMessage);
    socket.on(COMMUNICATION_SOCKET_EVENTS.notificationCreated, handleNotification);
    socket.on(COMMUNICATION_SOCKET_EVENTS.announcementPublished, handleAnnouncement);
    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleNewMessage);
      socket.off(COMMUNICATION_SOCKET_EVENTS.notificationCreated, handleNotification);
      socket.off(COMMUNICATION_SOCKET_EVENTS.announcementPublished, handleAnnouncement);
    };
  }, [socket, notify, user?.id]);

  // Poll for new notifications every 30s (fallback for queue-generated notifications)
  const lastNotifCheckRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) return;

    const checkNewNotifications = async () => {
      try {
        const response = await getNotifications({ limit: 5 });
        const record = response as Record<string, unknown>;
        const items = (
          (record.items as Array<Record<string, unknown>>) ??
          ((record.data as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ??
          (Array.isArray(response) ? response : [])
        ) as Array<Record<string, unknown>>;

        if (!Array.isArray(items) || items.length === 0) return;

        const latestId = items[0]?.id as string;
        if (!latestId) return;

        // First run — just store the latest ID, don't notify
        if (lastNotifCheckRef.current === null) {
          lastNotifCheckRef.current = latestId;
          return;
        }

        // If latest notification is different from last check, show toast for new ones
        if (latestId !== lastNotifCheckRef.current) {
          lastNotifCheckRef.current = latestId;
          const title = (items[0].title as string) ?? (items[0].subject as string) ?? "Notification";
          const body = (items[0].body as string) ?? (items[0].message as string) ?? "";
          notify({
            conversationId: `notif-${latestId}`,
            senderName: title,
            body,
            currentUserId: user?.id,
          });
        }
      } catch {
        // Silently fail
      }
    };

    const interval = setInterval(() => void checkNewNotifications(), 30000);
    // Initial check after 5s (give socket time to connect first)
    const initialTimer = setTimeout(() => void checkNewNotifications(), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [user?.id, notify]);

  return (
    <NotificationToastContainer
      notifications={notifications}
      onDismiss={dismiss}
      onClick={(conversationId) => {
        dismiss(conversationId);
        // If it's a real conversation ID (UUID format), go to conversations
        // Otherwise go to notifications page
        if (conversationId.includes("-") && !conversationId.startsWith("notif-")) {
          router.push(`/${locale}/communication/conversations?conversationId=${conversationId}`);
        } else {
          router.push(`/${locale}/communication/notifications`);
        }
      }}
    />
  );
}
