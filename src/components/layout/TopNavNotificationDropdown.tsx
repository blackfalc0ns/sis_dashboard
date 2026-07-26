"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Bell,
  Megaphone,
  MessageSquare,
  Calendar,
  Award,
  ShieldAlert,
  Gift,
  AlertTriangle,
  Archive,
  Volume2,
  VolumeX,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  getNotificationMuted,
  setNotificationMuted,
} from "@/features/communication/hooks/useNotificationSound";
import { getMessage } from "@/features/communication/api/communication.service";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function getCommunicationConversationId(
  notification: CommunicationNotification,
): string | undefined {
  const deepLink =
    recordValue(notification.deepLink) ?? recordValue(notification.deep_link);
  const metadata = recordValue(notification.metadata);
  const sourceType =
    stringValue(notification.sourceType) ?? stringValue(notification.source_type);
  const entityType =
    stringValue(notification.entityType) ?? stringValue(notification.entity_type);

  return (
    (deepLink?.type === "conversation_message"
      ? stringValue(deepLink.conversationId) ??
        stringValue(deepLink.conversation_id)
      : undefined) ??
    stringValue(notification.conversationId) ??
    stringValue(notification.conversation_id) ??
    stringValue(metadata?.conversationId) ??
    stringValue(metadata?.conversation_id) ??
    (sourceType === "conversation"
      ? stringValue(notification.sourceId) ??
        stringValue(notification.source_id)
      : undefined) ??
    (entityType === "conversation"
      ? stringValue(notification.entityId) ??
        stringValue(notification.entity_id)
      : undefined)
  );
}

function getNotificationSourceType(notification: CommunicationNotification) {
  return (
    stringValue(notification.sourceType) ??
    stringValue(notification.source_type)
  );
}

function getNotificationSourceId(notification: CommunicationNotification) {
  return stringValue(notification.sourceId) ?? stringValue(notification.source_id);
}

function getNotificationMessageId(
  notification: CommunicationNotification,
): string | undefined {
  const sourceType = getNotificationSourceType(notification);

  if (sourceType === "message") {
    return getNotificationSourceId(notification);
  }

  if (notification.type?.startsWith("message_")) {
    return getNotificationSourceId(notification);
  }

  return undefined;
}

function isAnnouncementNotification(notification: CommunicationNotification) {
  const deepLink =
    recordValue(notification.deepLink) ?? recordValue(notification.deep_link);
  const sourceType = getNotificationSourceType(notification)?.toLowerCase();
  const sourceModule = notification.sourceModule?.toLowerCase();
  const type = notification.type?.toLowerCase();

  return (
    deepLink?.type === "announcement" ||
    type === "announcement_published" ||
    sourceModule === "announcements" ||
    Boolean(sourceType?.includes("announcement"))
  );
}

type NotificationTab = "all" | "chat" | "announcements";

interface TopNavNotificationDropdownProps {
  notifications: CommunicationNotification[];
  unreadCount: number;
  onMarkRead: (notificationId: string) => Promise<unknown> | void;
  onMarkAllRead: () => Promise<unknown> | void;
  onArchive: (notificationId: string) => Promise<unknown> | void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<unknown> | void;
  isOpen: boolean;
  onClose: () => void;
  activeTab?: NotificationTab;
  onTabChange?: (tab: NotificationTab) => void;
  labels?: {
    title?: string;
    unreadCount?: string;
    markAllRead?: string;
    emptyStateTitle?: string;
    emptyStateDesc?: string;
    archive?: string;
    urgent?: string;
    high?: string;
    mute?: string;
    unmute?: string;
    loading?: string;
    errorTitle?: string;
    retry?: string;
    refresh?: string;
    listLabel?: string;
    tabsLabel?: string;
    viewAll?: string;
    untitled?: string;
    noPreview?: string;
    system?: string;
    all?: string;
    chat?: string;
    announcements?: string;
    unread?: string;
    read?: string;
    archived?: string;
  };
}

export default function TopNavNotificationDropdown({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onArchive,
  isLoading = false,
  isRefreshing = false,
  error,
  onRefresh,
  isOpen,
  onClose,
  activeTab = "all",
  onTabChange,
  labels,
}: TopNavNotificationDropdownProps) {
  const router = useRouter();
  const locale = useLocale();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Track mute state locally to handle state update correctly
  const [muted, setMuted] = useState(getNotificationMuted);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    const opened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!opened) {
      return;
    }

    // Re-sync if another notification control changed the persisted preference
    // while this dropdown was closed.
    void Promise.resolve().then(() => setMuted(getNotificationMuted()));
  }, [isOpen]);

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setNotificationMuted(nextMuted);
    setMuted(nextMuted);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mergedLabels = {
    title: labels?.title ?? "Notifications",
    unreadCount: labels?.unreadCount ?? (unreadCount === 1 ? "1 unread update" : `${unreadCount} unread updates`),
    markAllRead: labels?.markAllRead ?? "Mark all",
    emptyStateTitle: labels?.emptyStateTitle ?? "No notifications yet",
    emptyStateDesc: labels?.emptyStateDesc ?? "New messages, announcements, and school updates will appear here.",
    archive: labels?.archive ?? "Archive",
    urgent: labels?.urgent ?? "Urgent",
    high: labels?.high ?? "High",
    mute: labels?.mute ?? "Mute notifications",
    unmute: labels?.unmute ?? "Unmute notifications",
    loading: labels?.loading ?? "Loading notifications",
    errorTitle: labels?.errorTitle ?? "Unable to load notifications",
    retry: labels?.retry ?? "Retry",
    refresh: labels?.refresh ?? "Refresh notifications",
    listLabel: labels?.listLabel ?? "Notification list",
    tabsLabel: labels?.tabsLabel ?? "Notification filters",
    viewAll: labels?.viewAll ?? "View all notifications",
    untitled: labels?.untitled ?? "Untitled update",
    noPreview: labels?.noPreview ?? "No preview available.",
    system: labels?.system ?? "System",
    all: labels?.all ?? "All",
    chat: labels?.chat ?? "Chat",
    announcements: labels?.announcements ?? "Announcements",
    unread: labels?.unread ?? "Unread",
    read: labels?.read ?? "Read",
    archived: labels?.archived ?? "Archived",
  };

  // Resolve route target using the same conversation target as message toasts.
  const getNotificationUrl = (notification: CommunicationNotification) => {
    const conversationId = getCommunicationConversationId(notification);
    if (conversationId) {
      return `/${locale}/communication/conversations?conversationId=${encodeURIComponent(conversationId)}`;
    }

    if (isAnnouncementNotification(notification)) {
      return `/${locale}/communication/notifications?notificationId=${encodeURIComponent(notification.id)}`;
    }
    return null;
  };

  const getAsyncNotificationUrl = async (
    notification: CommunicationNotification,
  ) => {
    const messageId = getNotificationMessageId(notification);
    if (!messageId) return null;

    const response = await getMessage(messageId);
    const message = recordValue(response);
    const payload = recordValue(message?.data) ?? recordValue(message?.item);
    const conversationId =
      stringValue(message?.conversationId) ??
      stringValue(message?.conversation_id) ??
      stringValue(payload?.conversationId) ??
      stringValue(payload?.conversation_id);

    return conversationId
      ? `/${locale}/communication/conversations?conversationId=${encodeURIComponent(conversationId)}`
      : null;
  };

  // Helper to map notification type to Lucide icons
  const getNotificationIcon = (type?: string, sourceModule?: string) => {
    const key = type || sourceModule || "";
    if (key.includes("announcement")) return Megaphone;
    if (key.includes("message") || key.includes("communication")) return MessageSquare;
    if (key.includes("attendance")) return Calendar;
    if (key.includes("grade")) return Award;
    if (key.includes("behavior")) return ShieldAlert;
    if (key.includes("reinforcement")) return Gift;
    if (key.includes("system_alert") || key.includes("system")) return AlertTriangle;
    return Bell;
  };

  const getPriorityBadge = (priority?: string, currentLabels?: typeof mergedLabels) => {
    if (priority === "urgent") {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
          {currentLabels?.urgent || "Urgent"}
        </span>
      );
    }
    if (priority === "high") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          {currentLabels?.high || "High"}
        </span>
      );
    }
    return null;
  };

  const formatNotificationTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed start-4 end-4 top-[72px] z-50 w-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:absolute sm:start-auto sm:end-0 sm:top-full sm:mt-3 sm:w-96 sm:max-w-none"
      role="dialog"
      aria-label={mergedLabels.title}
    >
      {/* Header */}
      <div className="relative border-b border-slate-200/80 px-4 py-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-950">{mergedLabels.title}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {mergedLabels.unreadCount}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onRefresh?.()}
              disabled={isRefreshing || !onRefresh}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={mergedLabels.refresh}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
              aria-label={muted ? mergedLabels.unmute : mergedLabels.mute}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            {/* Mark All Read Button */}
            <button
              type="button"
              onClick={() => void onMarkAllRead()}
              disabled={unreadCount === 0}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {mergedLabels.markAllRead}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white px-2" role="tablist" aria-label={mergedLabels.tabsLabel}>
        {(["all", "chat", "announcements"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = mergedLabels[tab];
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange?.(tab)}
              className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition-all duration-200 focus:outline-none capitalize ${
                isActive
                  ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div
        className="relative max-h-[22rem] overflow-y-auto px-2 py-2"
        role="list"
        aria-label={mergedLabels.listLabel}
      >
        {isLoading ? (
          <div className="space-y-2 p-1" aria-label={mergedLabels.loading}>
            {[0, 1, 2].map((skeleton) => (
              <div
                key={skeleton}
                className="grid animate-pulse grid-cols-[2.25rem_1fr] gap-3 rounded-xl px-3 py-3"
              >
                <span className="h-9 w-9 rounded-xl bg-slate-200" />
                <span className="space-y-2">
                  <span className="block h-3 w-2/3 rounded bg-slate-200" />
                  <span className="block h-3 w-full rounded bg-slate-100" />
                  <span className="block h-2 w-1/3 rounded bg-slate-100" />
                </span>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </span>
            <p className="text-sm font-bold text-slate-950">
              {mergedLabels.errorTitle}
            </p>
            <button
              type="button"
              onClick={() => void onRefresh?.()}
              disabled={isRefreshing || !onRefresh}
              className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {mergedLabels.retry}
            </button>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-1.5">
            {notifications.map((notification) => {
              const isUnread =
                notification.status === "unread" ||
                (notification.status !== "read" && !notification.readAt);
              const Icon = getNotificationIcon(notification.type, notification.sourceModule);

              const title =
                notification.title || notification.titleEn || mergedLabels.untitled;
              const body =
                notification.body || notification.bodyEn || mergedLabels.noPreview;

              const handleCardClick = async () => {
                if (isUnread) {
                  void onMarkRead(notification.id);
                }
                try {
                  const target =
                    getNotificationUrl(notification) ??
                    (await getAsyncNotificationUrl(notification));
                  if (target) {
                    router.push(target);
                  }
                } catch (error) {
                  console.warn("Failed to resolve notification target:", error);
                } finally {
                  onClose();
                }
              };

              return (
                <div
                  key={notification.id}
                  role="listitem"
                  className="group grid w-full grid-cols-[1fr_2rem] rounded-xl border border-transparent bg-white transition-colors duration-200 hover:border-slate-100 hover:bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => void handleCardClick()}
                    className="grid min-w-0 grid-cols-[2.25rem_1fr] gap-3 rounded-s-xl px-3 py-3 text-start focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isUnread
                          ? "bg-primary-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-start gap-1.5">
                        <span className="line-clamp-1 text-sm font-bold text-slate-950">
                          {title}
                        </span>
                        {(() => {
                          const isRead = Boolean(notification.readAt);
                          return (
                            <>
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5 ${
                                isRead ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"
                              }`}>
                                {isRead ? mergedLabels.read : mergedLabels.unread}
                              </span>
                              {notification.status && notification.status !== (isRead ? "read" : "unread") ? (() => {
                                let badgeClass = "bg-slate-50 text-slate-600";
                                let badgeLabel = "";
                                const statusStr = notification.status as string;
                                if (statusStr === "archived") {
                                  badgeClass = "bg-amber-50 text-amber-700";
                                  badgeLabel = mergedLabels.archived;
                                } else if (statusStr === "read") {
                                  badgeClass = "bg-slate-100 text-slate-700";
                                  badgeLabel = mergedLabels.read;
                                } else if (statusStr === "unread") {
                                  badgeClass = "bg-blue-50 text-blue-700";
                                  badgeLabel = mergedLabels.unread;
                                } else {
                                  badgeLabel = statusStr.replace(/_/g, " ");
                                }
                                return (
                                  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5 ${badgeClass}`}>
                                    {badgeLabel}
                                  </span>
                                );
                              })() : null}
                            </>
                          );
                        })()}
                        {notification.priority &&
                        (notification.priority === "urgent" ||
                          notification.priority === "high") ? (
                          <span className="mt-0.5 inline-block shrink-0">
                            {getPriorityBadge(notification.priority, mergedLabels)}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {body}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
                        <span className="capitalize">
                          {(notification.sourceModule ||
                            notification.type ||
                            mergedLabels.system
                          ).replace(/_/g, " ")}
                        </span>
                        <span>{formatNotificationTime(notification.createdAt)}</span>
                      </span>
                    </span>
                  </button>

                  <span className="flex h-full shrink-0 flex-col items-center justify-between py-3 pe-2">
                    <span className="flex h-4 items-center justify-center">
                      {isUnread ? (
                        <span
                          data-testid="unread-indicator"
                          className="h-2 w-2 rounded-full bg-rose-500"
                        />
                      ) : (
                        <span className="h-2 w-2" />
                      )}
                    </span>
                    <span className="flex h-7 items-center justify-center">
                      <button
                        type="button"
                        onClick={() => void onArchive(notification.id)}
                        aria-label={`${mergedLabels.archive}: ${title}`}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-950">{mergedLabels.emptyStateTitle}</p>
            <p className="mt-1 max-w-64 text-xs leading-5 text-slate-600">
              {mergedLabels.emptyStateDesc}
            </p>
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 bg-white p-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push(`/${locale}/communication/notifications`);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {mergedLabels.viewAll}
          <ArrowRight
            className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
