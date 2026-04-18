"use client";

import { Search, Bell, Menu, X } from "lucide-react";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslations } from "next-intl";

interface TopNavProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  notificationCount?: number;
  onSearchChange?: (value: string) => void;
  onLanguageChange?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function TopNav({
  userName = "Ahmed Mostafa",
  userRole = "Admin",
  userAvatar,
  notificationCount = 1,
  onSearchChange,
  onNotificationClick,
  onProfileClick,
  onMenuToggle,
  isSidebarOpen = true,
}: TopNavProps) {
  const t = useTranslations();

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
                {t("hello_school")}
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
                className="hover:border-primary-600 w-full ps-4 pe-10 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 placeholder:text-center focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              />
              {/* use logical property: icon at end (works in RTL/LTR) */}
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <button
              onClick={onNotificationClick}
              className="relative flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] hover:bg-gray-100 transition-colors border-2 rounded-lg border-neutral-200"
              aria-label={t("notifications")}
              type="button"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <LanguageSwitcher />

            {/* User Profile */}
            <button
              onClick={onProfileClick}
              className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              type="button"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {userName}
                </p>
                <p className="text-xs text-gray-500">
                  {userRole || t("admin")}
                </p>
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
          </div>
        </div>

        {/* Mobile/Tablet Search (shows up until lg) */}
        <div className="lg:hidden mt-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder={t("search_placeholder")}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full ps-4 pe-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
