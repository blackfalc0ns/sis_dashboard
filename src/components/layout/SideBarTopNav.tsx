"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import GlobalMessageNotifications from "@/features/communication/components/GlobalMessageNotifications";
import { useNotifications } from "@/features/communication/hooks/useNotifications";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useBrandingProfile } from "@/features/settings/hooks/useBrandingProfile";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function SideBarTopNav({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isRefreshing: notificationsRefreshing,
    isMutating: notificationsMutating,
    error: notificationsError,
    refresh: refreshNotifications,
    markAllRead: markAllNotificationsRead,
    markRead: markNotificationRead,
  } = useNotifications({ recipientUserId: user?.id });
  const { profile: brandingProfile } = useBrandingProfile();

  // Hide sidebar/topnav on conversation pages (full-screen chat)
  const isFullScreenChat = pathname.includes("/communication/conversations");

  // Detect if current locale is RTL
  const isRTL = locale === "ar";
  const userName =
    user === null
      ? "Ahmed Mostafa"
      : `${user.firstName} ${user.lastName}`.trim();
  const userRole = user?.activeMembership?.roleKey ?? user?.userType;
  const schoolName = brandingProfile?.schoolName?.trim() || t("school_name");
  const shortSchoolName =
    brandingProfile?.shortName?.trim() || t("short_school_name");

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const notificationCenterPath = `/${locale}/communication/notifications`;

  const handleNotificationSelect = useCallback(
    (notification: CommunicationNotification) => {
      const targetHref =
        notificationTargetHref(notification, locale) ?? notificationCenterPath;

      router.push(targetHref);
    },
    [locale, notificationCenterPath, router],
  );

  // Full-screen mode for conversations — collapse sidebar (expandable) and hide topnav
  if (isFullScreenChat) {
    return (
      <div className="h-[100dvh] overflow-x-clip bg-gray-50">
        <GlobalMessageNotifications />
        <Sidebar
          onSelect={() => {}}
          schoolName={schoolName}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isRTL={isRTL}
        />
        <div
          className={`flex h-[100dvh] flex-col transition-all duration-300 ${isRTL ? (isSidebarOpen ? "lg:mr-[260px]" : "lg:mr-20") : isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-20"}`}
        >
          <div className="bg-background h-full min-h-0">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-gray-50">
      <GlobalMessageNotifications />
      <Sidebar
        onSelect={() => {}}
        schoolName={schoolName}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isRTL={isRTL}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isRTL ? (isSidebarOpen ? "lg:mr-[260px]" : "lg:mr-20") : isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-20"}`}
      >
        <TopNav
          userName={userName}
          userRole={userRole}
          notificationCount={unreadCount}
          notifications={notifications}
          notificationsLoading={notificationsLoading}
          notificationsRefreshing={notificationsRefreshing}
          notificationsMutating={notificationsMutating}
          notificationsError={notificationsError}
          schoolName={shortSchoolName}
          onSearchChange={(value) => console.log("Search:", value)}
          onLanguageChange={() => console.log("Language changed")}
          onNotificationClick={() =>
            router.push(notificationCenterPath)
          }
          onNotificationRefresh={() => void refreshNotifications()}
          onNotificationMarkAllRead={() => markAllNotificationsRead()}
          onNotificationMarkRead={(notificationId) =>
            markNotificationRead(notificationId)
          }
          onNotificationSelect={handleNotificationSelect}
          onProfileClick={() => console.log("Profile clicked")}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="bg-background min-h-[calc(100vh-89px)]">{children}</div>
      </div>
    </div>
  );
}

function notificationTargetHref(
  notification: CommunicationNotification,
  locale: string,
): string | null {
  const deepLink = recordValue(notification.deepLink);
  const metadata = recordValue(notification.metadata);
  const type = stringValue(notification.type);
  const sourceModule = stringValue(notification.sourceModule);

  if (deepLink?.type === "conversation_message") {
    const conversationId = stringValue(deepLink.conversationId);
    if (conversationId) {
      return `/${locale}/communication/conversations?conversationId=${conversationId}`;
    }
  }

  if (deepLink?.type === "announcement") {
    const announcementId = stringValue(deepLink.announcementId);
    if (announcementId) {
      return `/${locale}/communication/announcements/${announcementId}`;
    }
  }

  if (type?.startsWith("message_")) {
    const conversationId =
      stringValue(notification.conversationId) ??
      stringValue(metadata?.conversationId);

    if (conversationId) {
      return `/${locale}/communication/conversations?conversationId=${conversationId}`;
    }
  }

  if (
    type === "announcement_published" ||
    sourceModule === "announcements"
  ) {
    const announcementId =
      stringValue(notification.sourceId) ??
      stringValue(notification.entityId) ??
      stringValue(metadata?.announcementId);

    if (announcementId) {
      return `/${locale}/communication/announcements/${announcementId}`;
    }
  }

  return null;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
