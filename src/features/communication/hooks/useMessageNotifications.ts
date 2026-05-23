"use client";

import { useCallback, useRef, useState } from "react";
import type { MessageNotification } from "@/features/communication/components/NotificationToast";
import { useNotificationSound } from "./useNotificationSound";

export function useMessageNotifications(currentConversationId?: string | null) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const { play: playSound } = useNotificationSound();
  const idCounterRef = useRef(0);

  const notify = useCallback(
    (params: {
      conversationId: string;
      senderName: string;
      senderUserId?: string;
      body: string;
      currentUserId?: string;
    }) => {
      // Don't notify for own messages
      if (params.currentUserId && params.senderUserId === params.currentUserId) return;
      // Don't notify if user is currently viewing that conversation
      if (params.conversationId === currentConversationId) return;

      const id = `notif-${Date.now()}-${++idCounterRef.current}`;
      const notification: MessageNotification = {
        id,
        conversationId: params.conversationId,
        senderName: params.senderName,
        body: params.body.slice(0, 100),
        timestamp: Date.now(),
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 5));
      playSound();

      // Browser notification if tab is not focused
      if (typeof document !== "undefined" && document.hidden) {
        showBrowserNotification(params.senderName, params.body);
      }
    },
    [currentConversationId, playSound],
  );

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, notify, dismiss, clearAll };
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body.slice(0, 100),
      icon: "/favicon.ico",
      tag: "moazez-message",
    });
  } else if (Notification.permission !== "denied") {
    void Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body: body.slice(0, 100),
          icon: "/favicon.ico",
          tag: "moazez-message",
        });
      }
    });
  }
}
