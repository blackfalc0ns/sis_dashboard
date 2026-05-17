"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  archiveNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/communication/api/communication.service";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  CommunicationNotification,
  CommunicationNotificationStatus,
  ListNotificationsParams,
  NotificationPriority,
  NotificationSourceModule,
  NotificationType,
} from "@/features/communication/types/notification.types";

export type NotificationStatusFilter = "all" | "unread" | "read" | "archived";

export interface NotificationFiltersState {
  status: NotificationStatusFilter;
  priority: "" | NotificationPriority;
  type: "" | NotificationType;
  sourceModule: "" | NotificationSourceModule;
  sourceType: string;
  sourceId: string;
  recipientUserId: string;
  createdFrom: string;
  createdTo: string;
}

const DEFAULT_FILTERS: NotificationFiltersState = {
  status: "all",
  priority: "",
  type: "",
  sourceModule: "",
  sourceType: "",
  sourceId: "",
  recipientUserId: "",
  createdFrom: "",
  createdTo: "",
};

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function unwrapList<T>(response: unknown): CommunicationList<T> {
  if (Array.isArray(response)) {
    return { items: response as T[], total: response.length };
  }

  if (!isRecord(response)) {
    return { items: [], total: 0 };
  }

  const sources = [
    response,
    response.data,
    response.result,
    response.payload,
  ].filter(isRecord);
  const itemSource = sources.find((source) => Array.isArray(source.items));

  if (itemSource) {
    const items = itemSource.items as T[];
    return {
      ...itemSource,
      items,
      total:
        numberFromUnknown(itemSource.total) ??
        numberFromUnknown(itemSource.count) ??
        items.length,
      page: numberFromUnknown(itemSource.page),
      limit: numberFromUnknown(itemSource.limit),
      totalPages: numberFromUnknown(itemSource.totalPages),
    };
  }

  const arraySource = [
    response.data,
    response.result,
    response.payload,
  ].find(Array.isArray);

  if (arraySource) {
    const items = arraySource as T[];
    return { items, total: items.length };
  }

  return { items: [], total: 0 };
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load notifications.";
}

function sortNotifications(notifications: CommunicationNotification[]) {
  return [...notifications].sort((left, right) => {
    const leftDate = left.createdAt ?? left.updatedAt ?? "";
    const rightDate = right.createdAt ?? right.updatedAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function isoFromInput(value: string) {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function paramsFromFilters(filters: NotificationFiltersState): ListNotificationsParams {
  return {
    ...(filters.status !== "all"
      ? { status: filters.status as CommunicationNotificationStatus }
      : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.sourceModule ? { sourceModule: filters.sourceModule } : {}),
    ...(filters.sourceType.trim() ? { sourceType: filters.sourceType.trim() } : {}),
    ...(filters.sourceId.trim() ? { sourceId: filters.sourceId.trim() } : {}),
    ...(filters.recipientUserId.trim()
      ? { recipientUserId: filters.recipientUserId.trim() }
      : {}),
    ...(isoFromInput(filters.createdFrom)
      ? { createdFrom: isoFromInput(filters.createdFrom) }
      : {}),
    ...(isoFromInput(filters.createdTo)
      ? { createdTo: isoFromInput(filters.createdTo) }
      : {}),
    limit: 50,
  };
}

export function useNotifications() {
  const mountedRef = useRef(false);
  const [filters, setFilters] =
    useState<NotificationFiltersState>(DEFAULT_FILTERS);
  const [notifications, setNotifications] = useState<
    CommunicationNotification[]
  >([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await getNotifications(paramsFromFilters(filters));
      const list = unwrapList<CommunicationNotification>(response);
      const normalized = sortNotifications(list.items);

      if (!mountedRef.current) return;
      setNotifications(normalized);
      setTotal(list.total ?? normalized.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setNotifications([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setIsMutating(true);
    setError(null);

    try {
      const response = await markAllNotificationsRead();
      await refresh();
      return response;
    } catch (nextError) {
      setError(errorMessageFromUnknown(nextError));
      throw nextError;
    } finally {
      if (mountedRef.current) setIsMutating(false);
    }
  }, [refresh]);

  const markRead = useCallback(
    async (notificationId: string) => {
      setIsMutating(true);
      setError(null);

      try {
        const response = await markNotificationRead(notificationId);
        await refresh();
        return response;
      } catch (nextError) {
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const archive = useCallback(
    async (notificationId: string) => {
      setIsMutating(true);
      setError(null);

      try {
        const response = await archiveNotification(notificationId);
        await refresh();
        return response;
      } catch (nextError) {
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.status === "unread" || !notification.readAt,
      ).length,
    [notifications],
  );

  return {
    notifications,
    total,
    unreadCount,
    filters,
    setFilters,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    markAllRead,
    markRead,
    archive,
  };
}
