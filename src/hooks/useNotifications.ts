// FILE: src/hooks/useNotifications.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { Notification } from "@/types/notifications";
import {
  getGuardianNotifications,
  markNotificationAsRead,
  getUnreadCount,
} from "@/services/notificationService";

export function useNotifications(guardianId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    try {
      const notifs = getGuardianNotifications(guardianId);
      setNotifications(notifs);
      setUnreadCount(getUnreadCount(guardianId));
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [guardianId]);

  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      markNotificationAsRead(notificationId);
      loadNotifications();
    },
    [loadNotifications],
  );

  const markAllAsRead = useCallback(() => {
    notifications.forEach((notif) => {
      if (!notif.readAt) {
        markNotificationAsRead(notif.id);
      }
    });
    loadNotifications();
  }, [notifications, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
