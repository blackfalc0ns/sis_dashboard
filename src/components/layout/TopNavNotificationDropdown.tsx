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

interface TopNavNotificationDropdownProps {
  notifications: CommunicationNotification[];
  unreadCount: number;
  onMarkRead: (notificationId: string) => Promise<unknown> | void;
  onMarkAllRead: () => Promise<unknown> | void;
  onArchive: (notificationId: string) => Promise<unknown> | void;
  isOpen: boolean;
  onClose: () => void;
  activeTab: "all" | "chat" | "announcements" | "academics";
  onTabChange: (tab: "all" | "chat" | "announcements" | "academics") => void;
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
    all?: string;
    chat?: string;
    announcements?: string;
    academics?: string;
  };
}

export default function TopNavNotificationDropdown({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onArchive,
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  labels,
}: TopNavNotificationDropdownProps) {
  const router = useRouter();
  const locale = useLocale();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Track mute state locally to handle state update correctly
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // Initialise and sync with sound control state
    setMuted(getNotificationMuted());
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
    all: labels?.all ?? "All",
    chat: labels?.chat ?? "Chat",
    announcements: labels?.announcements ?? "Announcements",
    academics: labels?.academics ?? "Academics",
  };

  const displayedNotifications = activeTab === "academics"
    ? notifications.filter((n) =>
        ["attendance", "grades", "behavior", "reinforcement"].includes(
          n.sourceModule || "",
        ),
      )
    : notifications;

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
      className="absolute end-0 top-full z-50 mt-3 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
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
      <div className="flex border-b border-slate-100 bg-white px-2" role="tablist" aria-label="Notification filters">
        {(["all", "chat", "announcements", "academics"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = mergedLabels[tab];
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab)}
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
        role="listbox"
        aria-label="Notification list"
      >
        {displayedNotifications.length > 0 ? (
          <div className="space-y-1.5">
            {displayedNotifications.map((notification) => {
              const isUnread =
                notification.status === "unread" ||
                (notification.status !== "read" && !notification.readAt);
              const Icon = getNotificationIcon(notification.type, notification.sourceModule);

              const title = notification.title || notification.titleEn || "Untitled update";
              const body = notification.body || notification.bodyEn || "No preview available.";

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
                  role="button"
                  tabIndex={0}
                  onClick={handleCardClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleCardClick();
                    }
                  }}
                  className="group grid w-full cursor-pointer grid-cols-[2.25rem_1fr_2rem] gap-3 rounded-xl border border-transparent bg-white px-3 py-3 text-start transition-colors duration-200 hover:border-slate-100 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {/* Left Icon Area */}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isUnread
                        ? "bg-primary-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  {/* Middle Content Area */}
                  <span className="min-w-0">
                    <span className="flex items-start gap-1.5 flex-wrap">
                      <span className="line-clamp-1 text-sm font-bold text-slate-950">
                        {title}
                      </span>
                      {notification.priority && (notification.priority === "urgent" || notification.priority === "high") ? (
                        <span className="inline-block shrink-0 mt-0.5">
                          {getPriorityBadge(notification.priority, mergedLabels)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {body}
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
                      <span className="capitalize">
                        {(notification.sourceModule || notification.type || "system").replace(/_/g, " ")}
                      </span>
                      <span>{formatNotificationTime(notification.createdAt)}</span>
                    </span>
                  </span>

                  {/* Right Action/Indicator Area */}
                  <span className="flex flex-col items-center justify-between h-full shrink-0">
                    {/* Unread dot */}
                    <span className="h-4 flex items-center justify-center">
                      {isUnread ? (
                        <span
                          data-testid="unread-indicator"
                          className="h-2 w-2 rounded-full bg-rose-500"
                        />
                      ) : (
                        <span className="h-2 w-2" />
                      )}
                    </span>

                    {/* Archive button */}
                    <span className="h-7 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(notification.id);
                        }}
                        aria-label="Archive notification"
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
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
    </div>
  );
}
