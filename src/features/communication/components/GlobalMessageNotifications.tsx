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

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleNewMessage);
    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleNewMessage);
    };
  }, [socket, notify, user?.id]);

  return (
    <NotificationToastContainer
      notifications={notifications}
      onDismiss={dismiss}
      onClick={(conversationId) => {
        dismiss(conversationId);
        router.push(`/${locale}/communication/conversations?conversationId=${conversationId}`);
      }}
    />
  );
}
