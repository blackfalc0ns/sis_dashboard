"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import {
  getNotificationMuted,
  setNotificationMuted,
} from "@/features/communication/hooks/useNotificationSound";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

interface TopNavProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  notificationCount?: number;
  notifications?: CommunicationNotification[];
  notificationsError?: string | null;
  notificationsLoading?: boolean;
  notificationsRefreshing?: boolean;
  notificationsMutating?: boolean;
  schoolName?: string;
  onSearchChange?: (value: string) => void;
  onLanguageChange?: () => void;
  onNotificationClick?: () => void;
  onNotificationRefresh?: () => void;
  onNotificationMarkAllRead?: () => Promise<unknown> | void;
  onNotificationMarkRead?: (notificationId: string) => Promise<unknown> | void;
  onNotificationSelect?: (notification: CommunicationNotification) => void;
  onProfileClick?: () => void;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function TopNav({
  userName = "Ahmed Mostafa",
  userRole = "Admin",
  userAvatar,
  notificationCount = 0,
  notifications = [],
  notificationsError = null,
  notificationsLoading = false,
  notificationsRefreshing = false,
  notificationsMutating = false,
  schoolName = "School Name",
  onSearchChange,
  onNotificationClick,
  onNotificationRefresh,
  onNotificationMarkAllRead,
  onNotificationMarkRead,
  onNotificationSelect,
  onProfileClick,
  onMenuToggle,
  isSidebarOpen = true,
}: TopNavProps) {
  const t = useTranslations();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            type="button"
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Title (takes available space, truncates on small screens) */}
          <div className="min-w-fit lg:flex-0 sm:flex-1 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="sm:text-sm md:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                {t("hello_school", { schoolName })}
              </h1>
              <span className="text-xl sm:text-2xl shrink-0">👋</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
              {t("lead_new_generation")}
            </p>
          </div>

          {/* Desktop Search (hidden on mobile) */}
          <div className="hidden lg:flex flex-1 max-w-full justify-center items">
            <div className="relative flex-1 max-w-2xl">
              <input
                type="text"
                placeholder={t("search_placeholder")}
                onChange={(e) => onSearchChange?.(e.target.value)}
                suppressHydrationWarning
                className="hover:border-primary-600 w-full ps-4 pe-10 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 placeholder:text-center focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              />
              {/* use logical property: icon at end (works in RTL/LTR) */}
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 sm:h-[50px] sm:w-[50px]"
                aria-label={`${t("notifications")}${notificationCount > 0 ? `, ${notificationCount}` : ""}`}
                aria-expanded={notificationsOpen}
                type="button"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 end-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen ? (
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={notificationCount}
                  isLoading={notificationsLoading}
                  isRefreshing={notificationsRefreshing}
                  isMutating={notificationsMutating}
                  error={notificationsError}
                  onClose={() => setNotificationsOpen(false)}
                  onOpenCenter={onNotificationClick}
                  onRefresh={onNotificationRefresh}
                  onMarkAllRead={onNotificationMarkAllRead}
                  onMarkRead={onNotificationMarkRead}
                  onSelect={onNotificationSelect}
                />
              ) : null}
            </div>

            <LanguageSwitcher />

            {/* User Profile Dropdown */}
            <ProfileDropdown
              userName={userName}
              userRole={userRole}
              userAvatar={userAvatar}
              onProfileClick={onProfileClick}
              t={t}
            />
          </div>
        </div>

        {/* Mobile/Tablet Search (shows up until lg) */}
        <div className="lg:hidden mt-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder={t("search_placeholder")}
              onChange={(e) => onSearchChange?.(e.target.value)}
              suppressHydrationWarning
              className="w-full ps-4 pe-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  isRefreshing,
  isMutating,
  error,
  onClose,
  onOpenCenter,
  onRefresh,
  onMarkAllRead,
  onMarkRead,
  onSelect,
}: {
  notifications: CommunicationNotification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isMutating: boolean;
  error: string | null;
  onClose: () => void;
  onOpenCenter?: () => void;
  onRefresh?: () => void;
  onMarkAllRead?: () => Promise<unknown> | void;
  onMarkRead?: (notificationId: string) => Promise<unknown> | void;
  onSelect?: (notification: CommunicationNotification) => void;
}) {
  const visibleNotifications = notifications.slice(0, 8);
  const hasNotifications = visibleNotifications.length > 0;

  const handleOpenCenter = () => {
    onClose();
    onOpenCenter?.();
  };

  return (
    <div
      className="absolute end-0 top-full z-50 mt-3 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-100/80 via-white/40 to-transparent" />
      <div className="relative border-b border-slate-200/80 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-950">Notifications</p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                : "You are all caught up"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200/80 bg-white/70 text-slate-600 transition-colors duration-200 hover:bg-white hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh notifications"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={() => void onMarkAllRead?.()}
              disabled={unreadCount === 0 || isMutating}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 text-xs font-bold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all
            </button>
          </div>
        </div>
      </div>

      <div
        className="relative max-h-[22rem] overflow-y-auto px-2 py-2 [scrollbar-color:#a5b4fc_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-indigo-300 [&::-webkit-scrollbar-track]:bg-transparent"
        aria-live="polite"
      >
        {isLoading ? (
          <NotificationPanelState
            icon={<Loader2 className="h-6 w-6 animate-spin" />}
            title="Loading notifications"
            description="Fetching your latest communication updates."
          />
        ) : error ? (
          <NotificationPanelState
            icon={<AlertCircle className="h-6 w-6" />}
            title="Unable to load notifications"
            description={error}
            tone="danger"
          />
        ) : hasNotifications ? (
          <div className="space-y-1.5">
            {visibleNotifications.map((notification) => (
              <NotificationDropdownItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
                onSelect={(selectedNotification) => {
                  onClose();
                  onSelect?.(selectedNotification);
                }}
              />
            ))}
          </div>
        ) : (
          <NotificationPanelState
            icon={<EmptyNotificationsIllustration />}
            title="No notifications yet"
            description="New messages, announcements, and school updates will appear here."
          />
        )}
      </div>

      <div className="relative border-t border-slate-200/80 bg-white/70 px-4 py-3">
        <button
          type="button"
          onClick={handleOpenCenter}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          View notification center
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NotificationDropdownItem({
  notification,
  onMarkRead,
  onSelect,
}: {
  notification: CommunicationNotification;
  onMarkRead?: (notificationId: string) => Promise<unknown> | void;
  onSelect?: (notification: CommunicationNotification) => void;
}) {
  const isUnread = notification.status === "unread" || !notification.readAt;
  const title = notification.title || notification.titleEn || "Untitled update";
  const body = notification.body || notification.bodyEn || "No preview available.";

  return (
    <button
      type="button"
      onClick={() => {
        if (isUnread) void onMarkRead?.(notification.id);
        onSelect?.(notification);
      }}
      className="group grid w-full cursor-pointer grid-cols-[2.25rem_1fr] gap-3 rounded-xl border border-transparent bg-white/45 px-3 py-3 text-start transition-colors duration-200 hover:border-indigo-100 hover:bg-white/85 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          isUnread
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Bell className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="flex items-start justify-between gap-3">
          <span className="line-clamp-1 text-sm font-bold text-slate-950">
            {title}
          </span>
          {isUnread ? (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
          ) : null}
        </span>
        <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
          {body}
        </span>
        <span className="mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
          <span className="capitalize">
            {(notification.sourceModule || notification.type || "system").replace(
              /_/g,
              " ",
            )}
          </span>
          <span>{formatNotificationTime(notification.createdAt)}</span>
        </span>
      </span>
    </button>
  );
}

function NotificationPanelState({
  icon,
  title,
  description,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <div
      className="flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center"
      role={tone === "danger" ? "alert" : "status"}
    >
      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
          tone === "danger"
            ? "bg-rose-50 text-rose-600"
            : "bg-indigo-50 text-indigo-600"
        }`}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-1 max-w-64 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function EmptyNotificationsIllustration() {
  return (
    <svg
      viewBox="0 0 96 96"
      className="h-14 w-14"
      role="img"
      aria-label="Empty notifications"
    >
      <circle cx="48" cy="48" r="38" fill="#eef2ff" />
      <path
        d="M30 60h36l-4-7v-9c0-8-5.5-14-14-14S34 36 34 44v9l-4 7Z"
        fill="#6366f1"
      />
      <path
        d="M43 65h10c-.8 3-2.4 4.5-5 4.5S43.8 68 43 65Z"
        fill="#1e1b4b"
      />
      <path
        d="M62 28l6-6M70 41h8M26 41h-8"
        stroke="#10b981"
        strokeLinecap="round"
        strokeWidth="4"
      />
    </svg>
  );
}

function formatNotificationTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ProfileDropdown({
  userName,
  userRole,
  userAvatar,
  onProfileClick,
  t,
}: {
  userName: string;
  userRole: string;
  userAvatar?: string;
  onProfileClick?: () => void;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(getNotificationMuted());
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setNotificationMuted(next);
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } catch {
      // Ignore errors — redirect anyway
    }
    router.push("/");
  };

  return (
    <>
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
        type="button"
      >
        <div className="hidden md:block text-right">
          <p className="text-sm font-semibold text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">{userRole || t("admin")}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={userName}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          )}
        </div>
      </button>

      {open ? (
        <div className="absolute end-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          {/* Profile */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onProfileClick?.();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <span className="text-base">👤</span>
            {t("profile") || "Profile"}
          </button>

          {/* Change Password */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setShowChangePassword(true);
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <KeyRound className="h-4 w-4 text-gray-500" />
            {t("change_password") || "Change Password"}
          </button>

          {/* Notification Sound Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-gray-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-gray-500" />
            )}
            {muted
              ? (t("unmute_notifications") || "Unmute notifications")
              : (t("mute_notifications") || "Mute notifications")}
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-gray-100" />

          {/* Logout */}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            {t("logout") || "Logout"}
          </button>
        </div>
      ) : null}
    </div>

    {/* Change Password Dialog */}
    {showChangePassword ? (
      <ChangePasswordDialog
        onClose={() => setShowChangePassword(false)}
        t={t}
      />
    ) : null}
    </>
  );
}

function ChangePasswordDialog({
  onClose,
  t,
}: {
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { changePassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t("passwords_do_not_match") || "Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError(t("password_too_short") || "Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {t("change_password") || "Change Password"}
        </h2>

        {success ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
            {t("password_changed_successfully") || "Password changed successfully!"}
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("current_password") || "Current Password"}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("new_password") || "New Password"}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("confirm_password") || "Confirm Password"}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-hover disabled:opacity-60"
              >
                {isSubmitting
                  ? (t("saving") || "Saving...")
                  : (t("save") || "Save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
