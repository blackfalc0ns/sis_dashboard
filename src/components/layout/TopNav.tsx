"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  KeyRound,
  LogOut,
  Menu,
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
import { useNotifications } from "@/features/communication/hooks/useNotifications";
import TopNavNotificationDropdown from "./TopNavNotificationDropdown";

interface TopNavProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  schoolName?: string;
  onSearchChange?: (value: string) => void;
  onLanguageChange?: () => void;
  onProfileClick?: () => void;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function TopNav({
  userName = "Ahmed Mostafa",
  userRole = "Admin",
  userAvatar,
  schoolName = "School Name",
  onSearchChange,
  onProfileClick,
  onMenuToggle,
  isSidebarOpen = true,
}: TopNavProps) {
  const t = useTranslations();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "chat" | "announcements" | "academics">("all");
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();
  const {
    notifications: liveNotifications,
    unreadCount: liveUnreadCount,
    markRead: liveMarkRead,
    markAllRead: liveMarkAllRead,
    archive: liveArchive,
    setFilters: setLiveFilters,
  } = useNotifications({ recipientUserId: user?.id });

  const handleTabChange = (tab: "all" | "chat" | "announcements" | "academics") => {
    setActiveTab(tab);
    let sourceModuleVal: "" | "communication" | "announcements" = "";
    if (tab === "chat") {
      sourceModuleVal = "communication";
    } else if (tab === "announcements") {
      sourceModuleVal = "announcements";
    }
    setLiveFilters((prev) => ({
      ...prev,
      sourceModule: sourceModuleVal,
    }));
  };

  const notificationLabels = {
    title: t("notifications") === "notifications" ? "Notifications" : t("notifications"),
    all: t("all") === "all" ? "All" : t("all"),
    chat: t("chat") === "chat" ? "Chat" : t("chat"),
    announcements: t("announcements") === "announcements" ? "Announcements" : t("announcements"),
    academics: t("academics") === "academics" ? "Academics" : t("academics"),
  };

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
                aria-label={`${t("notifications")}${liveUnreadCount > 0 ? `, ${liveUnreadCount}` : ""}`}
                aria-expanded={notificationsOpen}
                type="button"
              >
                <Bell className="h-5 w-5" />
                {liveUnreadCount > 0 && (
                  <span className="absolute -top-1 end-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-white">
                    {liveUnreadCount > 99 ? "99+" : liveUnreadCount}
                  </span>
                )}
              </button>

              <TopNavNotificationDropdown
                notifications={liveNotifications}
                unreadCount={liveUnreadCount}
                onMarkRead={liveMarkRead}
                onMarkAllRead={liveMarkAllRead}
                onArchive={liveArchive}
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                labels={notificationLabels}
              />
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
