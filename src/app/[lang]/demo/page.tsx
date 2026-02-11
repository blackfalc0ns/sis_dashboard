"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SchoolDashboard from "@/components/dashboard/SchoolDashboard";
import { useTranslations } from "next-intl";

export default function DemoPage() {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const t = useTranslations();

  // Detect if current locale is RTL
  const isRTL =
    typeof window !== "undefined" && document.documentElement.dir === "rtl";

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeItem={activeItem}
        onSelect={setActiveItem}
        schoolName={t("school_name")}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isRTL={isRTL}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isRTL
            ? isSidebarOpen
              ? "lg:mr-[240px]"
              : "lg:mr-20"
            : isSidebarOpen
              ? "lg:ml-[240px]"
              : "lg:ml-20"
        }`}
      >
        <TopNav
          userName="Ammar Abd Elbari"
          userRole="Admin"
          notificationCount={1}
          onSearchChange={(value) => console.log("Search:", value)}
          onLanguageChange={() => console.log("Language changed")}
          onNotificationClick={() => console.log("Notifications clicked")}
          onProfileClick={() => console.log("Profile clicked")}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1">
          <SchoolDashboard />
        </main>
      </div>
    </div>
  );
}
