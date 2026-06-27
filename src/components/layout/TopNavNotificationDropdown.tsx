"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

interface TopNavNotificationDropdownProps {
  notifications: CommunicationNotification[];
  unreadCount: number;
  onMarkRead: (notificationId: string) => Promise<unknown> | void;
  onMarkAllRead: () => Promise<unknown> | void;
  onArchive: (notificationId: string) => Promise<unknown> | void;
  isOpen: boolean;
  onClose: () => void;
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
  labels,
}: TopNavNotificationDropdownProps) {
  const router = useRouter();
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
  };

  // Helper to resolve route target based on deepLink object
  const getDeepLinkUrl = (deepLink: any) => {
    if (!deepLink) return null;
    if (deepLink.type === "conversation_message") {
      return `/communication?conversationId=${deepLink.conversationId}`;
    }
    if (deepLink.type === "announcement") {
      return `/communication?announcementId=${deepLink.announcementId}`;
    }
    return null;
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

      {/* Notifications List */}
      <div
        className="relative max-h-[22rem] overflow-y-auto px-2 py-2"
        role="listbox"
        aria-label="Notification list"
      >
        {notifications.length > 0 ? (
          <div className="space-y-1.5">
            {notifications.map((notification) => {
              const isUnread =
                notification.status === "unread" ||
                (notification.status !== "read" && !notification.readAt);
              const Icon = getNotificationIcon(notification.type, notification.sourceModule);

              const title = notification.title || notification.titleEn || "Untitled update";
              const body = notification.body || notification.bodyEn || "No preview available.";

              const handleCardClick = () => {
                if (isUnread) {
                  onMarkRead(notification.id);
                }
                const target = getDeepLinkUrl(notification.deepLink);
                if (target) {
                  router.push(target);
                }
                onClose();
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
                      handleCardClick();
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
