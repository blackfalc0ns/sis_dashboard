"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface MessageNotification {
  id: string;
  conversationId: string;
  senderName: string;
  body: string;
  timestamp: number;
}

interface NotificationToastProps {
  notifications: MessageNotification[];
  onDismiss: (id: string) => void;
  onClick: (conversationId: string) => void;
}

export function NotificationToastContainer({
  notifications,
  onDismiss,
  onClick,
}: NotificationToastProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 end-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[90vw]">
      {notifications.slice(0, 3).map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
          onClick={() => onClick(notification.conversationId)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onDismiss,
  onClick,
}: {
  notification: MessageNotification;
  onDismiss: () => void;
  onClick: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg transition hover:bg-slate-50 animate-in slide-in-from-top-2"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {notification.senderName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 text-start">
        <p className="truncate text-sm font-bold text-slate-900">
          {notification.senderName}
        </p>
        <p className="truncate text-xs text-slate-600">
          {notification.body}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </button>
  );
}
