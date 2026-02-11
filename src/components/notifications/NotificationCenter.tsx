// FILE: src/components/notifications/NotificationCenter.tsx

"use client";

import { useState } from "react";
import { Bell, X, Check, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/types/notifications";

interface NotificationCenterProps {
  guardianId: string;
}

export default function NotificationCenter({
  guardianId,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(guardianId);

  const getStageIcon = (notification: Notification) => {
    if (notification.stage.includes("test")) return "📝";
    if (notification.stage.includes("interview")) return "👥";
    if (notification.stage.includes("decision_accepted")) return "🎉";
    if (notification.stage.includes("decision")) return "📋";
    if (notification.stage.includes("enrollment")) return "🎓";
    if (notification.stage.includes("document")) return "📄";
    return "📬";
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="w-3 h-3" />;
      case "sms":
        return <Smartphone className="w-3 h-3" />;
      case "in_app":
        return <MessageSquare className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-[#036b80] hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#036b80] to-[#024d5c]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold text-[#036b80] bg-white rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mark All as Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="mt-2 text-xs text-white hover:text-gray-200 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.readAt ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 text-2xl">
                          {getStageIcon(notification)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-sm font-semibold ${
                                !notification.readAt
                                  ? "text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.readAt && (
                              <div className="w-2 h-2 bg-[#036b80] rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>

                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Student Name */}
                          <p className="text-xs text-[#036b80] font-medium mt-1">
                            {notification.studentName}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>

                            {/* Channels */}
                            <div className="flex items-center gap-1">
                              {notification.channels.map((channel) => (
                                <div
                                  key={channel}
                                  className={`p-1 rounded ${
                                    notification.status[channel] === "sent"
                                      ? "text-green-600 bg-green-50"
                                      : notification.status[channel] ===
                                          "failed"
                                        ? "text-red-600 bg-red-50"
                                        : "text-gray-400 bg-gray-50"
                                  }`}
                                  title={`${channel}: ${notification.status[channel]}`}
                                >
                                  {getChannelIcon(channel)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
