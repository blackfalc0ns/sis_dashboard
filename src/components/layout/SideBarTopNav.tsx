"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useTranslations, useLocale } from "next-intl";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function SideBarTopNav({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const t = useTranslations();
  const locale = useLocale();

  // Detect if current locale is RTL
  const isRTL = locale === "ar";

  // Set initial sidebar state based on screen size
  useEffect(() => {
    setIsClient(true);

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

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          onSelect={() => {}}
          schoolName={t("school_name")}
          isOpen={false}
          onToggle={() => {}}
          isRTL={isRTL}
        />
        <div className="flex-1 flex flex-col transition-all duration-300 lg:ml-20">
          <TopNav
            userName="Ahmed Mostafa"
            userRole="Admin"
            notificationCount={1}
            onSearchChange={(value) => console.log("Search:", value)}
            onLanguageChange={() => console.log("Language changed")}
            onNotificationClick={() => console.log("Notifications clicked")}
            onProfileClick={() => console.log("Profile clicked")}
            onMenuToggle={() => {}}
            isSidebarOpen={false}
          />
          <div className="bg-background min-h-screen">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        onSelect={() => {}}
        schoolName={t("school_name")}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isRTL={isRTL}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isRTL ? (isSidebarOpen ? "lg:mr-[260px]" : "lg:mr-20") : isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-20"}`}
      >
        <TopNav
          userName="Ahmed Mostafa"
          userRole="Admin"
          notificationCount={1}
          onSearchChange={(value) => console.log("Search:", value)}
          onLanguageChange={() => console.log("Language changed")}
          onNotificationClick={() => console.log("Notifications clicked")}
          onProfileClick={() => console.log("Profile clicked")}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="bg-background min-h-screen">{children}</div>
      </div>
    </div>
  );
}
